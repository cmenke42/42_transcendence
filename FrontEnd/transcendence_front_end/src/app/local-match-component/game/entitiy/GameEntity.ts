import {Box3, BoxGeometry, Mesh, Sphere, SphereGeometry, Vector3} from "three";

abstract class GameEntity
{
	protected _position: Vector3;
	protected _mesh = new Mesh();
	protected _collider?: Box3 | Sphere;

	public get collider(){
		return this._collider;
	}

	public get mesh(){
		return this._mesh;
	}
	public get position(){
		return this._position;
	}
	public set position(position: Vector3){
		this._position = position;
		this._mesh.position.copy(position);
	}
	constructor(position: Vector3)
	{
		this._position = position;
		this._mesh.position.copy(position);
	}
	public load = async () => {};
	public update = async (delta : number) => {};
}

export default GameEntity;