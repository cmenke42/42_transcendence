import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../service/user.service';
import { NgbAccordionBody, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbOffcanvasPanel } from '@ng-bootstrap/ng-bootstrap/offcanvas/offcanvas-panel';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, ScaleType, Color } from '@swimlane/ngx-charts';
import { match } from '../../interface/match';
import { UserProfile } from '../../interface/user-profile';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    NgbAccordionModule,
    CommonModule,
    NgxChartsModule,
    RouterLink
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit{

  @Input() userId: number = 0;

  router = inject(ActivatedRoute);
  userService = inject(UserService);

  user_id: number = this.userId;
  User: UserProfile | null = null;
  match_details : any = null;

  winLossData: any[] = [];
  currentChart: string = 'pie'; //default chart
  UserTitle: string = "";
  scoreData: any[] = [];
  performanceData: any[] = [];
  tournamentList: any[] = [];

  // Custom color scheme
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#007bff', '#dc3545']
  };
  view: [number, number] = [700, 400];
  showTournamentPopup: boolean = false;
  

  ngOnInit(): void 
  {
    console.log("User component is loaded...", this.userId)
    this.userInfo();
    // this.matchDetail();
  }

  @HostListener('window:resize')
  onResize() {
    const width = window.innerWidth;
    if (width <= 400) {
      this.view = [300, 300];
    } else if (width <= 768) {
      this.view = [400, 400];
    } else {
      this.view = [700, 400];
    }
  }

  calculateWinLoss(match_details: any[])
  {
    const win = match_details.reduce((count, match) => {
      const isPlayer1 = match.player_1.user_id === this.user_id || match.player_1.user_id === this.userId;
      const playerScore = isPlayer1 ? match.player_1_score : match.player_2_score;
      const opponentScore = isPlayer1 ? match.player_2_score : match.player_1_score;
      return count + (playerScore > opponentScore ? 1 : 0);
    }, 0);
    
    const loss = match_details.length - win;

    if(win < 5)
      this.UserTitle = "Beginner";
    else if(win < 10)
      this.UserTitle = "Intermediate";
    else
      this.UserTitle = "Expert";
    console.log("User Title: ", this.UserTitle);
    this.winLossData = [
      {name: 'Win', value: win},
      {name: 'Loss', value: loss},
    ];
    this.calculateScore(match_details);
    this.calculatePerformance(match_details);
  }

  calculateScore(match_details: any[]): void {
    this.scoreData = match_details.map(match => {
      const isPlayer1 = match.player_1.user_id === this.user_id || match.player_1.user_id === this.userId;
      const userScore = isPlayer1 ? match.player_1_score : match.player_2_score;
      const opponentScore = isPlayer1 ? match.player_2_score : match.player_1_score;
  
      return {
        name: `Match ${match.id}`,
        series: [
          { name: 'User Score', value: userScore },
          { name: 'Opponent Score', value: opponentScore }
        ]
      };
    });
  }
  

  calculatePerformance(match_details: any[])
  {
    this.performanceData = [
      {
        name: 'User Performance',
        series: match_details.map(match => {
          const isPlayer1 = match.player_1.user_id === this.user_id || match.player_1.user_id === this.userId;
          const userScore = isPlayer1 ? match.player_1_score : match.player_2_score;
          console.log("User Score: ", userScore);
          return {
            name: new Date(match.end_time).toLocaleDateString(),
            value: userScore
          }
        })
      }
    ]
  }
  
  userInfo()
  {
    this.router.params.subscribe(params => {
      this.user_id = params['user_id'];
    });
    if (!this.user_id)
      this.user_id = this.userId;
    this.userService.showProfile(this.user_id).subscribe({
      next: (user) => {
          this.User = user
      },
      error: (error) => {
        console.log("user component error...", error);
      }
    });
    this.matchDetail(this.user_id);
  }


  matchDetail(user_id: number)
  {
    this.userService.match1v1List(user_id).subscribe({
      next: (match) => {
        console.log("match details...", match);
        this.match_details = match;
        this.calculateWinLoss(this.match_details);
        console.log("data from match detail", this.match_details);
      },
      error: (error) => {
        console.log("user component error...", error);
      }
    })
  }

  changeChart(type: string)
  {
    this.currentChart = type;
  }

  showTournament()
  {
    this.userService.showTournament().subscribe({
      next: (data: any) => {
        this.tournamentList = data;
        console.log('show tournament data...', data);
        this.showTournamentPopup = true;
      },
      error: (err: any) => {
        console.log('error from show tournament...', err);
      }
    });
  }

  closeTournamentPopup() {
    this.showTournamentPopup = false;
  }

}
