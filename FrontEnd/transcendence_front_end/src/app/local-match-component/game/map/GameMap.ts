import { Mesh, Vector3, Scene, HemisphereLight, RectAreaLight, CircleGeometry, SpotLight, DirectionalLight} from "three";
import GameEntity from "../entitiy/GameEntity";
import ResourceManager from "../utils/resourceManager";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { MeshStandardMaterial } from "three";


RectAreaLightUniformsLib.init();

class GameMap extends GameEntity
{
	private _scene: Scene
	private _resources: ResourceManager;

	constructor(position: Vector3, scene: Scene)
	{
		super(position);
		this._scene = scene;
		this._resources = ResourceManager.getInstance();
	}

	public override load = async () =>
	{
		await this._resources.load();

		const background : Mesh = this._resources.getResource('background');
		this._scene.add(background);

		const plane : Mesh = this._resources.getResource('plane');
		plane.geometry.scale(window.innerWidth * 2, window.innerHeight * 2, 0);
		plane.position.z = -100;
		this._scene.add(plane);

	/* 	const middleLine : Mesh = this._resources.getResource('middleLine');
		this._scene.add(middleLine);
 */
		const circle : Mesh = this._resources.getResource('middleCircle');
		circle.position.x = -125;
		circle.position.z = -21;
		this._scene.add(circle);

		const circle2 : Mesh = this._resources.getResource('middleCircle2');
		circle2.position.x = 125;
		circle2.position.z = -21;
		circle2.scale.x = -1;
		this._scene.add(circle2);
		
		const spotLight = new DirectionalLight(0x3273a8, 250);
		spotLight.position.set(0, 0, -50);
		spotLight.lookAt(0, 0, 0);
		this._scene.add(spotLight);

		const light = new HemisphereLight(0xffffff, 0xffffff, 1 );
		this._scene.add(light);
	}
}

export default GameMap;