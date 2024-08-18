import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, effect } from '@angular/core';
import * as THREE from 'three';
import { CommonModule } from '@angular/common';
import { WebSocketSubject } from 'rxjs/webSocket';
import { GameSceneService, gameStatusKeyToString } from './game/game-scene.service';
import { RemoteGameService } from '../../service/remote-game.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IGameEndUpdate, MatchType } from '../../interface/remote-game.interface';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  selector: 'app-pong-game',
  templateUrl: './pong-game.component.html',
  styleUrls: ['./pong-game.component.css']
})
export class PongGameComponent implements OnInit, AfterViewInit {
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef<HTMLDivElement>;
  public gameStatusButtonText: string = '';
  public showGameOverModal = false;
  public gameOverMessage = '';

  private _match_type: string = "";
  private _match_id: string = "";

  private _handleKeyDownBound: (event: KeyboardEvent) => void;

  constructor(
    private _gameSceneService: GameSceneService,
    public remoteGameService: RemoteGameService,
    private _route: ActivatedRoute,
    private _router: Router,
    private translate: TranslateService,
  ) {
      const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
      this.translate.use(preferredLanguage); 

    effect(() => {
      const gameEndData = this.remoteGameService.gameEnd();
      if (gameEndData) {
        this.showGameOver(gameEndData);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      this.gameStatusButtonText = gameStatusKeyToString(this._gameSceneService.gameStatus);
    });

    this._handleKeyDownBound = this.handleKeyDown.bind(this);
  }

  ngOnInit() {
    this._match_type = this._route.snapshot.params['match_type'];
    this._match_id = this._route.snapshot.params['match_id'];

    if (!MatchType.isMatchType(this._match_type) || !this._isMatchId(this._match_id)) {
      this._router.navigate(['/404']);
      return;
    }

    this._gameSceneService.matchType = this._match_type;
    window.addEventListener('keydown', this._handleKeyDownBound);
  }

  private _isMatchId(match_id: string): boolean {
    if (match_id) {
      const match_id_number = parseInt(match_id, 10);
      return !isNaN(match_id_number) && match_id_number > 0;
    }
    return false;
  }

  showGameOver(gameEnd: IGameEndUpdate) {
    this.gameOverMessage = `${gameEnd.winner} wins!`;
    if (gameEnd.reason) {
      this.gameOverMessage += ` Reason: ${gameEnd.reason}`;
    }
    window.removeEventListener('keydown', this._handleKeyDownBound);
    this.showGameOverModal = true;
    this._gameSceneService.stop();
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      this._gameSceneService.togglePauseResume();
    }
  }
  
  public togglePauseResume() {
    this._gameSceneService.togglePauseResume();
  }

  ngAfterViewInit() {
    this._gameSceneService.initialize(this.gameContainer.nativeElement);
    this._gameSceneService.load().then(() => {
      this._gameSceneService.startGame();
      console.log("Game started successfully.");
    }).catch((error) => {
      console.error("Error loading game resources:", error);
      // TODO: display error message
      return;
    });

    if (this._match_type !== MatchType.LOCAL) {
      this.remoteGameService.connect({
        urlPath: 'home/pong-match/' + this._match_type + '/' + this._match_id + '/'
      });
    }
  }

  ngOnDestroy() {
    this._gameSceneService.stop();
    window.removeEventListener('keydown', this._handleKeyDownBound);
  }

//   closeModal() {
//     this.showGameOverModal = false;
// }
}