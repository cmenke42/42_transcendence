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

	constructor(position: Vector3, speed: number, scene: Scene)
	{
		super(position);
		this._speed = new Vector3(200, 150, 0);
		this._bounce = 1;
		this._scene = scene;
		this._resources = ResourceManager.getInstance();
		const collider = new Box3().setFromObject(this._mesh).getBoundingSphere(new Sphere(this._mesh.position.clone()));
		this._collider = collider;
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
		const testingSphere = this._collider?.clone() as Sphere;
		testingSphere.center.add(this._mesh.position.add(new Vector3(this._speed.x * delta, this._speed.y * delta, 0)));
		var colliders = GameScene.getInstance().getGameEntities().filter((e) => e !== this && e.collider && e.collider.intersectsSphere(testingSphere));
		if (colliders.length > 0)
		{
			if (colliders[0] instanceof Ball)
				console.log("Ball collision");
			if (colliders[0] instanceof player)
				this._speed.x *= -1;
			if (colliders[0] instanceof Wall)
				this._speed.y *= -1;
		}
		this._mesh.position.x += this._speed.x * delta;
		this._mesh.position.y += this._speed.y * delta;
		if (this._collider instanceof Box3)
			this._collider.setFromObject(this._mesh);
	}

	public reset = () =>
	{
		this._mesh.position.set(0, 0, 0);
	}

	getXPosition = () =>
	{
		return this._mesh.position.x;
	}
}

export default Ball;