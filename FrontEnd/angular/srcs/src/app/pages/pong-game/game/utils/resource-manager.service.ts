import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, TextureLoader } from "three";

import { BASE_HEIGHT, BASE_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, WALL_DEPTH, WALL_HEIGHT } from '../game-scene.service';

type ResourceLoaderFunc = (key: ResourceKey, ...args: any[]) => Promise<void>;
interface ResourceLoaderTask {
  loader: ResourceLoaderFunc;
  key: ResourceKey;
  args?: any[];
}

class Resource<T extends Record<string, any> = Record<string, any>> {
  constructor(
    public mesh: Mesh,
    public userData: T = {} as T
  ) {

  }
}

export enum ResourceKey {
  HorizontalWall = 0,
  Paddle1,
  Paddle2,
  Ball,
  Background,
  BasePlane,
  MiddleCircle,
  MiddleCircle2,
  CountdownTimer,
}

const ResourceKeyStrings: { [key in ResourceKey]: string } = {
  [ResourceKey.HorizontalWall]: 'horizontalWall',
  [ResourceKey.Paddle1]: 'paddle1',
  [ResourceKey.Paddle2]: 'paddle2',
  [ResourceKey.Ball]: 'ball',
  [ResourceKey.Background]: 'background',
  [ResourceKey.BasePlane]: 'basePlane',
  [ResourceKey.MiddleCircle]: 'middleCircle',
  [ResourceKey.MiddleCircle2]: 'middleCircle2',
  [ResourceKey.CountdownTimer]: 'countdownTimer',
};

export function resourceKeyToString(key: ResourceKey): string {
  return ResourceKeyStrings[key];
}

@Injectable({
  providedIn: 'root'
})
export class ResourceManagerService {
  private readonly _resources: Map<ResourceKey, Resource<any>> = new Map();
  private _isLoaded = false;

  public getResource(key: ResourceKey) {
    const resource = this._resources.get(key);
    if (!resource) {
      throw new Error(`Resource not found for key: ${resourceKeyToString(key)}`);
    }
    return resource;
  }

  public async load(): Promise<void> {
    if (this._isLoaded) {
      console.debug("Ressources already loaded");
      return;
    }
    await this.loadResources();
    this._isLoaded = true;
    console.debug("Ressources loaded");
  }

  private async loadResources(): Promise<void> {
    const resourceLoadingTasks: ResourceLoaderTask[] = [
      { loader: this.loadBasePlane, key: ResourceKey.BasePlane },
      { loader: this.loadBackground, key: ResourceKey.Background, args: ['assets/hexagon-background.png'] },
      { loader: this.loadHorizontalWall, key: ResourceKey.HorizontalWall },
      { loader: this.loadMiddleCircle, key: ResourceKey.MiddleCircle, args: [0x3273a8, 10] },
      { loader: this.loadMiddleCircle, key: ResourceKey.MiddleCircle2, args: [0xe05109, 11] },
      { loader: this.loadCountdownTimer, key: ResourceKey.CountdownTimer },
      { loader: this.loadPaddle, key: ResourceKey.Paddle1, args: [0x3273a8] },
      { loader: this.loadPaddle, key: ResourceKey.Paddle2, args: [0xe05109] },
      { loader: this.loadBall, key: ResourceKey.Ball },
    ];

    this.checkResourceLoaders(resourceLoadingTasks);
    await Promise.all(resourceLoadingTasks.map(this.executeResourceLoader));
  }

  private checkResourceLoaders(resourceLoadingTasks: ResourceLoaderTask[]): void {
    // Ensure every ResourceKey has a corresponding loader
    const resourceKeys = Object.values(ResourceKey).filter(value => typeof value === 'number') as ResourceKey[];
    const missingLoaders = resourceKeys.filter(key => !resourceLoadingTasks.some(task => task.key === key));

    if (missingLoaders.length > 0) {
      throw new Error(
        `Missing loaders for resource keys: ${missingLoaders.map(resourceKeyToString).join(', ')}`
      );
    }
  }

  private executeResourceLoader = ({ loader, key, args = [] }: ResourceLoaderTask): Promise<void> => {
    return loader.call(this, key, ...args);
  }

  private setResource(key: ResourceKey, resource: Resource<any>): void {
    resource.mesh.name = resourceKeyToString(key);
    this._resources.set(key, resource);
  }

  private async loadBasePlane(key: ResourceKey): Promise<void> {
    const geometry = new PlaneGeometry(1, 1);
    const material = new MeshStandardMaterial({ color: 0x000000 });
    const plane = new Mesh(geometry, material);
    plane.renderOrder = 18;
    plane.position.set(0, 0, 0);
    this.setResource(key, new Resource(plane))
  }

  private async loadBackground(key: ResourceKey, path: string): Promise<void> {
    const texture = new TextureLoader().load(path, (texture) => {
      const textureScaling = 8;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(
        (BASE_WIDTH) / texture.image.width * textureScaling,
        (BASE_HEIGHT) / texture.image.height * textureScaling,
      );
    });
    const geometry = new PlaneGeometry(BASE_WIDTH, (BASE_HEIGHT));
    const material = new MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.5,
      metalness: 0.8,
      roughness: 0.5,
      envMapIntensity: 0.5,
    });
    const background = new Mesh(geometry, material);
    background.position.set(0, 0, 0);
    background.renderOrder = 19;
    this.setResource(key, new Resource(background));
  }

  private async loadHorizontalWall(key: ResourceKey): Promise<void> {
    const geometry = new BoxGeometry(BASE_WIDTH, WALL_HEIGHT, WALL_DEPTH);
    const material = new MeshStandardMaterial({
      color: 0x383f57,
      emissive: 0x212533,
      emissiveIntensity: 0.1,
      roughness: 0.3,
      metalness: 0.8,
    });
    const horizontalWall = new Mesh(geometry, material);
    this.setResource(key, new Resource(horizontalWall));
  }
  
  private async loadMiddleCircle(key: ResourceKey, emissive: number, renderOrder: number): Promise<void> {
    const texture = new TextureLoader().load('assets/mid-circle-half.png', (texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
    });
    const geometry = new PlaneGeometry(250, 500);
    const material = new MeshStandardMaterial({
      map: texture,
      transparent: true,
      emissive: emissive,
      emissiveIntensity: 1,
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 0.5,
      depthWrite: false,
    });
    const middleCircle = new Mesh(geometry, material);
    middleCircle.renderOrder = renderOrder;
    this.setResource(key, new Resource(middleCircle));
  }

  private async loadCountdownTimer(key: ResourceKey): Promise<void> {
    const width = 256;
    const height = 256
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const geometry = new PlaneGeometry(width, height);
    const texture = new CanvasTexture(canvas);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const countdownTimer = new Mesh(geometry, material);
    countdownTimer.renderOrder = 20;
    this.setResource(key, new Resource(countdownTimer, { canvas: canvas, texture: texture }));
  }

  private async loadPaddle(key: ResourceKey, color: number): Promise<void> {
    const geometry = new BoxGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, WALL_DEPTH);
    const material = new MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
    });
    const paddle = new Mesh(geometry, material);
    this.setResource(key, new Resource(paddle));
  }

  private async loadBall(key: ResourceKey): Promise<void> {
    const geometry = new THREE.SphereGeometry(10);
    const material = new MeshStandardMaterial({
      color: 0xfafaf7,
      emissive: 0xfafaf7,
      emissiveIntensity: 1,
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 0.5,
    });
    const ball = new Mesh(geometry, material);
    ball.position.set(0, 0, 0);
    this.setResource(key, new Resource(ball));
  }
}
