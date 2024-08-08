import { Injectable, signal, computed, effect, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { IPlayerMovement, IGameStateUpdate, IWebSocketMessage, IGameEndUpdateResponse, IWebSocketResponse, IWebSocketRequest, IGameTimerResponse, IGameStateUpdateResponse, IGameTimer, IGameEndUpdate, PlayerMovementDirection } from '../interface/remote-game.interface';
import { Observable, ObservableInput, catchError, retry, throwError, timer } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Vector3 } from 'three';
import { PADDLE_START_POSITION_X } from '../pages/pong-game/game/game-scene.service';
import { AuthService } from './auth.service';

export const WS_ENDPOINT = environment.wsEndpoint;
export const WS_RECONNECT_ATTEMPTS = environment.remoteGameReconnectAttempts;
export const WS_RECONNECT_INTERVAL = environment.remoteGameReconnectIntervalMilliseconds;

interface IConnectConfig {
  baseUrl?: string;
  urlPath: string;
  reconnect?: boolean;
}

export enum ConnectionStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RETRYING = 'RETRYING',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

@Injectable({
  providedIn: 'root'
})
export class RemoteGameService {
  private connectConfig!: IConnectConfig;
  private subscription: any;
  private wsSubject$: WebSocketSubject<IWebSocketMessage> | undefined;

  // Signals
  connectionStatus = signal<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  gameState = signal<IGameStateUpdate>(
    {
      paddle1: {
        position: new Vector3(-PADDLE_START_POSITION_X, 0, 0)
      },
      paddle2: {
        position: new Vector3(PADDLE_START_POSITION_X, 0, 0)
      },
      ball: {
        position: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        readius: 10
      },
      score1: 0,
      score2: 0,
    }
  );
  gameTimer = signal<IGameTimer | null>(null);
  gameEnd = signal<IGameEndUpdate | null>(null);
  error = signal<string>('');

  constructor(
    private _authService: AuthService,

  ) {
    this.subscription = undefined;
    this.wsSubject$ = undefined;

    // Effect to log connection status changes
    // effect(() => {
    //   console.debug("Connection status updated to:", this.connectionStatus());
    // });
    // effect( () => {
    //   console.debug("gameState:", this.gameState());
    // });
  }

  public updateScore(playerNumber: 1 | 2, score = 1, addToCurrentScore = true) {
    this.gameState.update(state => {
      let newState = { ...state };
      switch (playerNumber) {
        case 1:
          newState.score1 = addToCurrentScore ? state.score1 + score : score;
          break;
        case 2:
          newState.score2 = addToCurrentScore ? state.score2 + score : score;
          break;
      }
      return newState;
    });
  }

  public connect({ baseUrl = WS_ENDPOINT, reconnect = false, ...rest }: IConnectConfig) {
    this.connectConfig = { baseUrl, reconnect, ...rest };
    if (!this.wsSubject$ || this.wsSubject$.closed) {
      this.connectionStatus.set(ConnectionStatus.CONNECTING);
      const url = this.connectConfig.baseUrl + this.connectConfig.urlPath;
      this.wsSubject$ = this.getNewWsSubject(url);

      this.subscription?.unsubscribe();
      this.subscription = this.wsSubject$.pipe(
        retry({
          delay: (error, retryCount) => {
            this.connectionStatus.set(ConnectionStatus.RETRYING);
            console.debug('Retry attempt:', retryCount);
            return this.getBackoffDelay(error, retryCount);
          },
          resetOnSuccess: true,
        }),
        catchError(error => {
          this.connectionStatus.set(ConnectionStatus.ERROR);
          console.error('WebSocket error:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: (message: IWebSocketMessage) => {
          if (this.isIGameStateUpdateResponse(message)) {
            // console.log(new Date().toISOString(), "Sending game state update");
            this.gameState.set(message.data);
          }
          else if (this.isGameTimerResponse(message)) {
            console.debug(message);
            this.gameTimer.set(message.data);
          }
          else if (this.isGameEndUpdateResponse(message)) {
            console.debug(message);    
            this.gameEnd.set(message.data);
          }
          else {
            console.warn('Received unknown message type:', message.type);
          }
        },
        error: (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus.set(ConnectionStatus.ERROR);
          this.error.set('Connection error. Please check your internet connection.');
        },
        complete: () => {
          this.connectionStatus.set(ConnectionStatus.DISCONNECTED);
          this.wsSubject$ = undefined;
          this.error.set('');
          console.debug('WebSocket connection closed');
        }
      });

      if (this.connectionStatus() !== ConnectionStatus.CONNECTED &&
        this.connectionStatus() !== ConnectionStatus.ERROR) {
        this.connectionStatus.set(ConnectionStatus.DISCONNECTED);
        console.debug("WebSocket connection couldn't be established");
      }
    }
  }

  private isIGameStateUpdateResponse(message: IWebSocketMessage): message is IGameStateUpdateResponse {
    return (
      message.type === 'game_state_update' &&
      message.data &&
      typeof message.data === 'object'
    );
  }

  private isGameTimerResponse(message: IWebSocketMessage): message is IGameTimerResponse {
    return (
      message.type === 'game_timer' &&
      message.data &&
      typeof message.data === 'object' &&
      typeof message.data.start_time_ISO === 'string'
    );
  }

  private isGameEndUpdateResponse(message: IWebSocketMessage): message is IGameEndUpdateResponse {
    return (
      message.type === 'game_end' &&
      message.data &&
      typeof message.data === 'object'
    );
  }

  private getBackoffDelay(error: any, retryCount: number): ObservableInput<any> {
    if (retryCount > WS_RECONNECT_ATTEMPTS) {
      return throwError(() => new Error(
        `Retry attempts exceeded. Max retry count: ${WS_RECONNECT_ATTEMPTS}.`
      ));
    }
    const minDelay = WS_RECONNECT_INTERVAL;
    const maxDelay = 60000; // 60 seconds

    let delay = Math.min(minDelay * Math.pow(2, retryCount), maxDelay);
    return timer(delay);
  }

  private getNewWsSubject(url: string) {
    const accessToken = this._authService.getAccessToken() || '';
    const webSocketUrl = new URL(url);
    webSocketUrl.searchParams.append('access_token', accessToken);

    const wsSubjectConfig: WebSocketSubjectConfig<IWebSocketMessage> = {
      url: webSocketUrl.toString(),
      openObserver: {
        next: () => {
          console.debug('WebSocket connection established');
          this.connectionStatus.set(ConnectionStatus.CONNECTED);
          this.error.set('');
        }
      },
      closeObserver: {
        next: () => {
          // Handle close if needed
        }
      },
    };
    return new WebSocketSubject<IWebSocketMessage>(wsSubjectConfig);
  }

  close() {
    this.wsSubject$?.complete();
  }

  sendPaddleMovement(direction: PlayerMovementDirection) {
    if (!this.wsSubject$)
      return;
    const payload: IWebSocketRequest = {
      type: "paddle_movement",
      data: {
        direction: direction
      }
    };
    this.wsSubject$.next(payload);
  }

  ngOnDestroy(): void {
    this.close();
    this.subscription?.unsubscribe();
  }
}
