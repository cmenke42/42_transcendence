import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import GameScene from './game/scene/GameScene';
import * as THREE from 'three';
import { CommonModule } from '@angular/common';
import { WebSocketSubject } from 'rxjs/webSocket';
import { SocketsService } from '../service/sockets.service';
import { Subscription, timestamp } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

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
  private gameInstance!: GameScene;
  public gameStatus: 'notStarted' | 'running' | 'paused' = 'notStarted';
  public player1Score: number = 0;
  public player2Score: number = 0;
  public buttonText: string = 'Start Game';
  public showGameOverModal = false;
  public gameOverMessage = '';
  private subscription: Subscription = new Subscription();

  // changeDetectorRed = inject(ChangeDetectorRef);
  router = inject(ActivatedRoute);
  // socket = inject(SocketsService);

  constructor() {
    const instance = GameScene.getInstance();
    if (instance !== null)
      this.gameInstance = instance;
    // this.gameInstance = GameScene.getInstance();
  }

  ngOnInit() {
    // this.socket.connectGameSocket('room1');
    this.subscription.add(
      this.router.params.subscribe(params => {
        const matchId = params['match_id'];
        const matchType = params['type'];
        console.log('Match ID:', matchId);
        this.resetGame();
    })
    );
    this.subscription.add(
      this.gameInstance.onPauseStateChange.subscribe((isPaused: boolean) => {
        this.gameStatus = isPaused ? 'paused' : 'running';
        this.updateButtonText();
        console.log("Game status changed to:", this.gameStatus);
    })
    );
   /*  this.gameStateSubscription = this.socket.getGameState().subscribe(
      (message: any) => {
        if (message.type === 'game_state_update')
        {
          this.updateGameState(message.game_state);
        }
        else if (message.type === 'game_start')
        {
          this.handleGameStart(message);
        }
      }) */
    this.subscription.add(
        this.gameInstance.score_changed.subscribe(scores =>{
          this.player1Score = scores.player1;
          this.player2Score = scores.player2;
          // this.sendPlayerState(); // Send the updated score to the other player
          if (scores.player1 === 5 || scores.player2 === 5) {
            this.showGameOver(scores.player1 === 5 ? 'Player 1' : 'Player 2')
          }
          // this,this.changeDetectorRed.detectChanges();
          // this.updateInterval = setInterval(() => this.sendPlayerState(), 1000 / 60);
        })
      );
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
  }

  ngAfterViewInit() 
  {
      setTimeout(() => {
        this.gameInstance.initilize(this.gameContainer.nativeElement);
      })
  }

  ngOnDestroy() {
    this.gameInstance.stop();
    //unsubscribe from the score changes to prevent memory leaks
    // this.gameInstance.score_changed.unsubscribe();
    // this.gameInstance.onPauseStateChange.unsubscribe();
    this.subscription.unsubscribe();
    window.removeEventListener('keydown', this.handleKeyDown);

  }

     private resetGame() {
        // Stop the current game if it's running
        this.gameInstance.stop();
        // Reset the GameScene instance
        GameScene.resetInstance();
        // Get a new instance and initialize it
        // this.gameInstance = GameScene.getInstance();
        const instance = GameScene.getInstance();
        if (instance !== null)
          this.gameInstance = instance;
        this.gameStatus = 'notStarted';
        this.updateButtonText();
        this.player1Score = 0;
        this.player2Score = 0;
        // Re-initialize the game container
        setTimeout(() => {
            this.gameInstance.initilize(this.gameContainer.nativeElement);
        });
    }


  showGameOver(winner: string) {
    this.gameOverMessage = `${winner} wins!`;
    this.showGameOverModal = true;
    this.gameInstance.stop();
    this.gameStatus = 'notStarted';
    this.updateButtonText();
    // this.changeDetectorRed.detectChanges();
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
        // this.socket.sendGameStart('room1');
        // await new Promise(resolve => setTimeout(resolve, 1000));
        this.gameInstance.startGame();
        this.gameStatus = 'running'
        break;
      case 'running':
        this.gameInstance.pause();
        this.gameStatus = 'paused';
        break;
      case 'paused':
        this.gameInstance.resume();
        this.gameStatus = 'running';
        break;
    }
    this.updateButtonText();
    // this.changeDetectorRed.detectChanges();
    // this.socket.sendGameStatusUpdate(this.gameStatus);
    // this.sendPlayerState();
  }

  private updateButtonText(): void {
    this.buttonText = this.gameStatus === 'notStarted' ? 'Start Game' :
                      this.gameStatus === 'running' ? 'Pause Game' : 'Resume Game';
  }
    
  async startGame(): Promise<void> {
      if (this.gameStatus === 'notStarted') {
        await this.gameInstance.load();
      }
      this.gameInstance.togglePauseResume();
    }
}
  
//code for remote player 

/* 
  private updateGameState(message: any) {
    if (message.type === 'game_state_update') {
      const state = message.game_state;
      const timeDiff = performance.now() - state.timestamp;
      const interpolationFactor = 0.1;
  
      // Update player 1
      if (state.player1) {
        if (state.player1.position && state.player1.velocity) {
          const newPos = {
            x: state.player1.position.x + state.player1.velocity.x * timeDiff * interpolationFactor,
            y: state.player1.position.y + state.player1.velocity.y * timeDiff * interpolationFactor,
          };
          this.gameInstance.updatePlayer1Position(newPos);
        }
        if (state.player1.score !== undefined) {
          this.player1Score = state.player1.score;
          this.gameInstance.updatePlayer1Score(this.player1Score);
        }
      }
  
      // Update player 2
      if (state.player2) {
        if (state.player2.position && state.player2.velocity) {
          const newPos = {
            x: state.player2.position.x + state.player2.velocity.x * timeDiff * interpolationFactor,
            y: state.player2.position.y + state.player2.velocity.y * timeDiff * interpolationFactor,
          };
          this.gameInstance.updatePlayer2Position(newPos);
        }
        if (state.player2.score !== undefined) {
          this.player2Score = state.player2.score;
          this.gameInstance.updatePlayer2Score(this.player2Score);
        }
      }
  
      // Update ball
      if (state.ball && state.ball.position && state.ball.velocity) {
        const newBallPos = {
          x: state.ball.position.x + state.ball.velocity.x * timeDiff * interpolationFactor,
          y: state.ball.position.y + state.ball.velocity.y * timeDiff * interpolationFactor,
        };
        this.gameInstance.updateBallPosition(newBallPos);
      }
  
      // Update game status
      if (state.gameStatus && state.gameStatus !== this.gameStatus) {
        this.gameStatus = state.gameStatus;
        this.updateButtonText();
  
        switch (this.gameStatus) {
          case 'running':
            this.gameInstance.resume();
            break;
          case 'paused':
            this.gameInstance.pause();
            break;
          case 'notStarted':
            this.gameInstance.stop();
            break;
        }
      }
  
      // Check for game over
      if (this.player1Score === 5 || this.player2Score === 5) {
        this.showGameOver(this.player1Score === 5 ? 'Player 1' : 'Player 2');
      }
  
      // Trigger change detection
      this.changeDetectorRed.detectChanges();
    } else if (message.type === 'game_status_update') {
      if (message.gameStatus !== this.gameStatus) {
        this.gameStatus = message.gameStatus;
        this.updateButtonText();
  
        switch (this.gameStatus) {
          case 'running':
            this.gameInstance.resume();
            break;
          case 'paused':
            this.gameInstance.pause();
            break;
          case 'notStarted':
            this.gameInstance.stop();
            break;
        }
      }
    }
  }


    private handleGameStart(message: any) {
    console.log('Game start message received:', message);
    if (this.gameStatus === 'notStarted') {
      this.gameInstance.startGame();
      this.gameStatus = 'running';
      this.updateButtonText();
      this.sendPlayerState();
    }
  }

  
  private sendPlayerState() {
  const playersState = this.gameInstance.getPlayerState();
  // const currentTime = performance.now();
  console.log('Sending player state:', playersState);
  this.socket.sendGameState({
    ...playersState,
    gameStatus: this.gameStatus,
    timestamp: performance.now(),
  });
  }

*/