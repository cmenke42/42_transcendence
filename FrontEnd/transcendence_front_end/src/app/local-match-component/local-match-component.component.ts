import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import GameScene from './game/scene/GameScene';
import * as THREE from 'three';
import { CommonModule } from '@angular/common';
import { WebSocketSubject } from 'rxjs/webSocket';

@Component({
  standalone: true,
  imports: [
    CommonModule
  ],
  selector: 'app-local-match-component',
  templateUrl: './local-match-component.component.html',
  styleUrls: ['./local-match-component.component.css']

})
export class LocalMatchComponentComponent implements OnInit, AfterViewInit
{
  @ViewChild('gameContainer', {static: true}) gameContainer!: ElementRef<HTMLDivElement>;
  private gameInstance: GameScene;
  public gameStatus: 'notStarted' | 'running' | 'paused' = 'notStarted';
  public player1Score: any;
  public player2Score: any;
  public buttonText: string = 'Start Game';
  public showGameOverModal = false;
  public gameOverMessage = '';
  private updateInterval: any;
  // private socket$: WebSocketSubject<any>; // Websocket

  constructor() {
    this.gameInstance = GameScene.getInstance();
    this.gameInstance.onPauseStateChange.subscribe((isPaused: boolean) => {
      this.gameStatus = isPaused ? 'paused' : 'running';
      this.updateButtonText();
      console.log("Game status changed to:", this.gameStatus);
  });
    // this.socket$ = new WebSocketSubject('ws://localhost:8000/ws/game/'); // Websocket
  }

  ngOnInit() {
    this.gameInstance.score_changed.subscribe(scores =>{
      this.player1Score = scores.player1;
      this.player2Score = scores.player2;
      if (scores.player1 === 5 || scores.player2 === 5) {
        this.showGameOver(scores.player1 === 5 ? 'Player 1' : 'Player 2')
      }
      this.updateInterval = setInterval(() => this.sendPlayerState(), 1000 / 60);
    })
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    //Webocket
    // this.socket$.subscribe(
    //   (message) => this.handleWebSocketMessage(message), //TODO: Implement this
    //   (error) => console.error(error),
    // )
    // Any initialization logic
  }

  private sendPlayerState() {
  const playersState = this.gameInstance.getPlayerState();
  console.log("Sending player state", playersState.player1.position.x);
  console.log("Sending player state", playersState.player1.position.y);
  }


/*   private handleWebSocketMessage(message: any) {
    const gameScene = GameScene.getInstance();

    if (message.player1Position)
    {
      const player1 = gameScene.getGameEntities().find(entity => entity instanceof player1 && (entity as Player)._playerCount === 1) as Player;
    }
  }
 */

  showGameOver(winner: string) {
    this.gameOverMessage = `${winner} wins!`;
    this.showGameOverModal = true;
    this.gameInstance.stop();
    this.gameStatus = 'notStarted';
    this.updateButtonText();
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ') { // Space key
      event.preventDefault(); // Prevent scrolling
      this.toggleGame();
    }
  }
  
  async toggleGame(): Promise<void> {
    switch (this.gameStatus) {
      case 'notStarted':
        await this.gameInstance.load();
        this.gameInstance.startGame();
        break;
      case 'running':
        this.gameInstance.pause();
        break;
      case 'paused':
        this.gameInstance.resume();
        break;
    }
  }

  private updateButtonText(): void {
    switch (this.gameStatus) {
      case 'notStarted':
        this.buttonText = 'Start Game';
        break;
      case 'running':
        this.buttonText = 'Pause Game';
        break;
      case 'paused':
        this.buttonText = 'Resume Game';
        break;
    }
  }
  ngAfterViewInit() {
      setTimeout(() => {
        this.gameInstance.initilize(this.gameContainer.nativeElement);
      })
    }
    
    async startGame(): Promise<void> {
      if (this.gameStatus === 'notStarted') {
        await this.gameInstance.load();
      }
      this.gameInstance.togglePauseResume();
    }

    
    ngOnDestroy() {
      this.gameInstance.stop();
      //unsubscribe from the score changes to prevent memory leaks
      this.gameInstance.score_changed.unsubscribe();
      this.gameInstance.onPauseStateChange.unsubscribe();
      window.removeEventListener('keydown', this.handleKeyDown);

      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      // this.socket$.complete(); // Websocket

    }

    
  }
  
  
  /*  pauseGame(): void {
     if (this.gameStatus === 'running') {
       // this.gameInstance.display_pause();
       this.gameInstance.pause();
       this.gameStatus = 'paused';
       
     }
   } */
   
  /*  resumeGame(): void {
     if (this.gameStatus === 'paused') {
       this.gameInstance.resume();
       this.gameStatus = 'running';
     }
   }
    */