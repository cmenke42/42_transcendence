import { effect, EventEmitter, Injectable, OnDestroy, signal } from '@angular/core';
import { WebGLRenderer, PerspectiveCamera, Clock, Scene, Vector3, RectAreaLight, BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import { Player } from './entitiy/Player';
import { Ball } from './entitiy/Ball';
import AGameEntity from './entitiy/AGameEntity';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GameMap } from './map/GameMap';
import { ResourceKey, ResourceManagerService } from './utils/resource-manager.service';
import { RemoteGameService } from '../../../service/remote-game.service';
import * as THREE from 'three';
import { IGameEndUpdate, IGameStateUpdate, IGameTimer, MatchType } from '../../../interface/remote-game.interface';
import { Wall } from './entitiy/Wall';
import { Timer } from './entitiy/Timer';
import { createSignal, SIGNAL } from '@angular/core/primitives/signals';

export const BASE_WIDTH = 1600;
export const BASE_HEIGHT = 900;
export const PADDLE_HEIGHT = 200
export const PADDLE_WIDTH = 20
export const WALL_HEIGHT = 25 // Y axis
export const WALL_DEPTH = 20 // Z axis
export const PADDLE_START_POSITION_X = BASE_WIDTH / 2 - PADDLE_WIDTH / 2;
export const BALL_RADIUS = 10;
export const BALL_STARTING_SPEED = 700;
export const BALL_MAX_STARTING_ANGLE_DEGREES = 50
export const BALL_MAX_PADDLE_BOUNCE_ANGLE_DEGREES = 45;
export const MAX_SCORE = 5;
export const COLLISION_THRESHOLD = 0.5;
export const GAME_UPDATE_INTERVAL = 1 / 80;
export const BACKEND_ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;
export const GAME_START_DELAY_SECONDS = 5.2;

enum GameStatus {
  NotStarted = 0,
  Running,
  Paused,
  Stopped,
}

const GameStatusButtonTexts: { [key in GameStatus]: string } = {
  [GameStatus.NotStarted]: 'Start Game',
  [GameStatus.Running]: 'Pause Game',
  [GameStatus.Paused]: 'Resume Game',
  [GameStatus.Stopped]: 'Back to menu',
}

export function gameStatusKeyToString(key: GameStatus): string {
  return GameStatusButtonTexts[key];
}

// @Injectable({
//   providedIn: 
// })
@Injectable()
export class GameSceneService {

  private animationFrameId: number | null = null;
  private _isPaused = true;
  private controls: any;
  private _paused = true;
  private _width: number;
  private _height: number;
  private _renderer: WebGLRenderer;
  private _camera: PerspectiveCamera;
  private _clock = new Clock();

  private readonly _scene = new Scene();
  private _gameEntities: AGameEntity[] = [];

  private _player1!: Player;
  private _player2!: Player;

  private _ball!: Ball;

  private _matchType: MatchType | null = null;

  private _handleOnWindowResizeBound: () => void;

  private _lag = 0;

  private _timer!: Timer;

  private _gameStatus = signal<GameStatus>(GameStatus.NotStarted);

  public get width() {
    return this._width;
  }

  public get height() {
    return this._height;
  }

  get scene() {
    return this._scene;
  }

  public get gameEntities() {
    return this._gameEntities;
  }

  public get matchType(): MatchType {
    if (!this._matchType) {
      throw new Error('Match type is not set.');
    }
    return this._matchType;
  }

  public get gameStatus(): GameStatus {
    return this._gameStatus();
  }

  public set matchType(value: MatchType) {
    this._matchType = value;
  }

  public set paused(value: boolean) {
    this._paused = value;
  }

  constructor(
    private _resourceManagerService: ResourceManagerService,
    private _remoteGameService: RemoteGameService,
  ) {

    this._isPaused = true;
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._renderer = this.initializeRenderer();
    this._camera = this.initializeCamera();
    this.controls = this.initializeOrbitControls(this._camera, this._renderer.domElement);
    this._scene.background = new THREE.Color(0x000000);

    this._handleOnWindowResizeBound = this.onWindowResize.bind(this);
    window.addEventListener('resize', this._handleOnWindowResizeBound);

    this.initializeGameEntities();

    this.setupEffect();

    this.onWindowResize();
    this.render = this.render.bind(this);
  }

  private initializeRenderer() {
    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    return renderer;
  }

  private initializeCamera() {
    const camera = new PerspectiveCamera(75, BACKEND_ASPECT_RATIO, 0.1, 2000);
    camera.position.set(0, 0, 800);
    return camera;
  }

  private initializeOrbitControls(camera: PerspectiveCamera, rendererDomElement: HTMLCanvasElement) {
    const controls = new OrbitControls(camera, rendererDomElement);
    // Set zoom limits
    controls.minDistance = 680; // Minimum zoom (closest)
    controls.maxDistance = 1575; // Maximum zoom (farthest)

    // Set rotation limits
    controls.minAzimuthAngle = -0.56; // Leftmost rotation (in radians)
    controls.maxAzimuthAngle = 0.56;  // Rightmost rotation (in radians)

    // Set vertical rotation limits
    controls.minPolarAngle = 0.81; // Highest point (in radians)
    controls.maxPolarAngle = 2.1; // Lowest point (in radians)

    // Restrict movement to rotation and zoom only
    controls.enablePan = false;
    return controls;
  }

  private initializeGameEntities() {
    const map = new GameMap(new Vector3(0, 0, 0), this._resourceManagerService, this);
    this._gameEntities.push(map);

    this._ball = new Ball(new Vector3(0, 0, 0), this._resourceManagerService, this);
    this._gameEntities.push(this._ball);

    this._timer = new Timer(new Vector3(0, 0, -15), this._resourceManagerService, this);
    this._gameEntities.push(this._timer);

    this.initializePlayers();
    this.createWalls();
  }

  private initializePlayers() {
    this._player1 = this.createPlayer(-PADDLE_START_POSITION_X, "Player1", 1);
    this._gameEntities.push(this._player1);

    this._player2 = this.createPlayer(PADDLE_START_POSITION_X, "Player2", 2);
    this._gameEntities.push(this._player2);
  }

  private createPlayer(positionX: number, name: string, id: number): Player {
    return new Player(
      new Vector3(positionX, 0, 0),
      name,
      1000,
      id,
      this._resourceManagerService,
      this,
      this._remoteGameService
    );
  }

  private createWalls() {
    const yMax = BASE_HEIGHT / 2;
    const wallAddition = WALL_HEIGHT / 2;
    const yWallPosition = yMax - wallAddition;

    const topWall = new Wall(new Vector3(0, yWallPosition, 0), this._resourceManagerService, this);
    this._gameEntities.push(topWall);

    const bottomWall = new Wall(new Vector3(0, -yWallPosition, 0), this._resourceManagerService, this);
    this._gameEntities.push(bottomWall);
  }

  public setupEffect() {
    effect(() => {
      this.updateCountdownTimer(this._remoteGameService.gameTimer());
    }, { allowSignalWrites: true });
  }

  private updateCountdownTimer(data: IGameTimer | null): void {
    if (!data) return;
    console.debug("updating timer");

    const startTime = new Date(data.start_time_ISO);
    const currentTime = new Date();
    const remainingTimeMs = startTime.getTime() - currentTime.getTime();
    console.log(startTime);
    console.log(currentTime);
    console.log(remainingTimeMs);

    const secondsToDisplay = remainingTimeMs / 1000

    this._timer.startTimer(secondsToDisplay);
    this._remoteGameService.gameTimer.set(null);
  }

  private onWindowResize() {
    const scale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);

    const displayWidth = Math.min(BASE_WIDTH * scale, 1600);
    const displayHeight = Math.min(BASE_HEIGHT * scale, 900);

    this._renderer.setSize(displayWidth, displayHeight);
    this._camera.aspect = BACKEND_ASPECT_RATIO;
    this._camera.updateProjectionMatrix();
    this.controls.update();
    console.debug("Resized");
  }

  public initialize(targetElement: HTMLDivElement) {
    targetElement.appendChild(this._renderer.domElement);
  }

  public async load() {
    await this.gameEntityLoader();
  }

  private async gameEntityLoader() {
    for (const gameEntity of this._gameEntities) {
      await gameEntity.load();
      this._scene.add(gameEntity.mesh);
    }
  }

  public startGame(): void {
    if (this._gameStatus() !== GameStatus.NotStarted) {
      console.warn("Game already started. Cannot start again.");
      return;
    }
    this._renderer.setAnimationLoop(this.render);
    if (this._matchType === MatchType.LOCAL)
    {
      this._timer.startTimer(GAME_START_DELAY_SECONDS)
      setTimeout(() => {
        this._gameStatus.set(GameStatus.Running);
        console.log("Game Started");
      }, GAME_START_DELAY_SECONDS * 1000);
    }
    else {
      this._gameStatus.set(GameStatus.Running);
      console.log("Game Started");
    }
  }

  public togglePauseResume(): void {
    switch (this._gameStatus()) {
      case GameStatus.NotStarted:
        console.warn("Game not started. Can't toggle Pause or Resume");
        break;
      case GameStatus.Paused:
        this._gameStatus.set(GameStatus.Running);
        break;
      case GameStatus.Running:
        this._gameStatus.set(GameStatus.Paused);
        break;
      case GameStatus.Stopped:
        console.warn("Game is stopped. Can't toggle Pause or Resume");
        break;
    }
  }

  public stop(): void {
    this._gameStatus.set(GameStatus.Stopped);
    this._timer.stopTimer();
    this._renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this._handleOnWindowResizeBound);
    this._renderer.dispose();
    this.controls.dispose();
    this._gameEntities = [];
    this._scene.clear();
  }

  private render() {
    const gameState = this._remoteGameService.gameState();
    const deltaTime = this._clock.getDelta();


    if (this._gameStatus() === GameStatus.Running) {
      this._lag += deltaTime;
      while (this._lag >= GAME_UPDATE_INTERVAL) {
        this.updateEntities(GAME_UPDATE_INTERVAL, gameState);
        this._lag -= GAME_UPDATE_INTERVAL;
      }

    }
    this._renderer.render(this._scene, this._camera);
  }

  private updateEntities = async (deltaTime: number, gameState: IGameStateUpdate) => {
    for (const gameEntity of this._gameEntities) {
      gameEntity.update(deltaTime, gameState);
      if (this._matchType === MatchType.LOCAL
        && gameEntity instanceof Ball
        && gameEntity.scorer
      ) {
        this._remoteGameService.updateScore(gameEntity.scorer);
        gameEntity.scorer = 0;
        if (this._remoteGameService.gameState().score1 >= MAX_SCORE || this._remoteGameService.gameState().score2 >= MAX_SCORE) {
          const endGame: IGameEndUpdate = {
            winner: this._remoteGameService.gameState().score1 > this._remoteGameService.gameState().score2 ? this._player1.nickname : this._player2.nickname,
            score1: this._remoteGameService.gameState().score1,
            score2: this._remoteGameService.gameState().score2,
          }
          console.log('Game end:', endGame);
          this._remoteGameService.gameEnd.set(endGame);
        }
      }
    }
  }
}
