import "../../local-match-component.component.css";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import { BoxGeometry, Clock, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Vector3, WebGLRenderer, RectAreaLight} from "three";
import GameEntity from "../entitiy/GameEntity";
import GameMap from "../map/GameMap";
import Player from "../entitiy/player";
import Ball from "../entitiy/Ball";
import Wall from "../entitiy/Wall";
import Score from "../utils/score";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { SelectMultipleControlValueAccessor } from "@angular/forms";
import { flattenJSON } from "three/src/animation/AnimationUtils";
import { EventEmitter } from "@angular/core";

RectAreaLightUniformsLib.init();
class GameScene{
	private static instance = new GameScene();
	public static getInstance(){
		return this.instance;
	}

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
	private _gameEntities: GameEntity[] = [];

	private _player1: Player;
	private _player2: Player;

	private _ball: Ball;
	public getGameEntities(): GameEntity[]
	{
		return this._gameEntities;
	}

	public set paused(value: boolean)
	{
		this._paused = value;
	}
	private constructor()
	{
		this._isPaused = true;
		this._width = window.innerWidth;
		this._height = window.innerHeight;
		this._renderer = new WebGLRenderer({alpha: true, antialias: true});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(this._width, this._height);
		const ascpectRatio = this._width / this._height;
		this._camera = new PerspectiveCamera(75, ascpectRatio, 0.1, 2000);
		this._camera.position.set(0, 0, 900);
		this.controls = new OrbitControls(this._camera, this._renderer.domElement);
		window.addEventListener('resize', () => {
			this._width = window.innerWidth;
			this._height = window.innerHeight;
			this._renderer.setSize(this._width, this._height);
			this._camera.aspect = this._width / this._height;
			this._camera.updateProjectionMatrix();
		});
		const map = new GameMap(new Vector3(0, 0, 0), this._scene);
		this._gameEntities.push(map);
		// const paddleOffset = window.innerWidth / 2 - 50; // Offset the paddle from the edge of the screen
		this._player1 = new Player(new Vector3(0, 0, 0), "Player1" , 1000 , this._scene, 1);
		// this._player1 = new Player(new Vector3(-paddleOffset, 0, 0), "Player1", 1000, this._scene, 1);
		this._gameEntities.push(this._player1);
		this._player2 = new Player(new Vector3(0, 0, 0), "Player2" , 1000 , this._scene, 2);
		// this._player2 = new Player(new Vector3(paddleOffset, 0, 0), "Player2", 1000, this._scene, 2);
		this._gameEntities.push(this._player2);
		this._ball = new Ball(new Vector3(0, 0, 0), 1, this._scene);
		this._gameEntities.push(this._ball);
		this.createWalls();
		//new
		/* window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp); */
	}

	public sleep = (ms: number) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	public score_changed = new EventEmitter<{player1: number, player2: number}>(); // event emitter for score
	updateScore () :boolean
	{
		let score_changed = false;
		// const halfWidth = this._width / 2;
		if (this._ball.getXPosition() < -window.innerWidth / 2 - 40)
		{
			this._player2._score.incrementScore();
			console.log("Player 2 Score: ", this._player2._score.getScore());
			// return true;
			score_changed = true;
		}
		if (this._ball.getXPosition() > window.innerWidth / 2 + 40)
		{
			this._player1._score.incrementScore();
			console.log("Player 1 Score: ", this._player1._score.getScore());
			// return true;
			score_changed = true;
		}
		if (score_changed)
		{
			this.score_changed.emit({
				player1: this._player1._score.getScore(),
				player2: this._player2._score.getScore()
			});
		}
		return score_changed;
	}

	private createWalls = () =>
	{
		const toplight1 = new RectAreaLight(0xe05109, 100, window.innerWidth / 2, 10);
		toplight1.position.set(window.innerWidth / 4, window.innerHeight / 2 - 10, 0); // Adjust the y-coordinate to place it at the top
		toplight1.lookAt(window.innerWidth / 4 ,window.innerWidth / 4  ,0);
		this._scene.add(toplight1);

		const toplight2 = new RectAreaLight(0x3273a8, 100, window.innerWidth / 2, 10);
		toplight2.position.set(-window.innerWidth / 4, window.innerHeight / 2 - 10, 0); // Adjust the y-coordinate to place it at the top
		toplight2.lookAt(-window.innerWidth / 4 , -window.innerWidth / 4  ,0);
		this._scene.add(toplight2);

		const bottonLight1 = new RectAreaLight(0xe05109, 100, window.innerWidth / 2, 10);
		bottonLight1.position.set(window.innerWidth / 4, -window.innerHeight / 2 - 10, 0); // Adjust the y-coordinate to place it at the top
		bottonLight1.lookAt(window.innerWidth / 4, -window.innerHeight / 4 - 10, 0); // Ensure it looks downwards
		this._scene.add(bottonLight1);

		const bottonLight2 = new RectAreaLight(0x3273a8, 100, window.innerWidth / 2, 10);
		bottonLight2.position.set(-window.innerWidth / 4, -window.innerHeight / 2 - 10, 0); // Adjust the y-coordinate to place it at the top
		bottonLight2.lookAt(-window.innerWidth / 4, -window.innerHeight / 4 - 10, 0); // Ensure it looks downwards
		this._scene.add(bottonLight2);
		
		const topleft = new Vector3(0, window.innerHeight / 2, 0);
		const bottomleft = new Vector3(0, -window.innerHeight / 2, 0);
		this._gameEntities.push(new Wall(topleft, this._scene));
		this._gameEntities.push(new Wall(bottomleft, this._scene));
		/*const topright = new Vector3(window.innerWidth / 2, window.innerHeight / 2, 0);
		const bottomright = new Vector3(window.innerWidth / 2, -window.innerHeight / 2, 0);

		this._gameEntities.push(new Wall(topright, this._scene));
		this._gameEntities.push(new Wall(bottomright, this._scene));

		for (let i = -window.innerWidth / 2; i < window.innerWidth / 2; i += window.innerWidth / 40)
		{
			const top = new Vector3(i, window.innerHeight / 2, 0);
			const bottom = new Vector3(i, -window.innerHeight / 2, 0);
			this._gameEntities.push(new Wall(top, this._scene));
			this._gameEntities.push(new Wall(bottom, this._scene));
		} */
	}

	private display_pause = () =>
	{
		const pause = new Mesh(new BoxGeometry(window.innerWidth, window.innerHeight), new MeshBasicMaterial({color: 0x000000, opacity: 0.5}));
		this._scene.add(pause);
	}

	public initilize(targetElement: HTMLDivElement)
	{
		targetElement.appendChild(this._renderer.domElement);
	}
	
	private async gameEntityLoader()
	{
		for (const gameEntity of this._gameEntities)
		{
			await gameEntity.load();
			this._scene.add(gameEntity.mesh);
		}
	}

	public load = async () =>
	{
		await this.gameEntityLoader();
	}

	private lastUpdateTime: number = 0;

	private updateEntities = async() =>
	{
		if (this._isPaused)
			return;
		const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;

		for (const gameEntity of this._gameEntities) {
            gameEntity.update(deltaTime);
            if (this.updateScore() === true) {
                this._ball.reset();
            }
        }
		/* const delta = this._clock.getDelta();
		for (const gameEntity of this._gameEntities)
		{
			gameEntity.update(delta);
			if (this.updateScore() === true)
			{
				this._ball.reset();
			}
			
		} */
	}

	public render = () => 
	{
		
		if (!this._isPaused)
		{
			this.controls.update();
				// this.updateEntities();
			// requestAnimationFrame(this.render);
			this.updateEntities();
			this._renderer.render(this._scene, this._camera);
		}
		this.animationFrameId = requestAnimationFrame(this.render);
	}

	//new functions 
	// private lastUpdateTime: number = 0;
	public onPauseStateChange = new EventEmitter<boolean>();
	private _isStarted: boolean = false;

	public togglePauseResume(): void 
	{
		if (!this._isStarted)
		{
			this.startGame();
		}
		else
		{
			this._isPaused = !this._isPaused;
			console.log(this._isPaused ? "Game Paused" : "Game Resumed")
			if (!this._isPaused)
			{
				this.lastUpdateTime = performance.now();
			}
			// if (this._isPaused) 
			// 	this.resume();
			// else 
			// 	this.pause();
		}
		this.onPauseStateChange.emit(this._isPaused);
	}

	public startGame(): void {
		if (!this._isStarted)
		{
			this._isStarted = true;
			this._isPaused = false;
			this.lastUpdateTime = performance.now();
			this.render(); // Start the render loop
			console.log("Game Started");
			this.onPauseStateChange.emit(this._isPaused);
		}
    }

	public pause(): void {
	
	if (!this._isPaused && this._isStarted)
	{
		this._isPaused = true;
		this.onPauseStateChange.emit(this._isPaused);
		console.log("Game Paused");
	}

	}
	public resume(): void {

		if (this._isPaused && this._isStarted)
		{
			this._isPaused = false;
			// const currentTime = performance.now();
			this.lastUpdateTime = performance.now();
			for (const entitiy of this._gameEntities)
			{
				if (entitiy instanceof Ball)
					(entitiy as Ball)._lastUpdateTime = performance.now();
			}
			this.onPauseStateChange.emit(this._isPaused);
		}
    }
	
    public stop(): void {
		this._isPaused = true;
		this._isStarted = false;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
        this._gameEntities = [];
        this._scene.clear();
        this._renderer.dispose();
        this.controls.dispose();
		this.onPauseStateChange.emit(true);
    }
	
	public getPlayer1Score()
	{
		return this._player1._score.getScore();
	}
	
	public getPlayer2Score()
	{
		return this._player2._score.getScore();
	}

	public getPlayerState()
	{
		return {
			player1: {
				position : {
					x : this._player1.position.x,
					y : this._player1.position.y,
				},
				score: this._player1._score.getScore(),
			},
			player2 : {
				position: {
					x : this._player2.position.x,
					y : this._player2.position.y,
				},
				score: this._player2._score.getScore(),
			}
		}
	}

	/* 	private handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'w') this._player1._keyboardState.Up = true;
			if (event.key === 's') this._player1._keyboardState.Down = true;
			if (event.key === 'ArrowUp') this._player2._keyboardState.Up = true;
			if (event.key === 'ArrowDown') this._player2._keyboardState.Down = true;
		}
		
		private handleKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'w') this._player1._keyboardState.Up = false;
			if (event.key === 's') this._player1._keyboardState.Down = false;
			if (event.key === 'ArrowUp') this._player2._keyboardState.Up = false;
			if (event.key === 'ArrowDown') this._player2._keyboardState.Down = false;
		} */
	

}

export default GameScene;
