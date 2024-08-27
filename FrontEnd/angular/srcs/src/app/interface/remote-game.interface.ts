import { Vector3 } from "three";

export type IWebSocketMessage = IWebSocketRequest | IWebSocketResponse;
export type IWebSocketRequest = {
    type: 'paddle_movement',
    data: IPlayerMovement;
}

export interface IPlayerMovement {
    direction: PlayerMovementDirection;
}

export enum PlayerMovementDirection {
    Up = 'up',
    Down = 'down',
    Neutral = 'neutral'
}

export type IWebSocketResponse = IGameStateUpdateResponse | IGameTimerResponse | IGameEndUpdateResponse;

export interface IGameStateUpdateResponse {
    type: 'game_state_update';
    data: IGameStateUpdate;
}

export interface IGameStateUpdate {
    paddle1: IPaddle;
    paddle2: IPaddle;
    ball: IPongGameBall;
    score1: number;
    score2: number;
}

export interface IPaddle {
    position: Vector3;
}

export interface IPongGameBall {
    position: Vector3;
    velocity: Vector3;
    readius: number;
}

export interface IGameTimerResponse {
    type: 'game_timer';
    data: IGameTimer;
}

export interface IGameTimer {
    start_time_ISO: string;
}

export interface IGameEndUpdateResponse {
    type: 'game_end';
    data: IGameEndUpdate;
}

export interface IGameEndUpdate {
    winner: string;
    score1: number;
    score2: number;
    reason?: string;
}

export enum MatchType {
    TOURNAMENT = "tournament",
    PVP = "1v1",
    LOCAL = "local",
}

export namespace MatchType {
    export function isMatchType(value: string): value is MatchType {
        return Object.values(MatchType).includes(value as MatchType);
    }
}