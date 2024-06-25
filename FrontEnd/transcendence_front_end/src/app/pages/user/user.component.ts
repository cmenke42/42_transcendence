import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { NgbAccordionBody, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbOffcanvasPanel } from '@ng-bootstrap/ng-bootstrap/offcanvas/offcanvas-panel';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    NgbAccordionModule
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit{

  router = inject(ActivatedRoute);
  router1 = inject(Router);
  userService = inject(UserService);
  user_id: number = 0;
  User: any = null;

  ngOnInit(): void {
    this.router.params.subscribe(params => {
      this.user_id = params['user_id'];
    })

    this.userService.showProfile(this.user_id).subscribe({
      next: (user) => {
          this.User = user;
      },
      error: (error) => {
        this.router1.navigate(['/404']);
      }
    })
  }

}
