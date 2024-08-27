import { Box3, RectAreaLight, Sphere, Vector3 } from "three";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { IGameStateUpdate, MatchType } from "../../../../interface/remote-game.interface";
import { BALL_MAX_PADDLE_BOUNCE_ANGLE_DEGREES, BALL_MAX_STARTING_ANGLE_DEGREES, BALL_RADIUS, BALL_STARTING_SPEED, BASE_WIDTH, COLLISION_THRESHOLD, GameSceneService, PADDLE_HEIGHT } from "../game-scene.service";
import { ResourceKey, ResourceManagerService } from "../utils/resource-manager.service";
import AGameEntity from "./AGameEntity";
import { Player } from "./Player";
import { Wall } from "./Wall";
import * as THREE from 'three';

RectAreaLightUniformsLib.init();

enum Scorer {
	None = 0,
	Player1 = 1,
	Player2 = 2,
}

export class Ball extends AGameEntity {
	private _directionX: -1 | 1;
	private _velocity: Vector3;

	protected override _collider: Sphere;

	public scorer: Scorer;

	constructor(
		position: Vector3,
		resourceManagerService: ResourceManagerService,
		gameSceneService: GameSceneService,
	) {
		super(position, resourceManagerService, gameSceneService);
		this._directionX = Math.random() < 0.5 ? -1 : 1;
		this._velocity = new Vector3();
		this._collider = new Sphere(this._mesh.position.clone(), BALL_RADIUS);
		this.scorer = Scorer.None;
		this.resetBall();
	}

	public async load() {
		await this._resourceManagerService.load();
		const rectLight = new RectAreaLight(0xffffff, 50);
		rectLight.lookAt(0, 0, 0);
		this._mesh.add(rectLight);
		this._mesh.add(this._resourceManagerService.getResource(ResourceKey.Ball).mesh);
	}

	private resetBall(): void {
		this._mesh.position.set(0, 0, 0);

		const angle = THREE.MathUtils.degToRad(
			THREE.MathUtils.randFloat(
				-BALL_MAX_STARTING_ANGLE_DEGREES,
				BALL_MAX_STARTING_ANGLE_DEGREES,
			)
		);

		this._velocity.set(
			Math.cos(angle) * BALL_STARTING_SPEED * this._directionX,
			Math.sin(angle) * BALL_STARTING_SPEED,
			0
		);
	}

	public async update(deltaTime: number, gameState: IGameStateUpdate): Promise<void> {
		if (this._gameSceneService.matchType === MatchType.LOCAL) {
			this.handleLocalMatchUpdate(deltaTime);
		} else {
			this.handleRemoteMatchUpdate(gameState);
		}
	}

	private handleLocalMatchUpdate(deltaTime: number): void {
		const potentialNewPosition = this.calculatePotentialNewPosition(deltaTime);
		const testingSphere = new Sphere(potentialNewPosition, BALL_RADIUS);
		const collidingEntities = this.detectCollisions(testingSphere);

		if (collidingEntities.length > 0) {
			const totalAdjustment = this.handleCollisions(collidingEntities, testingSphere);
			potentialNewPosition.add(totalAdjustment);
		}

		this.handleScoringAndReset(potentialNewPosition);
		this.updateColliderPosition();
	}

	private calculatePotentialNewPosition(deltaTime: number): Vector3 {
		return this._mesh.position.clone().add(
			this._velocity.clone().multiplyScalar(deltaTime)
		);
	}

	private detectCollisions(testingSphere: Sphere): AGameEntity[] {
		return this._gameSceneService.gameEntities.filter((entity) => {
			const isNotSelf = entity !== this;
			const hasCollider = entity.collider;
			const isColliding = hasCollider && entity.collider.intersectsSphere(testingSphere);

			return isNotSelf && hasCollider && isColliding;
		});
	}

	private handleCollisions(collidingEntities: AGameEntity[], testingSphere: Sphere): Vector3 {
		let totalAdjustment = new Vector3(0, 0, 0);

		for (const collidingEntity of collidingEntities) {
			const collisionNormal = new Vector3().subVectors(testingSphere.center, collidingEntity.position).normalize();
			const penetrationDepth = this.calculatePenetrationDepth(collidingEntity, testingSphere);

			if (penetrationDepth > COLLISION_THRESHOLD) {
				totalAdjustment.add(collisionNormal.multiplyScalar(penetrationDepth));
				this.adjustVelocityForCollision(collidingEntity, collisionNormal);
			}
		}
		return totalAdjustment;
	}

	private calculatePenetrationDepth(collidingEntity: AGameEntity, testingSphere: Sphere): number {
		if (collidingEntity.collider instanceof Box3) {
			const closestPoint = new Vector3().copy(testingSphere.center).clamp(collidingEntity.collider.min, collidingEntity.collider.max);
			const distanceToClosestPoint = testingSphere.center.distanceTo(closestPoint);
			return testingSphere.radius - distanceToClosestPoint;
		}
		return 0;
	}

	private adjustVelocityForCollision(collidingEntity: AGameEntity, collisionNormal: Vector3): void {
		if (collidingEntity instanceof Wall) {
			this._velocity.y *= -1;
		}
		if (collidingEntity instanceof Player) {
			const relativeIntersectY = (collisionNormal.y - collidingEntity.position.y) / (PADDLE_HEIGHT / 2);
			const bounceAngle = this.calculateBounceAngle(relativeIntersectY);
			const speed = Math.max(this._velocity.length(), BALL_STARTING_SPEED);

			this.toogleDirectionX();
			this._velocity.set(
				Math.abs(this._velocity.x) * this._directionX,
				speed * Math.sin(bounceAngle),
				0
			);

			// Random variation for unpredictability
			this._velocity.y += (Math.random() - 0.5) * 4;
		}
	}

	// TODO: make the collision and bounce angle proper with the paddle
	private calculateBounceAngle(relativeIntersectY: number): number {
		const PADDLE_MIDDLE_ZONE_SIZE_RATIO = 0.2;

		// Normalize the intersect point to be between -1 and 1
		const normalizedIntersect = Math.max(-1, Math.min(1, relativeIntersectY));
		const sign = Math.sign(normalizedIntersect);

		// Define the middle zone where the angle change is minimal
		if (Math.abs(normalizedIntersect) <= PADDLE_MIDDLE_ZONE_SIZE_RATIO) {
			// In the middle zone, return a small random angle
			return (Math.random() * THREE.MathUtils.degToRad(5));
		} else {
			// Outside the middle zone, calculate a more pronounced angle
			const adjustedIntersect = (Math.abs(normalizedIntersect) - PADDLE_MIDDLE_ZONE_SIZE_RATIO) / (1 - PADDLE_MIDDLE_ZONE_SIZE_RATIO);
			return (sign * adjustedIntersect * THREE.MathUtils.degToRad(BALL_MAX_PADDLE_BOUNCE_ANGLE_DEGREES));
		}
	}

	private toogleDirectionX(): void {
		this._directionX *= -1;
	}

	private handleScoringAndReset(potentialNewPosition: Vector3): void {
		this.handleScoring(potentialNewPosition);

		if (this.scorer) {
			this.resetBall();
		} else {
			this._mesh.position.copy(potentialNewPosition);
		}
	}

	private handleScoring(position: Vector3): void {
		if (position.x + BALL_RADIUS >= BASE_WIDTH / 2) {
			this.scorer = Scorer.Player1;
		}
		else if (position.x - BALL_RADIUS <= -BASE_WIDTH / 2) {
			this.scorer = Scorer.Player2;
		}
	}

	private updateColliderPosition(): void {
		this._collider.center.copy(this._mesh.position);
	}

	private handleRemoteMatchUpdate(gameState: IGameStateUpdate): void {
		this._mesh.position.copy(gameState.ball.position);
		this.updateColliderPosition();
	}
}
