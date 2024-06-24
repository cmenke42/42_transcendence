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

RectAreaLightUniformsLib.init();
class GameScene{
	private static instance = new GameScene();
	public static getInstance(){
		return this.instance;
	}
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
		this._player1 = new Player(new Vector3(0, 0, 0), "Player1" , 1000 , this._scene, 1);
		this._gameEntities.push(this._player1);
		this._player2 = new Player(new Vector3(0, 0, 0), "Player2" , 1000 , this._scene, 2);
		this._gameEntities.push(this._player2);
		this._ball = new Ball(new Vector3(0, 0, 0), 1, this._scene);
		this._gameEntities.push(this._ball);
		this.createWalls();
	}

	public sleep = (ms: number) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	updateScore () :boolean
	{
		if (this._ball.getXPosition() < -window.innerWidth / 2 - 40)
		{
			this._player2._score.incrementScore();
			console.log("Player 2 Score: ", this._player2._score.getScore());
			return true;
		}
		if (this._ball.getXPosition() > window.innerWidth / 2 + 40)
		{
			this._player1._score.incrementScore();
			console.log("Player 1 Score: ", this._player1._score.getScore());
			return true;
		}
		return false;
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

	private updateEntities = async() =>
	{
		const delta = this._clock.getDelta();
		for (const gameEntity of this._gameEntities)
		{
			gameEntity.update(delta);
			if (this.updateScore() === true)
			{
				this._ball.reset();
			}
			
		}
	}

	public render = () => {
		this.controls.update();
		requestAnimationFrame(this.render);
		this.updateEntities();
		this._renderer.render(this._scene, this._camera);
	}
}

export default GameScene;
