import asyncio
import datetime
import json
import math
import random
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Union, Type
from django.utils import timezone
from datetime import timedelta

from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django.utils import timezone
from ..match_types import MatchType
from ..utils import get_match
from tournament.models.tournament import Tournament, TournamentError
from django.db import DatabaseError, IntegrityError
from enum import Enum

if TYPE_CHECKING:
    from match.models import Match1v1
    from tournament.models.tournament_match import TournamentMatch

MatchTypeHint = Union['MatchType', 'TournamentMatch']

# Game constants
GAME_WIDTH = 1600
GAME_HEIGHT = 900
BALL_RADIUS = 10
BALL_STARTING_SPEED = 600  # units per second
PADDLE_HEIGHT = 200
PADDLE_VELOCITY = 550
PADDLE_WIDTH = 20
MAX_PADDLE_BOUNCE_ANGLE_DEGREES = 70
START_DELAY = 7.25 # seconds

WALL_HEIGHT = 25 # Y axis

MAX_TOURNAMENT_SAVE_RETRIES = 3
MAX_PONG_GAME_SCORE = 5

class PongGame:
    _UPDATE_RATE: int = 80
    _UPDATE_INTERVAL: float = 1.0 / _UPDATE_RATE
    _RENDER_RATE: int = 80
    _RENDER_INTERVAL: float = 1.0 / _RENDER_RATE

    def __init__(self, channel_group_name, match_type: MatchType, match_id):
        self.game_world = GameWorld()
        self.channel_group_name = channel_group_name
        self._game_task_lock = asyncio.Lock()
        self._game_task = None
        self.winner_player_number: int = 0 # 0, 1, 2
        self._lock = asyncio.Lock()
        self._match_type = match_type
        self._match_id = match_id
    
    async def start(self):
        print("starting game")
        async with self._game_task_lock:
            if self._game_task is not None:
                return

        current_time = timezone.now()
        start_time = current_time + timedelta(seconds=START_DELAY)
        await self._send_timer(start_time.isoformat())
        sleep_time = (start_time - timezone.now()).total_seconds()
        if sleep_time > 0:
            print("sleeping", sleep_time)
            await asyncio.sleep(sleep_time)
        async with self._game_task_lock:
            self._game_task = asyncio.create_task(
                self._enter_game_loop(),
                name="PongGame" + self.channel_group_name
            )

    async def stop(self):
        async with self._game_task_lock:
            if self._game_task is not None:
                print("stopping game")
                self._game_task.cancel()
                self._game_task = None

    async def _enter_game_loop(self):
        try:
            print("starting game")
            await self._game_loop()
        except asyncio.CancelledError:
            print("Game loop cancelled")
        finally:
            from ..consumers import GameRoomManagerSingleton
            print("Game loo final handling")
            await self.handle_game_end()
            self._game_task = None
            room_manager = await GameRoomManagerSingleton.get_instance()
            await room_manager.delete_room(self._match_type, self._match_id)
            print("Game loop ended finally")

    async def _game_loop(self):
        previous_update_time = self._get_current_time()
        previous_render_time = previous_update_time
        lag: float = 0.0

        while True:
            current_time = self._get_current_time()
            delta_time = self._calculate_delta_time(
                previous_update_time,
                current_time,
            )
            previous_update_time = current_time
            lag += delta_time

            self._process_input()

            while lag >= self._UPDATE_INTERVAL:
                self._update_game_world(self._UPDATE_INTERVAL)
                if self.winner_player_number:
                    await self._send_game_state_update()
                    print("one player has won")
                    return
                lag -= self._UPDATE_INTERVAL


            if current_time - previous_render_time >= self._RENDER_INTERVAL:
                await self._send_game_state_update()
                previous_render_time = current_time


            # Sleep until the next frame
            frame_processing_time = self._get_current_time() - previous_update_time
            sleep_time = self._UPDATE_INTERVAL - frame_processing_time
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

    async def handle_game_end(self):
        match: MatchTypeHint = await get_match(self._match_type, self._match_id)
        await self._save_match_result(match)
        await self._send_end_game_message(match)

    async def _save_match_result(self, match: MatchTypeHint):
        if self.winner_player_number == 1:
            match.winner = match.player_1
        elif self.winner_player_number == 2:
            match.winner = match.player_2
        match.player_1_score = self.game_world.score1
        match.player_2_score = self.game_world.score2
        await self._save_match_to_database(match)

    @database_sync_to_async
    def _save_match_to_database(self, match: MatchTypeHint):
        for attempt in range(MAX_TOURNAMENT_SAVE_RETRIES):
            try:
                if self._match_type == MatchType.TOURNAMENT:
                        Tournament.update_match_and_assign_player_to_next_match(match)
                        return  # Exit if successful
                elif self._match_type == MatchType.PVP:
                    match.is_played = True
                    match.end_time = timezone.now()
                    match.save()
                    return
            except (DatabaseError, IntegrityError) as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt == MAX_TOURNAMENT_SAVE_RETRIES - 1:
                    raise TournamentError("Failed to update match after multiple attempts.") from e

    def _get_current_time(self):
        return time.perf_counter()

    def _calculate_delta_time(self, previous_time, current_time):
        return current_time - previous_time
    
    def _process_input(self):
        pass

    def _update_game_world(self, delta_time):
        self.game_world.update(delta_time)
        if self.game_world.score_changed:
            if self.game_world.score1 >= MAX_PONG_GAME_SCORE:
                self.winner_player_number = 1
            elif self.game_world.score2 >= MAX_PONG_GAME_SCORE:
                self.winner_player_number = 2


    def _should_send_update(self):
        return True

    async def _send_game_state_update(self):        
        # print(datetime.datetime.now(), "Sending game state update")
        channel_layer = get_channel_layer()
        game_state = self.game_world.get_game_state()
        await channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "game.state.update",
                "message": game_state
            }
        )
    
    async def _send_end_game_message(self, match: MatchTypeHint, reason: str = ""):
        print("Sending end game message")
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "game.end",
                "message": {
                    "winner": match.winner.nickname,
                    "score1": match.player_1_score,
                    "score2": match.player_2_score,
                    "reason": reason,
                }
            }
        )

    async def _send_timer(self, start_time_ISO: str):
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "game.send.timer",
                "message": {
                    "start_time_ISO": start_time_ISO,
                }
            }
        )

@dataclass
class Vector3:
    x: float
    y: float
    z: float

    def __add__(self, other: 'Vector3'):
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other: 'Vector3'):
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)

    def __mul__(self, other):
        if isinstance(other, (float, int)):  # Scalar multiplication
            return Vector3(self.x * other, self.y * other, self.z * other)
        elif isinstance(other, Vector3):  # Element-wise multiplication
            return Vector3(self.x * other.x, self.y * other.y, self.z * other.z)
        else:
            raise TypeError(f"Unsupported operand type(s) for *: 'Vector3' and '{type(other).__name__}'")

    def __truediv__(self, other):
        if isinstance(other, (float, int)):  # Scalar division
            return Vector3(self.x / other, self.y / other, self.z / other)
        elif isinstance(other, Vector3):  # Element-wise division
            return Vector3(self.x / other.x, self.y / other.y, self.z / other.z)
        else:
            raise TypeError(f"Unsupported operand type(s) for /: 'Vector3' and '{type(other).__name__}'")
    
    def normalize(self):
        magnitude = math.sqrt(self.x**2 + self.y**2 + self.z**2)
        if magnitude != 0:
            return Vector3(self.x / magnitude, self.y / magnitude, self.z / magnitude)
        else:
            return Vector3(0, 0, 0)
    
    def to_dict(self):
        return {'x': self.x, 'y': self.y, 'z': self.z}

@dataclass(init=False)
class Paddle:
    _position: Vector3
    TOP_BOUNDARY: float = GAME_HEIGHT / 2 - (PADDLE_HEIGHT / 2 + WALL_HEIGHT)
    BOTTOM_BOUNDARY: float = -TOP_BOUNDARY

    class Directions(Enum):
        NEUTRAL = 0
        UP = 1
        DOWN = 2

    def __init__(self, position: Vector3):
        self._position = position
        self._moving_direction: Paddle.Directions = Paddle.Directions.NEUTRAL

    def get_position(self):
        return self._position

    def set_moving_direction(self, direction: Directions):
        self._moving_direction = direction

    def update(self, delta_time):
        if self._moving_direction == Paddle.Directions.UP:
            self._move(Vector3(0, PADDLE_VELOCITY * delta_time, 0))
        elif self._moving_direction == Paddle.Directions.DOWN:
            self._move(Vector3(0, -PADDLE_VELOCITY * delta_time, 0))

    def _move(self, movement: Vector3):
            # Calculate potential new Y position based on movement
            potential_new_y = self._position.y + movement.y
    
            # Clamp the new Y position to ensure it stays within the game boundaries
            clamped_new_y = max(self.BOTTOM_BOUNDARY, min(potential_new_y, self.TOP_BOUNDARY))

            self._position.y = clamped_new_y
    
    def to_dict(self):
        return {'position': self._position.to_dict()}

    def __str__(self):
        return f"Paddle(position={self._position})"

    # def __str__(self):
    #     return f"Paddle(position={self.position})"

@dataclass(init=False)
class GameWorld:
    def __init__(self):
        # Adjust paddle positions to be relative to the center
        self.paddle1 = Paddle(Vector3(-GAME_WIDTH / 2 + PADDLE_WIDTH / 2, 0, 0))
        self.paddle2 = Paddle(Vector3(GAME_WIDTH / 2 - PADDLE_WIDTH / 2, 0, 0))
        self._ball = Ball()
        self.score1: int = 0
        self.score2: int = 0
        self.score_changed = False

    def update(self, delta_time):
        self.paddle1.update(delta_time)
        self.paddle2.update(delta_time)

        # Update ball position
        self._ball.position += self._ball.velocity * delta_time
    
        # Check for collisions with top and bottom walls
        if self._ball.position.y - (BALL_RADIUS + PADDLE_WIDTH) <= -GAME_HEIGHT / 2 or self._ball.position.y + (BALL_RADIUS + PADDLE_WIDTH) >= GAME_HEIGHT / 2:
            self._ball.velocity.y *= -1  # Bounce off top or bottom
    
        # Check for collision with left paddle
        if self._ball.position.x - BALL_RADIUS <= -GAME_WIDTH / 2 + PADDLE_WIDTH:
            paddle1_position = self.paddle1.get_position()
            if paddle1_position.y - PADDLE_HEIGHT / 2 <= self._ball.position.y <= paddle1_position.y + PADDLE_HEIGHT / 2:
                self._ball.velocity.x *= -1  # Bounce off paddle
                # Adjust ball position to prevent sticking
                self._ball.position.x = -GAME_WIDTH / 2 + PADDLE_WIDTH + BALL_RADIUS
            else:
                self._ball.reset()
                self.score2 += 1  # Increment score for player 2
                self.score_changed = True
    
        # Check for collision with right paddle
        elif self._ball.position.x + BALL_RADIUS >= GAME_WIDTH / 2 - PADDLE_WIDTH:
            paddle2_position = self.paddle2.get_position()
            if paddle2_position.y - PADDLE_HEIGHT / 2 <= self._ball.position.y <= paddle2_position.y + PADDLE_HEIGHT / 2:
                self._ball.velocity.x *= -1  # Bounce off paddle
                # Adjust ball position to prevent sticking
                self._ball.position.x = GAME_WIDTH / 2 - PADDLE_WIDTH - BALL_RADIUS
            else:
                self._ball.reset()
                self.score1 += 1  # Increment score for player 1
                self.score_changed = True

    def get_game_state(self):
        return {
            "paddle1": self.paddle1.to_dict(),
            "paddle2": self.paddle2.to_dict(),
            "ball": self._ball.to_dict(),
            "score1": self.score1,
            "score2": self.score2,
        }

@dataclass(init=False)
class Ball:
    position: Vector3
    velocity: Vector3
    radius: float

    def __init__(self):
        self.reset()

    def reset(self):
        # Position the ball at the center of the game
        self.position = Vector3(0, 0, 0)

        # Set a random initial direction
        angle = math.radians(random.uniform(-45, 45))
        direction = 1 if random.random() > 0.5 else -1
        
        self.velocity = Vector3(
            math.cos(angle) * BALL_STARTING_SPEED * direction,
            math.sin(angle) * BALL_STARTING_SPEED,
            0
        )
        # self.velocity = self.velocity.normalize()  # This line can be removed as velocity is already set with a direction and speed
        self.radius = BALL_RADIUS
    
    def to_dict(self):
        return {
            'position': self.position.to_dict(),
            'velocity': self.velocity.to_dict(),
            'radius': self.radius
        }

# async def main():
#     game = PongGame()
#     await game.start()

# if __name__ == "__main__":
#     asyncio.run(main())
