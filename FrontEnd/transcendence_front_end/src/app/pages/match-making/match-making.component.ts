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
  brackets: any[][] = []; // 2D array to represent the brackets


  selectMatch: any = null;
  tournamentStatus: string = '';
  tournamentWinner: string | null = null;
  isChatOpen: boolean = false;
  messages: any[] = [];
  message: string = '';
  tournament_matches: match | any = {};
  user: UserProfile | any = {};
  private subscription: Subscription | null = null;
  isOpen: boolean = false;
  playerInfo: any = null;

  MatchType = MatchType;

  constructor() {

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
    this.fetchPlayerInfo();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.webSocket.close();
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

sendUpcomingMatchesInfo() {
  const upcomingMatches = this.getUpcomingMatches();
  const byeMatches = this.getByeMatches();

  if (upcomingMatches.length > 0 || byeMatches.length > 0) {
    const messageObj = {
      type: 'system',
      message: 'Match Information:',
      upcomingMatches: upcomingMatches,
      byeMatches: byeMatches
    };
    this.webSocket.sendMessage(messageObj);
  }
}

 
sendBracketInfo()
{
  let bracketInfo = "Tournament info: \n";

  this.brackets.forEach((stage, stageIndex) => {
    bracketInfo += `\nRound ${stageIndex + 1}:\n`;
    stage.forEach(match => {
      bracketInfo += `Match ${match.id}: ${match.player1 || 'Bye'} vs ${match.player2 || 'Bye'}\n`;
      if (match.is_played) {
        bracketInfo += ` - Winner: ${match.winner || 'Not determined'}\n`;
      }
      bracketInfo += '\n';
    })
  })

  const messageObj = {
    type: 'system',
    message: bracketInfo
  };
  this.webSocket.sendMessage(messageObj);
}


getUpcomingMatches(): any[] {
  const upcomingMatches = [];
  for (const stage of this.brackets) {
    for (const match of stage) {
      if (!match.is_played && match.player1 && match.player2) {
        upcomingMatches.push({
          id: match.id,
          player1: match.player1,
          player2: match.player2
        });
      }
    }
    if (upcomingMatches.length > 0) break;
  }
  return upcomingMatches;
}

getByeMatches(): any[] {
  const byeMatches = [];
  for (const stage of this.brackets) {
    for (const match of stage) {
      if (match.is_bye) {
        byeMatches.push({
          id: match.id,
          player1: match.player1,
          player2: 'Bye',
          winner: match.player1
        });
      }
    }
  }
  return byeMatches;
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
        this.tournament_matches.tournament_id = id;
        this.tournamentStatus = data.status;
        this.tournamentWinner = data.winner;
        this.brackets = this.formatMatches(data.matches);
        console.log('tournament matches data...', this.brackets);
        //send initial bracket info
        this.sendBracketInfo();
      },
      error: (err: any) => {
        console.log('error from tournament matches...', err);
      }
    });
  }

  formatMatches(data: any): any[][] {
    const stages = [];
    let matchesPerStage = Math.pow(2, Math.floor(Math.log2(data.length)));
  
    while (matchesPerStage >= 1) {
      const currentStage = [];
      for (let i = 0; i < matchesPerStage && data.length > 0; i++) {
        const match = data.shift();
        if (match) {
          currentStage.push({
            ...match,
            winner: match.is_bye ? match.player1 : 
                    (match.is_played ? 
                      (match.player1Score > match.player2Score ? match.player1 : match.player2) 
                      : null)
          });
        }
      }
      stages.push(currentStage);
      matchesPerStage = Math.floor(matchesPerStage / 2);
    }
  
    return stages;
  }
  


  
  submitScore(id: number, player1Score: number, player2Score: number) 
  {
    this.tournament_matches.match_id = id;
    this.tournament_matches.player1_Score = player1Score;
    this.tournament_matches.player2_Score = player2Score;
    console.log('tournament match data...', this.tournament_matches);
    this.userService.matchScore(this.tournament_matches).subscribe({
    next: (response: any) => {
        alert('Score submitted successfully');
        this.viewMatches(this.tournament_matches.tournament_id);
        this.sendBracketInfo();
    },
    error: (err: any) => {
        console.log('error from submit score...', err);
    }
    });
  }
}

