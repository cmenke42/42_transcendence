import GameScene from "../scene/GameScene";
import ResourceManager from "../utils/resourceManager";
import GameEntity from "./GameEntity";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import {Box3, Mesh, Scene, Vector3, RectAreaLight,} from "three";
import * as THREE from 'three';
import Wall from "./Wall";
import Score from "../utils/score";

RectAreaLightUniformsLib.init();

type KeyboardState = {
	Up:boolean,
	Down:boolean,
	ESC:boolean,
	Space:boolean,
};

class player extends GameEntity
{
	private _nickname: string;
	private _speed: number;
	private _resources: ResourceManager;
	private _scene: Scene;
	private _playerCount: number;
	public _score: Score;
	private _keyboardState: KeyboardState = {
		Up: false,
		Down: false,
		ESC: false,
		Space: false,
	};

	constructor(position: Vector3, nickName: string, speed: number, scene: Scene, PlayerCount: number)
	{
		super(position);
		this._nickname = nickName;
		this._speed = speed;
		this._playerCount = PlayerCount;
		this._resources = ResourceManager.getInstance();
		this._scene = scene;
		this._score = new Score(0);
		this._collider = new Box3().setFromObject(this._mesh);
		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
	}

	public override load = async () =>
	{
		await this._resources.load();
		if (this._playerCount === 1)
		{
			this._mesh.add(this._resources.getResource('paddle1').clone());
			console.log("this._mesh Player1 ", this._mesh.position);
			const rectLight = new RectAreaLight(0x3273a8, 20, window.innerWidth / 250, window.innerHeight / 9);
			rectLight.position.set((-window.innerWidth / 2) + ((window.innerWidth / 150) * 2), 0, 0);
			console.log("rectLight PLayer1", rectLight.position);
			rectLight.lookAt(-1,-1,-1);
			this._mesh.add(rectLight);
			const rectLightHelper = new RectAreaLightHelper(rectLight);
			rectLight.add(rectLightHelper);
		}
		if (this._playerCount === 2)
		{
			this._mesh.add(this._resources.getResource('paddle2').clone());
			console.log("this._mesh Player 2", this._mesh.position);
			const rectLight = new RectAreaLight(0xe05109, 20, window.innerWidth / 250, window.innerHeight / 9);
			rectLight.position.set((window.innerWidth / 2) - ((window.innerWidth / 150) * 2),0 ,0);
			console.log("rectLight Player 2", rectLight.position);
			rectLight.lookAt(0,0,0);
			this._mesh.add(rectLight);
			const rectLightHelper = new RectAreaLightHelper(rectLight);
			rectLight.add(rectLightHelper);
		}
		this._collider =  new Box3().setFromObject(this._mesh);
		this._scene.add(this._mesh);
	}

	private handleKeyDown = (event: KeyboardEvent) =>
	{
		if (this._playerCount === 1)
		{
			switch(event.key)
			{
				case 'w':
					this._keyboardState.Up = true;
					break;
				case 's':
					this._keyboardState.Down = true;
					break;
				case 'd':
					this._keyboardState.Space = true;
					break;
				case 'Escape':
					this._keyboardState.ESC = true;
					break;
			}
		}
		if (this._playerCount === 2)
		{
			switch(event.key)
			{
				case 'ArrowUp':
					this._keyboardState.Up = true;
					break;
				case 'ArrowDown':
					this._keyboardState.Down = true;
					break;
				case 'ArrowRight':
					this._keyboardState.Space = true;
					break;
				case 'Escape':
					this._keyboardState.ESC = true;
					break;
			}
		}
	}

	private handleKeyUp = (event: KeyboardEvent) =>
	{
		if (this._playerCount === 1)
			{
				switch(event.key)
				{
					case 'w':
						this._keyboardState.Up = false;
						break;
					case 's':
						this._keyboardState.Down = false;
						break;
					case 'd':
						this._keyboardState.Space = false;
						break;
					case 'Escape':
						this._keyboardState.ESC = false;
						break;
				}
			}
			if (this._playerCount === 2)
			{
				switch(event.key)
				{
					case 'ArrowUp':
						this._keyboardState.Up = false;
						break;
					case 'ArrowDown':
						this._keyboardState.Down = false;
						break;
					case 'ArrowRight':
						this._keyboardState.Space = false;
						break;
					case 'Escape':
						this._keyboardState.ESC = false;
						break;
				}
			}
	}

	public override update = async (delta :number) =>
	{
		// if (this._keyboardState.ESC)
		// {
		// 	GameScene.getInstance().pasue;
		// }
		const computedMove = new Vector3(0, 0, 0);
		if (this._keyboardState.Up)
		{
			computedMove.y += this._speed * delta;
		}
		if (this._keyboardState.Down)
		{
			computedMove.y -= this._speed * delta;
		}
		const testingBox = this._collider?.clone();
		if (testingBox)
			testingBox.translate(computedMove);
		const colliders = GameScene.getInstance().getGameEntities().filter((e) => e !== this && e.collider && e.collider.intersectsBox(testingBox as Box3));
		if (colliders.length > 0 && colliders[0] instanceof Wall)
					return;
		this._mesh.position.add(computedMove);
		if (this._collider instanceof THREE.Box3)
			this._collider.setFromObject(this._mesh);
	}
}

export default player;