import { elementAt } from "rxjs";
import GameScene from "../scene/GameScene";
import ResourceManager from "../utils/resourceManager";
import GameEntity from "./GameEntity";
import {Box3, Mesh, PointLight, RectAreaLight, Scene, Sphere, Vector3} from "three";
import player from "./player";
import Wall from "./Wall";
import Score from "../utils/score";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

RectAreaLightUniformsLib.init();

class Ball extends GameEntity
{
	private _speed:  Vector3;
	private _scene: Scene;
	private _bounce: number;
	private _resources: ResourceManager;
	public _lastUpdateTime: number;

	private _lastPosition: Vector3;

	constructor(position: Vector3, speed: number, scene: Scene)
	{
		super(position);
		this._speed = new Vector3(200, 150, 0);
		this._bounce = 1;
		this._scene = scene;
		this._resources = ResourceManager.getInstance();
		const collider = new Box3().setFromObject(this._mesh).getBoundingSphere(new Sphere(this._mesh.position.clone()));
		this._collider = collider;

		this._lastUpdateTime = performance.now();
		this._lastPosition = position.clone();
	}

	public override load = async () =>
	{
		await this._resources.load();
		const rectLight = new RectAreaLight(0xffffff, 50);
		rectLight.position.set(this._mesh.position.x, this._mesh.position.y, this._mesh.position.z);
		rectLight.lookAt(0, 0, 0);
		const rectLightHelper = new RectAreaLightHelper(rectLight);
		rectLight.add(rectLightHelper);
		this._mesh.add(rectLight);
		this._mesh.add(this._resources.getResource('ball'));
		this._scene.add(this._mesh);
	}

	public override update = async (delta: number) =>
	{
	
		if (GameScene.getInstance()!.paused)
		{
			this._lastUpdateTime = performance.now();
			return;
		}
		const currentTime = performance.now();
        const actualDelta = (currentTime - this._lastUpdateTime) / 1000; // Convert to seconds
        this._lastUpdateTime = currentTime;

		/* if (this._mesh.position.distanceTo(this._lastPosition) > 1)
			this._mesh.position.copy(this._lastPosition); */
		// Calculate the new position
		const newPosition = this._mesh.position.clone().add(
			this._speed.clone().multiplyScalar(actualDelta)
		);

		const testingSphere = this._collider?.clone() as Sphere;
		testingSphere.center.copy(newPosition);

		var colliders = GameScene.getInstance()!.getGameEntities().filter(
			(e) => e !== this && e.collider && e.collider.intersectsSphere(testingSphere)
		);

		// const testingSphere = this._collider?.clone() as Sphere;
		// testingSphere.center.add(this._mesh.position.add(new Vector3(this._speed.x * actualDelta, this._speed.y * actualDelta, 0)));
		// testingSphere.center.add(this._mesh.position.add(new Vector3(this._speed.x * delta, this._speed.y * delta, 0)));
		var colliders = GameScene.getInstance()!.getGameEntities().filter((e) => e !== this && e.collider && e.collider.intersectsSphere(testingSphere));
		if (colliders.length > 0)
		{
			if (colliders[0] instanceof Ball)
				console.log("Ball collision");
			if (colliders[0] instanceof player)
				this._speed.x *= -1;
			if (colliders[0] instanceof Wall)
				this._speed.y *= -1;
		}
		else
		{
			 // Only update the position if there's no collision
			 this._mesh.position.copy(newPosition);
		}
		this._mesh.position.x += this._speed.x * delta;
		// console.log("postion x: ", this._mesh.position.x);
		this._mesh.position.y += this._speed.y * delta;
		// console.log("postion y: ", this._mesh.position.y);
		// this._lastPosition.copy(this._mesh.position);
		if (this._collider instanceof Box3)
			this._collider.setFromObject(this._mesh);
		// Update the last position
		this._lastPosition.copy(this._mesh.position);
	}

	public reset = () =>
	{
		this._mesh.position.set(0, 0, 0);
	}

	getXPosition = () =>
	{
		return this._mesh.position.x;
	}

	public get ballPosition(): { x: number, y: number }
	{
		return { 
			x: this._mesh.position.x, 
			y: this._mesh.position.y 
		};
	}

	public updatePosition(position: { x: number, y: number }) 
	{
		this._mesh.position.set(position.x, position.y, this._mesh.position.z);
	}
}

export default Ball;