import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { UserProfile } from '../../interface/user-profile';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, RouterLinkActive, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatchMakingComponent } from "../match-making/match-making.component";
import { MatchType } from '../../interface/remote-game.interface';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    NgbNavModule,
    CommonModule,
    RouterModule,
    MatchMakingComponent,
],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css'
})
export class LobbyComponent implements OnInit{

  active = 1;
  oneVsOneMatches: any[] = []; // Populate this with your 1v1 matches
  tournamentMatches: any[] = [];
  tournamentList: any[] = [];

  userService = inject(UserService);
  user_data : UserProfile | null = null;
  nickname: string = '';
  brackets: any[] = [];

  MatchType = MatchType;

  ngOnInit(): void {
    this.getUser();
    this.userService.getterProfile().subscribe((data) => {
      this.user_data = data;
      console.log('data from lobby...', this.user_data);
      this.matchDetails(this.user_data!);
    });

    // this.showTournament();
    this.getUserTournamentStatus();
   
  }

  matchDetails(user_data: UserProfile)
  {
    if (user_data !== undefined)
    {
      this.userService.match1v1List(user_data.user_id).subscribe({
        next: (data: any) => {
          // if (data && data.matches && Array.isArray(data.matches))
            this.oneVsOneMatches = data;
          console.log('match details data...', data);
            // this.matchData(user_data, data.matches);
          // else
          //   this.oneVsOneMatches = [];
        },
        error: (err: any) => {
          console.log('error from match details...', err);
        }
      });
    }
    else
      console.log('lobby: User id is undefined....');
  }

  GameStart(id: number)
  {
    alert('Game start with id: ' + id);
  }

  createTournament()
  {
    this.userService.createTournament().subscribe({
      next: (data: any) => {
        console.log('create tournament data...', data);
        this.ngOnInit();
      },
      error: (err: any) => {
        console.log('error from create tournament...', err);
      }
    });
  }

  showTournament()
  {
    this.userService.showTournament().subscribe({
      next: (data: any) => {
        this.tournamentList = data;
      },
      error: (err: any) => {
        console.log('error from show tournament...', err);
      }
    });
  }

  getUserTournamentStatus()
  {
    this.userService.UserTournamentStatus().subscribe({
      next: (data: any) => {
        this.tournamentList = data;
        console.log('user tournament status...', data);
      },
      error: (err: any) => {
        console.log('error from user tournament status...', err);
      }
    });
  }

  joinTournament(id: number)
  {
    this.userService.joinTournament(id).subscribe({
      next: (data: any) => {
        alert(data.message);
        console.log('join tournament data...', data);
        this.ngOnInit();
      },
      error: (err: any) => {
        console.log('error from join tournament...', err);
      }
    });
  }

  leaveTournament(id: number)
  {
    this.userService.leaveTournament(id).subscribe({
      next: (data: any) => {
        alert(data.message);
        console.log('leave tournament data...', data);
        this.ngOnInit();
      },
      error: (err: any) => {
        console.log('error from leave tournament...', err);
      }
    });
  }

  startTournament(id: number)
  {
    this.userService.startTournament(id).subscribe({
      next: (data: any) => {
        alert(data.message);
        this.ngOnInit();
        console.log('start tournament data...', data);
      },
      error: (err: any) => {
        console.log('error from start tournament...', err);
      }
    });
  }

  viewMatches(id: number)
  {
    this.userService.checkTournamentMatches(id).subscribe({
      next: (data: any) => {
        this.brackets = data;
        console.log('tournament matches data...', this.brackets);
      },
      error: (err: any) => {
        console.log('error from tournament matches...', err);
      }
    });
  }

  getUser()
  {
    this.userService.getterProfile().subscribe({
      next: (data: any) => {
        this.nickname = data.nickname;
      },
      error: (error: any) => {
        console.log('error for the profile user in chat...', error);
      }
    });
  }

 /*  matchData(user_data: UserProfile, match_detail: any)
  {
    console.log('joining the data of ', user_data, ' and ', match_detail)
  }
 */
}
