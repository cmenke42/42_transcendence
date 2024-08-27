import { Box3, BoxGeometry, Mesh, Scene, Sphere, SphereGeometry, Vector3 } from "three";
import { ResourceManagerService } from "../utils/resource-manager.service";
import { GameSceneService } from "../game-scene.service";
import { IGameStateUpdate } from "../../../../interface/remote-game.interface";

abstract class AGameEntity {
	protected _mesh = new Mesh();
	protected _collider?: Box3 | Sphere;

	constructor(
		protected _position: Vector3,
		protected _resourceManagerService: ResourceManagerService,
		protected _gameSceneService: GameSceneService,
	) {
		this._mesh.position.copy(this._position);
	}

	public get collider() {
		return this._collider;
	}

	public get mesh() {
		return this._mesh;
	}

	public get position() {
		return this._position;
	}

	public set position(position: Vector3) {
		this._position = position;
		this._mesh.position.copy(position);
	}

	public abstract load(): Promise<void>;
	public abstract update(deltaTime: number, gameState: IGameStateUpdate): Promise<void>;
}

export default AGameEntity;