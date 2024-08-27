import { HemisphereLight, RectAreaLight, Vector3 } from "three";
import { IGameStateUpdate } from "../../../../interface/remote-game.interface";
import AGameEntity from "../entitiy/AGameEntity";
import { BASE_HEIGHT, BASE_WIDTH, WALL_HEIGHT } from "../game-scene.service";
import { ResourceKey } from "../utils/resource-manager.service";
import { Wall } from "../entitiy/Wall";

export class GameMap extends AGameEntity {
  public async update(deltaTime: number, gameState: IGameStateUpdate) {

  }

  public async load() {
    await this._resourceManagerService.load();

    this.addBasePlane();
    this.addBackground();
    this.addCircle(ResourceKey.MiddleCircle, -125, 0, -15);
    this.addCircle(ResourceKey.MiddleCircle2, 125, 0, -15, -1);
    this.addLights();
  }

  private addBackground() {
    const background = this._resourceManagerService.getResource(ResourceKey.Background).mesh;
    background.position.z = -16;
    this._mesh.add(background);
  }

  private addBasePlane() {
    const plane = this._resourceManagerService.getResource(ResourceKey.BasePlane).mesh;
    plane.position.set(0, 0, -20);
    plane.geometry.scale(BASE_WIDTH, BASE_HEIGHT, 0);
    this._mesh.add(plane);
  }

  private addCircle(resourceKey: ResourceKey, x: number, y: number, z: number, scaleX: number = 1) {
    const circle = this._resourceManagerService.getResource(resourceKey).mesh;
    circle.position.set(x, y, z);
    circle.scale.x = scaleX;
    this._mesh.add(circle);
  }

  private addLights() {
    const xMax = BASE_WIDTH / 2;
    const yMax = BASE_HEIGHT / 2;
    const wallAddition = WALL_HEIGHT / 2;
    const yWallPosition = yMax - wallAddition;
    const quarterWidth = BASE_WIDTH / 4;
    const quarterHeight = BASE_HEIGHT / 4;

    this.addHemisphereLighting();
    this.addTopLights(yWallPosition, quarterWidth, quarterHeight);
    this.addBottomLights(yWallPosition, quarterWidth, quarterHeight);
    this.addSideLights(xMax);
  }

  private addHemisphereLighting() {
    const light = new HemisphereLight(0xffffff, 0xffffff, 1);
    this._mesh.add(light);
  }

  private addTopLights(yWallPosition: number, quarterWidth: number, quarterHeight: number) {
    // Top Left
    this.createAndaddHorizontalLight(
      0x3273a8,
      -quarterWidth,
      yWallPosition,
      -quarterWidth,
      -quarterHeight
    );
    // Top Right
    this.createAndaddHorizontalLight(0xe05109,
      quarterWidth,
      yWallPosition,
      quarterWidth,
      -quarterHeight,
    );
  }

  private addBottomLights(yWallPosition: number, quarterWidth: number, quarterHeight: number) {
    // Bottom Left
    this.createAndaddHorizontalLight(0x3273a8,
      -quarterWidth,
      -yWallPosition,
      -quarterWidth,
      -quarterHeight,
    );
    // Bottom Right
    this.createAndaddHorizontalLight(0xe05109,
      quarterWidth,
      -yWallPosition,
      quarterWidth,
      -quarterHeight,
    );
  }

  private createAndaddHorizontalLight(
    color: number,
    xPosition: number,
    yPosition: number,
    lookAtX: number,
    lookAtY: number,
  ) {
    const light = new RectAreaLight(color, 100, BASE_WIDTH / 2, 10);
    light.position.set(xPosition, yPosition, 0);
    light.lookAt(lookAtX, lookAtY, 0);
    this._mesh.add(light);
  }

  // Thin lines at left and right side of the map
  private addSideLights(xMax: number) {
    const lightHeight = (BASE_HEIGHT - WALL_HEIGHT * 2) * 0.98;
    // Left
    this.createAndAddVerticalLight(0x3273a8, -(xMax + 0.5), lightHeight);
    // Right
    this.createAndAddVerticalLight(0xe05109, xMax + 0.5, lightHeight);
  }

  private createAndAddVerticalLight(color: number, xPosition: number, height: number) {
    const light = new RectAreaLight(color, 20, 1, height);
    light.position.set(xPosition, 0, 0);
    light.lookAt(0, 0, 0);
    this._mesh.add(light);
  }
}
