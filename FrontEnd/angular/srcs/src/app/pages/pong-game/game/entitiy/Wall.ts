import { Box3 } from "three";
import { IGameStateUpdate } from "../../../../interface/remote-game.interface";
import AGameEntity from "./AGameEntity";
import { ResourceKey } from "../utils/resource-manager.service";

export class Wall extends AGameEntity
{
	public async load()	{
		await this._resourceManagerService.load();
		const wallMesh = this._resourceManagerService.getResource(ResourceKey.HorizontalWall).mesh
		this._mesh.add(wallMesh.clone());
		this._collider = new Box3().setFromObject(this._mesh);
	}

	public async update(deltaTime: number, gameState: IGameStateUpdate) {
		
	}
}
