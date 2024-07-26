import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../service/user.service';
import { NgbAccordionBody, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbOffcanvasPanel } from '@ng-bootstrap/ng-bootstrap/offcanvas/offcanvas-panel';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, ScaleType, Color } from '@swimlane/ngx-charts';

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
  User: any = null;
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
    this.matchDetail();
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
    let win = 0;
    let loss = 0;
    let draw = 0;
   
      match_details.forEach((element : any) => {
      if (element.user_score > element.opponent_score)
        win++;
      else if (element.user_score < element.opponent_score)
        loss++;
      else
        draw++;
    });

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

  calculateScore(match_details: any[])
  {
    this.scoreData = match_details.map(match => ({
      name: `Match ${match.id}`,
      series: [
        {name: 'User Score', value: match.user_score},
        {name: 'Opponent Score', value: match.opponent_score}
      ]
    }))
  }

  calculatePerformance(match_details: any[])
  {
    this.performanceData = [
      {
        name: 'User Performance',
        series: match_details.map(match => ({
          name: new Date(match.finished_data).toLocaleDateString(),
          value: match.user_score
        }))
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
  }


  matchDetail()
  {
    this.userService.match1v1List(this.user_id).subscribe({
      next: (match) => {
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
