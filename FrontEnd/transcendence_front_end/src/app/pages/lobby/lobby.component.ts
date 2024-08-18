import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { UserProfile } from '../../interface/user-profile';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, RouterLinkActive, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatchMakingComponent } from "../match-making/match-making.component";
import { MatchType } from '../../interface/remote-game.interface';
import { FormsModule } from '@angular/forms';
import { PopupMessageService } from '../../service/popup-message.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    NgbNavModule,
    CommonModule,
    RouterModule,
    MatchMakingComponent,
    FormsModule,
    TranslateModule,
],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css'
})
export class LobbyComponent implements OnInit{
  constructor(
    private popupMessageService: PopupMessageService,
    private translate: TranslateService) {
      const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
      this.translate.use(preferredLanguage); 
    }
  active = 1;
  oneVsOneMatches: any[] = []; // Populate this with your 1v1 matches
  tournamentMatches: any[] = [];
  tournamentList: any[] = [];
  isModalOpen: boolean = false;
  maxPlayers: number = 8;

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

    this.showTournament();
    // this.getUserTournamentStatus();
   
  }

  matchDetails(user_data: UserProfile)
  {
    if (user_data !== undefined)
    {
      this.userService.match1v1List(user_data.user_id).subscribe({
        next: (data: any) => {
          // if (data && data.matches && Array.isArray(data.matches))
            this.oneVsOneMatches = data;
            console.log('match details data to show...', data);
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
    //alert('Game start with id: ' + id);
    this.popupMessageService.showMessage(('Game start with id: ' + id), 'info');
  }

  createTournament(maxPlayers : number)
  {
    this.userService.createTournament(maxPlayers).subscribe({
      next: (data: any) => {
        this.popupMessageService.showMessage('Tournament created successfully...', 'success');
        //alert("Tournament created successfully...")
        this.ngOnInit();
      },
      error: (err: any) => {
        console.log('error from create tournament...', err);
      }
    });
    this.closeModal();
  }

  showTournament()
  {
    this.userService.showTournament().subscribe({
      next: (data: any) => {
        this.tournamentList = data;
        console.log('show tournament data...', data);
      },
      error: (err: any) => {
        console.log('error from show tournament...', err);
      }
    });
  }



  joinTournament(id: number)
  {
    this.userService.joinTournament(id).subscribe({
      next: (data: any) => {
        //alert(data.detail);
        this.popupMessageService.showMessage(data.detail, 'info');
        console.log('join tournament data...', data);
        this.ngOnInit();
      },
      error: (err: any) => {
        this.popupMessageService.showMessage(err.error.detail, 'error');
        //alert(err.error.detail)
        console.log('error from join tournament...', err);
      }
    });
  }

  leaveTournament(id: number)
  {
    this.userService.leaveTournament(id).subscribe({
      next: (data: any) => {
        //alert(data.detail);
        this.popupMessageService.showMessage(data.detail, 'info');
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
        //alert(data.detail);
        this.popupMessageService.showMessage(data.detail, 'info');
        this.ngOnInit();
        console.log('start tournament data...', data);
      },
      error: (err: any) => {
        console.log('error from start tournament...', err);
      }
    });
  }

  openModal()
  {
    this.isModalOpen = true;
  
  }
  closeModal()
  {
    this.isModalOpen = false;
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

}
