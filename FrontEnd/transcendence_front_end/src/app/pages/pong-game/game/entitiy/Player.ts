import { Box3, RectAreaLight, Vector3 } from "three";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { IGameStateUpdate, MatchType, PlayerMovementDirection } from "../../../../interface/remote-game.interface";
import { RemoteGameService } from "../../../../service/remote-game.service";
import { BASE_HEIGHT, GameSceneService, PADDLE_HEIGHT, PADDLE_WIDTH, WALL_HEIGHT } from "../game-scene.service";
import { ResourceKey, ResourceManagerService } from "../utils/resource-manager.service";
import AGameEntity from "./AGameEntity";

RectAreaLightUniformsLib.init();

enum KeyboardState {
	Neutral = 0,
	Up = 1,
	Down = 2,
}

enum KeyBindings {
	Player1Up = 'w',
	Player1Down = 's',
	Player2Up = 'ArrowUp',
	Player2Down = 'ArrowDown'
}

export class Player extends AGameEntity {
	private static readonly LIGHT_INTENSITY = 50;
	private static readonly LIGHT_WIDTH_FACTOR = 0.8;
	private static readonly LIGHT_HEIGHT_FACTOR = 0.9;
	private static readonly _validKeyBindings: Set<string> = new Set(Object.values(KeyBindings));

	private _keyboardState: KeyboardState = KeyboardState.Neutral;
	TOP_BOUNDARY = BASE_HEIGHT / 2 - (PADDLE_HEIGHT / 2 + WALL_HEIGHT);
	BOTTOM_BOUNDARY = -this.TOP_BOUNDARY

	protected override _collider: Box3;

	constructor(
		position: Vector3,
		public nickname: string,
		private _speed: number,
		private _playerNumber: number, // player side on the map
		resourceManagerService: ResourceManagerService,
		gameSceneService: GameSceneService,
		private _remoteGameService: RemoteGameService,
	) {
		super(position, resourceManagerService, gameSceneService);
		this._collider = new Box3().setFromObject(this._mesh);
		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
	}

	public cleanup() {
		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
	}

	public async load() {
		await this._resourceManagerService.load();
		switch (this._playerNumber) {
			case 1:
				this.setUpPaddle(ResourceKey.Paddle1, 0x3273a8);
				break;
			case 2:
				this.setUpPaddle(ResourceKey.Paddle2, 0xe05109);
				break;
			default:
				throw new Error('Invalid player count');
		}
		this._collider = new Box3().setFromObject(this._mesh);
	}

	private setUpPaddle(ressourceKey: ResourceKey, color: number) {
		const lightOffsetX = PADDLE_WIDTH / 2 - 1; // Position the light at the edge of the paddle
		this._mesh.add(this._resourceManagerService.getResource(ressourceKey).mesh);
		const rectLight = this.createRectAreaLight(color, lightOffsetX);
		this._mesh.add(rectLight);
	}

	private createRectAreaLight(color: number, lightOffsetX: number): RectAreaLight {
		const rectLight = new RectAreaLight(
			color,
			Player.LIGHT_INTENSITY,
			PADDLE_WIDTH * Player.LIGHT_WIDTH_FACTOR,
			PADDLE_HEIGHT * Player.LIGHT_HEIGHT_FACTOR
		);

		const lightPosition = new Vector3(
			this._playerNumber === 2 ? -lightOffsetX : lightOffsetX,
			0,
			0
		);

		rectLight.position.copy(lightPosition);
		rectLight.lookAt(-this._mesh.position.x, 0, 0);

		return rectLight;
	}

	private handleKeyDown = (event: KeyboardEvent) => {
		this.preventDefaultKeyBehavior(event);
		if (event.repeat) return;

		if (this._gameSceneService.matchType === MatchType.LOCAL) {
			this.handleLocalKeyDown(event);
		} else {
			this.handleRemoteKeyDown(event);
		}
	}

	private handleKeyUp = (event: KeyboardEvent) => {
		this.preventDefaultKeyBehavior(event);
		if (event.repeat) return;

		if (this._gameSceneService.matchType === MatchType.LOCAL) {
			this.handleLocalKeyUp(event);
		} else {
			this.handleRemoteKeyUp(event);
		}
	}

	private preventDefaultKeyBehavior(event: KeyboardEvent): void {
		if (Player._validKeyBindings.has(event.key)) {
			event.preventDefault();
		}
	}

	private handleLocalKeyDown(event: KeyboardEvent) {
		if (this._playerNumber === 1) {
			this.updateKeyboardState(event.key, KeyBindings.Player1Up, KeyBindings.Player1Down);
		} else if (this._playerNumber === 2) {
			this.updateKeyboardState(event.key, KeyBindings.Player2Up, KeyBindings.Player2Down);
		}
	}

	private handleLocalKeyUp(event: KeyboardEvent) {
		if (this._playerNumber === 1) {
			this.resetKeyboardState(event.key, KeyBindings.Player1Up, KeyBindings.Player1Down);
		} else if (this._playerNumber === 2) {
			this.resetKeyboardState(event.key, KeyBindings.Player2Up, KeyBindings.Player2Down);
		}
	}

	private handleRemoteKeyDown(event: KeyboardEvent) {
		this.sendRemotePaddleMovement(
			event.key,
			KeyBindings.Player1Up,
			KeyBindings.Player1Down,
			PlayerMovementDirection.Up,
			PlayerMovementDirection.Down,
		);
	}

	private handleRemoteKeyUp(event: KeyboardEvent) {
		this.sendRemotePaddleMovement(
			event.key,
			KeyBindings.Player1Up,
			KeyBindings.Player1Down,
			PlayerMovementDirection.Neutral,
			PlayerMovementDirection.Neutral,
		);
	}

	private updateKeyboardState(key: string, upKey: KeyBindings, downKey: KeyBindings) {
		switch (key) {
			case upKey:
				this._keyboardState = KeyboardState.Up;
				break;
			case downKey:
				this._keyboardState = KeyboardState.Down;
				break;
		}
	}

	private resetKeyboardState(key: string, upKey: KeyBindings, downKey: KeyBindings) {
		if (key === upKey || key === downKey) {
			this._keyboardState = KeyboardState.Neutral;
		}
	}

	private sendRemotePaddleMovement(
		key: string,
		upKey: KeyBindings,
		downKey: KeyBindings,
		upCommand: PlayerMovementDirection,
		downCommand: PlayerMovementDirection,
	) {
		switch (key) {
			case upKey:
				this._remoteGameService.sendPaddleMovement(upCommand);
				break;
			case downKey:
				this._remoteGameService.sendPaddleMovement(downCommand);
				break;
		}
	}

	public async update(deltaTime: number, gameState: IGameStateUpdate): Promise<void> {
		if (this._gameSceneService.matchType === MatchType.LOCAL) {
			this.handleLocalMatchUpdate(deltaTime);
		} else {
			this.handleRemoteMatchUpdate(gameState);
		}
	}

	private handleLocalMatchUpdate(deltaTime: number): void {
		const calculatedMove = this.calculateMove(deltaTime);
		const potentialNewY = this._mesh.position.y + calculatedMove.y;
		const clampedNewY = Math.max(Math.min(potentialNewY, this.TOP_BOUNDARY), this.BOTTOM_BOUNDARY);
		this._mesh.position.y = clampedNewY;
		this._collider.setFromObject(this._mesh);
	}

	private calculateMove(deltaTime: number): Vector3 {
		const move = new Vector3(0, 0, 0);
		switch (this._keyboardState) {
			case KeyboardState.Up:
				move.y += this._speed * deltaTime;
				break;
			case KeyboardState.Down:
				move.y -= this._speed * deltaTime;
				break;
		}
		return move;
	}

	private handleRemoteMatchUpdate(gameState: IGameStateUpdate): void {
		switch (this._playerNumber) {
			case 1:
				this._mesh.position.copy(gameState.paddle1.position);
				break;
			case 2:
				this._mesh.position.copy(gameState.paddle2.position);
				break;
		}
	}
}
