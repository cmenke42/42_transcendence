import ResourceManager from "../utils/resourceManager";
import GameEntity from "./GameEntity";
import {Box3, Scene, Vector3, RectAreaLight} from "three";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

RectAreaLightUniformsLib.init();

class Wall extends GameEntity
{
	private _scene: Scene;
	private _resources: ResourceManager;

	constructor(position : Vector3, scene : Scene) {
		super(position);
		this._position = position;
		this._scene = scene;
		this._resources = ResourceManager.getInstance();
	}

	public override load = async () =>
	{
		await this._resources.load();
		this._mesh.add(this._resources.getResource('cube'));
		this._mesh.position.set(this._position.x, this._position.y, this._position.z);
		this._scene.add(this._mesh);
		this._collider = new Box3().setFromObject(this._mesh);
	}
}

export default Wall;