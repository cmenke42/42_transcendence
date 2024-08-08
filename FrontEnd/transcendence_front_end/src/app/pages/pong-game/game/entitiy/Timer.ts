import { CanvasTexture } from "three";
import { IGameStateUpdate } from "../../../../interface/remote-game.interface";
import { ResourceKey } from "../utils/resource-manager.service";
import AGameEntity from "./AGameEntity";

const TIMER_UPDATE_INTERVAL_MS = 1000; // 1 second

export class Timer extends AGameEntity {
    private _canvas!: HTMLCanvasElement;
    private _width!: number;
    private _height!: number;
    private _context!: CanvasRenderingContext2D;
    private _texture!: CanvasTexture;
    private _currentTime: number = 0;
    private _intervalId: number | null = null;

    public async load() {
        await this._resourceManagerService.load();
        const resource = this._resourceManagerService.getResource(ResourceKey.CountdownTimer);
        this._mesh.add(resource.mesh);

        this._canvas = resource.userData.canvas;
        this._width = this._canvas.width;
        this._height = this._canvas.height;
        const context = this._canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context for canvas element from countdownTimer');
        }
        this._context = context;
        this._texture = resource.userData.texture
    }

    public async update(deltaTime: number, gameState: IGameStateUpdate) {

    }

    public startTimer(timeSeconds: number) {
        console.debug("starting timer with: ", timeSeconds);
        if (this._intervalId !== null) {
            this.stopTimer();
        }
        if (timeSeconds <= 0) {
            return;
        }
        this._currentTime = timeSeconds;

        this.updateTimerDisplay();
        this._intervalId = window.setInterval(
            this.updateTimer.bind(this),
            TIMER_UPDATE_INTERVAL_MS,
        );
    }

    private updateTimer() {
        this._currentTime -= TIMER_UPDATE_INTERVAL_MS / 1000;
        this.updateTimerDisplay();

        if (this._currentTime <= 1) {
            this.stopTimer();
        }
    }

    private updateTimerDisplay() {
        this.clearDisplay();
        if (this._currentTime > 0) {
            this.drawTime(this._currentTime);
        }
        this._texture.needsUpdate = true;
    }

    private clearDisplay() {
        this._context.clearRect(0, 0, this._width, this._height);
    }

    private drawTime(time: number) {
        this._context.font = 'bold 160px Arial';
        this._context.fillStyle = '#ffffff';
        this._context.textAlign = 'center';
        this._context.textBaseline = 'middle';
        this._context.shadowColor = '#3273a8';
        this._context.shadowBlur = 10;
        const secondToDisplay = Math.floor(time).toString();
        this._context.fillText(secondToDisplay, this._width / 2, this._height / 2);
    }

    public stopTimer() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this.clearDisplay();
    }
}