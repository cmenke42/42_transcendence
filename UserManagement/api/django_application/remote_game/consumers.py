import asyncio
import json
from typing import TYPE_CHECKING, Dict, Optional, Union

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .match_types import MatchType
from .pong_game.pong_game import Paddle, PongGame
from .utils import get_match
from channels.layers import get_channel_layer

from .pong_game.pong_game import MatchTypeHint

class PlayerMovementSerializer(serializers.Serializer):
    direction = serializers.ChoiceField(choices=['up', 'down', 'neutral'])

class PaddleMovementSerializer(serializers.Serializer):
    type = serializers.CharField()
    data = PlayerMovementSerializer()

if TYPE_CHECKING:
    from django.contrib.auth.models import AnonymousUser
    from users.models import CustomUser

UserType = Union['CustomUser', 'AnonymousUser']

GAME_ROOM_JOINING_TIMEOUT_SECONDS = 300

class GameRoom:
    """
    A class representing a game session and its players.
    """
    def __init__(self, match_type: MatchType, match_id):
        self.match_type = match_type
        self.match_id = match_id
        self.pong_game = PongGame(channel_group_name=self.group_name, match_id=match_id, match_type=match_type)
        self.players = {} # player_number: channel_name
        self.lock = asyncio.Lock()
        self._game_started = False
        self._timeout_task = None

    @property
    def group_name(self):
        return f"pong_game_{self.match_type}_{self.match_id}"
    
    async def add_player(self, player_number, channel_name) -> bool:
        async with self.lock:
            if player_number in self.players:
                return False
            self.players[player_number] = channel_name

            if self._timeout_task is None:
                self._timeout_task = asyncio.create_task(self._handle_timeout())


            player_count = len(self.players)
            if player_count == 2:
                self._timeout_task.cancel()
                self._timeout_task = None
                game_start_task = asyncio.create_task(self.pong_game.start())
                self._game_started = True
            return True
    
    async def remove_player(self, player_number, channel_name) -> bool:
        async with self.lock:
            if (
                player_number not in self.players or
                self.players[player_number] != channel_name
            ):
                return False

            self.players.pop(player_number)
            if self._game_started:
                if player_number == 1:
                    self.pong_game.winner_player_number = 2
                elif player_number == 2:
                    self.pong_game.winner_player_number = 1
                await self.pong_game.stop()
            return True

    def delete(self):
        pass

    async def _handle_timeout(self):
        print('starting joining timeout for game room', GAME_ROOM_JOINING_TIMEOUT_SECONDS)
        await asyncio.sleep(GAME_ROOM_JOINING_TIMEOUT_SECONDS)
        room_manager = await GameRoomManagerSingleton.get_instance()
        await room_manager.delete_room(self.match_type, self.match_id)
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            self.group_name,
            {
                "type": "game_disconnect",
                "message": "",
            }
        )



class GameRoomManagerSingleton:
    """
    A singleton class to manage game rooms.
    """
    _instance = None
    _lock = asyncio.Lock()


    def __new__(cls):
        if not cls._instance:
            cls._instance = super(GameRoomManagerSingleton, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):  # This prevents reinitialization
            self.rooms = {match_type: {} for match_type in MatchType}
            self.lock = asyncio.Lock()
            self.initialized = True

    @classmethod
    async def get_instance(cls):
        async with cls._lock:
            if not cls._instance:
                cls._instance = GameRoomManagerSingleton()
            return cls._instance

    async def get_game_room(self, match_type: MatchType, match_id) -> GameRoom:
        async with self.lock:
            return self.rooms[match_type].setdefault(
                match_id,
                GameRoom(match_type, match_id),
                )

    async def delete_room(self, match_type: MatchType, match_id):
        print("Deleting room......")
        async with self.lock:
            game_room: Optional[GameRoom] = self.rooms[match_type].pop(match_id, None)
        if game_room is not None:
            game_room.delete()
            del game_room
        print("Room deleted")
        print(self.rooms)

class PongGameConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for pong game matches.
    """

    @property
    def _match_id(self) -> str:
        return self.scope['url_route']['kwargs']['match_id']

    @property
    def _match_type(self):
        return MatchType.from_string(self.scope['url_route']['kwargs']['match_type'])

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_room = None
        self.group_name = None
        self.paddle: Optional[Paddle] = None
        self.player_number = None

    async def connect(self):
        user: UserType = self.scope['user']
        match: MatchTypeHint = None
        if (
            user.is_authenticated and
            self._match_type and
            (match := await get_match(self._match_type, self._match_id)) and
            not match.is_played and
            match.player_1 and match.player_2 and
            user.id in (match.player_1.pk, match.player_2.pk)
        ):
            room_manager = await GameRoomManagerSingleton.get_instance()
            self.game_room = await room_manager.get_game_room(
                self._match_type,
                self._match_id,
            )
            self.player_number = 1 if user.id == match.player_1.pk else 2
            if not await self.game_room.add_player(self.player_number, self.channel_name):
                await self.close()
                return

            self.group_name = self.game_room.group_name
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            if self.player_number == 1:
                self.paddle = self.game_room.pong_game.game_world.paddle1
            else:
                self.paddle = self.game_room.pong_game.game_world.paddle2
        else:
            await self.close()
            return

        await self.accept()

    async def disconnect(self, close_code):
        print("Player disconnected as player:", self.player_number)
        if self.game_room:
            user: UserType = self.scope['user']
            success = await self.game_room.remove_player(self.player_number, self.channel_name)
            if success:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        serializer = PaddleMovementSerializer(data=data)
        try:
            if serializer.is_valid(raise_exception=True):
                validated_data = serializer.validated_data
                if validated_data["type"] == "paddle_movement":
                    if validated_data['data']['direction'] == "up":
                        self.paddle.set_moving_direction(Paddle.Directions.UP)
                    elif validated_data['data']['direction'] == "down":
                        self.paddle.set_moving_direction(Paddle.Directions.DOWN)
                    elif validated_data['data']['direction'] == "neutral":
                        self.paddle.set_moving_direction(Paddle.Directions.NEUTRAL)
        except ValidationError as e:
            print("Validation error: ", e.detail)

    async def game_state_update(self, event):
        message = {
            "type": "game_state_update",
            "data": event["message"]
        }
        await self.send(text_data=json.dumps(message))

    async def game_end(self, event):
        message = {
            "type": "game_end",
            "data": event["message"] # something like (timestamp of start, duration, and purpose)
        }
        await self.send(text_data=json.dumps(message))
        await self.close(code=1000)
    
    async def game_disconnect(self, event):
        self.game_room = None
        print("disconnecting player cause opponent didnt join in time")
        await self.close(code=1000)

    async def game_send_timer(self, event):
        print("sending timer")
        message = {
            "type": "game_timer",
            "data": event["message"] # something like (timestamp of start, duration, and purpose)
        }
        await self.send(text_data=json.dumps(message))
