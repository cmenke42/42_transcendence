import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { match } from '../../interface/match';
import { ChatComponent } from "../chat/chat.component";
import { UserProfile } from '../../interface/user-profile';
import { SocketsService } from '../../service/sockets.service';
import { Subscription } from 'rxjs';
import { MatchType } from '../../interface/remote-game.interface';
import { PopupMessageService } from '../../service/popup-message.service';

@Component({
  selector: 'app-match-making',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModalModule,
    ChatComponent,
    RouterLink,
  ],
  templateUrl: './match-making.component.html',
  styleUrls: ['./match-making.component.css'],

})
export class MatchMakingComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  router = inject(ActivatedRoute);

  webSocket = inject(SocketsService);
  


  // selectMatch: any = null;
  // tournamentStatus: string = '';
  // tournamentWinner: string | null = null;
  // // isChatOpen: boolean = false;
  
  // isOpen: boolean = false;
  MatchType = MatchType;
  playerInfo: any = null;
  showPlayerInfo: boolean = false;
  private subscription: Subscription | null = null;
  user: UserProfile | any = {};
  messages: any[] = [];
  message: string = '';
  tournament_matches: match | any = {};
  // matches_round : {[key: number]: match[]} = {};
  matchesByRound: Map<number, match[]> = new Map();

  constructor(private popupMessageService: PopupMessageService) {

  }

  ngOnInit(): void {
    this.router.params.subscribe(params => {
      this.tournament_matches.tournament_id = params['tournament_id'];
      this.user.nickname = params['nickname'];
      this.viewMatches(this.tournament_matches.tournament_id);
    });

    if (this.user.nickname) {
      console.log('Connecting to WebSocket');
      this.webSocket.connect(this.tournament_matches.tournament_id.toString(), this.user.nickname);
    }

    this.subscription = this.webSocket.getMessage().subscribe((message) => {
      this.messages.push(message);
      console.log('Received message:', message);
    });
    // this.fetchPlayerInfo();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.webSocket.close();
  }


  togglePlayerInfo()
  {
    this.showPlayerInfo = !this.showPlayerInfo;
  }


  playMatch()
  {
    this.popupMessageService.showMessage('Match started', 'info');
    //alert('Match started');
  }
  
  fetchPlayerInfo()
  {
    this.userService.fetchTournamentPlayers(this.tournament_matches.tournament_id).subscribe({
      next: (data: any) => {
        this.playerInfo = data;
        console.log('player info...', this.playerInfo);
      },
      error: (err: any) => {
        console.log('error from fetch player info...', err);
      }
    });
  
  }


sendMatchInfoToChat() {
  this.matchesByRound.forEach((matches, round) => {
    matches.forEach(match => {
      let messageText = `Round ${round + 1}, Match ${match.id}: `;
      
      if (match.is_bye) {
        messageText += `${match.player_1?.nickname || 'Player'} received a bye.`;
      } else if (match.is_played) {
        const player1Name = match.player_1?.nickname || 'Player 1';
        const player2Name = match.player_2?.nickname || 'Player 2';
        messageText += `${player1Name} vs ${player2Name} - `;
        if (match.winner) {
          messageText += `Winner: ${match.winner.nickname}`;
        } else {
          messageText += `Result: ${match.player_1_score} - ${match.player_2_score}`;
        }
      } else {
        const player1Name = match.player_1?.nickname || 'TBD';
        const player2Name = match.player_2?.nickname || 'TBD';
        messageText += `${player1Name} vs ${player2Name}`;
      }

      const messageObj = {
        type: 'match_info',
        message: messageText
      };

      this.webSocket.sendMessage(messageObj);
    });
  });
}




 
sendMessage()
{
    if (this.message && this.user.nickname)
    {
      const messageObj = {
        message: this.message,
        username: this.user.nickname
      };
      this.webSocket.sendMessage(messageObj);
      this.message = '';
    }
 }

viewMatches(id: number) {
    this.userService.checkTournamentMatches(id).subscribe({
      next: (data: any) => {
        // this.brackets = data;
        this.tournament_matches = data;
        console.log('tournament matches data...', this.tournament_matches);
        this.organizeMatches();
      },
      error: (err: any) => {
        console.log('error from tournament matches...', err);
      }
    });
    this.fetchPlayerInfo();
  }

  organizeMatches() {
    this.matchesByRound = new Map();
    for (const match of this.tournament_matches) {
      if (!this.matchesByRound.has(match.tree_level)) {
        this.matchesByRound.set(match.tree_level, []);
      }
      this.matchesByRound.get(match.tree_level)?.push(match);
    }
    console.log('matchesByRound', this.matchesByRound);
    this.sendMatchInfoToChat();
  }
}

 

