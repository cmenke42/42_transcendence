import { BoxGeometry, Mesh, MeshStandardMaterial, Plane, PlaneGeometry, TextureLoader } from "three";
import * as THREE from 'three';
import { RepeatWrapping } from 'three';

class ResourceManager
{
	private static instance = new ResourceManager();
	public static getInstance(){
		return this.instance;
	}
	private constructor(){}
	private _resources: Map<string, any> = new Map();

	public load = async () => {
		await this.loadResources();
	}

	private async loadBackground(key: string, path: string)
	{
		const texture = new TextureLoader().load(path, function(texture){
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(window.innerWidth/ texture.image.width * 8, window.innerHeight / texture.image.height * 8);
		});
		const geometry = new PlaneGeometry(window.innerWidth * 1.1, window.innerHeight * 1.1);
		const material = new MeshStandardMaterial({map: texture , transparent: true, opacity:0.5, metalness: 0.8, roughness: 0.5, envMapIntensity: 0.5});
		const background = new Mesh(geometry, material);
		background.position.z = -20;
		this._resources.set(key, background);
	}

	private async loadCube(key: string)
	{
		const geometry =  new BoxGeometry(1, 1, 20);
		const material = new MeshStandardMaterial({color: 0xfafaf7, emissive: 0xfafaf7, emissiveIntensity: 0.5});
		const cube = new Mesh(geometry, material);
		const cubeWidth = window.innerWidth * 1.1;
		const cubeHeight = window.innerHeight / 30;
		cube.geometry.scale(cubeWidth, cubeHeight, 1);
		this._resources.set(key, cube);
	}

	private async loadPaddle1(key: string)
	{
		const geometry =  new BoxGeometry(1, 1, 20);
		const material = new MeshStandardMaterial({color: 0x3273a8, emissive: 0x3273a8, emissiveIntensity: 0.5});
		const paddle = new Mesh(geometry, material);
		const paddleWidth = window.innerWidth / 100;
		const paddleHeight = window.innerHeight / 7;
		paddle.geometry.scale(paddleWidth, paddleHeight, 1);
		paddle.position.set((-window.innerWidth / 2) + (paddleWidth* 2.1), 0, 0);
		this._resources.set(key, paddle);
	}
	private async loadPaddle2(key: string)
	{
		const geometry =  new BoxGeometry(1, 1, 20);
		const material = new MeshStandardMaterial({color: 0xe05109, emissive: 0xe05109, emissiveIntensity: 0.5});
		const paddle = new Mesh(geometry, material);
		const paddleWidth = window.innerWidth / 100;
		const paddleHeight = window.innerHeight / 7;
		paddle.geometry.scale(paddleWidth, paddleHeight, 1);
		paddle.position.set((window.innerWidth / 2) - (paddleWidth* 2.1), 0, 0);
		this._resources.set(key, paddle);
	}

	private async loadBall(key: string)
	{
		const geometry = new THREE.SphereGeometry(10);
		const material = new MeshStandardMaterial({color: 0xfafaf7, emissive: 0xfafaf7, emissiveIntensity: 1, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.5});
		const ball = new Mesh(geometry, material);
		ball.position.set(0, 0, 0);
		this._resources.set(key, ball);
	}
	private async loadCircle(key: string)
	{
		const geometry = new THREE.CircleGeometry(200, 40);
		const material = new MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1});
		const circle = new Mesh(geometry, material);
		circle.position.set(0, 0, -30);
		this._resources.set(key, circle);
	}

	private async loadMiddleLine(key: string)
	{
		const geometry = new PlaneGeometry(10, window.innerHeight);
		const material = new MeshStandardMaterial({color: 0xfafaf7, emissive: 0xfafaf7, emissiveIntensity: 0.5});
		const middleLine = new Mesh(geometry, material);
		middleLine.position.set(0, 0, -30);
		this._resources.set(key, middleLine);
	}

	private async loadPlane(key: string)
	{
		const geometry = new PlaneGeometry(1, 1);
		const material = new MeshStandardMaterial({color: 0x000000});
		const plane = new Mesh(geometry, material);
		plane.position.set(0, 0, 0);
		this._resources.set(key, plane);
	}

	private async loadMiddleCircle(key: string)
	{
		const texture = new TextureLoader().load('assets/mid-circle-half.png', function(texture){
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;
		});
		const geometry = new PlaneGeometry(250, 500);
		const material = new MeshStandardMaterial({map: texture, transparent: true, emissive:0x3273a8, emissiveIntensity: 1, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.5});
		const middleCircle = new Mesh(geometry, material);
		this._resources.set(key, middleCircle);
	}

	private async loadMiddleCircle2(key: string)
	{
		const texture = new TextureLoader().load('assets/mid-circle-half.png', function(texture){
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;
		});
		const geometry = new PlaneGeometry(250, 500);
		const material = new MeshStandardMaterial({map: texture, transparent: true, emissive:0xe05109, emissiveIntensity: 1, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.5});
		const middleCircle = new Mesh(geometry, material);
		this._resources.set(key, middleCircle);
	}

	private loadResources = async () => {
		// add resources here
		await this.loadCube('cube');
		await this.loadPaddle1('paddle1');
		await this.loadPaddle2('paddle2');
		await this.loadBall('ball');
		await this.loadBackground('background', 'assets/hexagon-background.png');
		await this.loadPlane('plane');
		await this.loadMiddleLine('middleLine');
		await this.loadCircle('circle');
		await this.loadMiddleCircle('middleCircle');
		await this.loadMiddleCircle2('middleCircle2');
	}
	public getResource(key: string)
	{
		return this._resources.get(key);
	}
}

export default ResourceManager;