import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SocketsService } from '../../service/sockets.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserService } from '../../service/user.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';



@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {

  
  username: string = '';
  tournament_id: number = 0;
  isOpen: boolean = false;
  
  userService = inject(UserService);
  websocketService = inject(SocketsService);
  router = inject(ActivatedRoute);
  messages: any[] = [];
  message: string = '';
  roomName: string = 'example_room'; //Replace with your room name logic
  private subscription: Subscription | null = null;


  ngOnInit(): void 
  {
    this.router.params.subscribe(params => {
      this.getUser();
      this.tournament_id = params['tournament_id'];
    })

    // if (this.username)
    // {
    //   console.log('Hello')
    //   this.websocketService.connect(this.tournament_id.toString(), this.username);
    // }

    // this.subscription = this.websocketService.getMessage().subscribe((message) => {
    //   this.messages.push(message);
    //   console.log('is it the message', message);
    // });

  }


  chat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.username) {
        console.log('Hello');
        this.websocketService.connect(this.tournament_id.toString(), this.username);
      }

      this.subscription = this.websocketService.getMessage().subscribe((message) => {
        this.messages.push(message);
        console.log('Received message:', message);
      });
    } else {
      this.websocketService.close();
      this.subscription?.unsubscribe();
    }
  }

  getUser()
  {
    this.userService.getterProfile().subscribe({
      next: (data: any) => {
        console.log('data for the profile user in chat...', data);
        this.username = data.nickname;
      },
      error: (error: any) => {
        console.log('error for the profile user in chat...', error);
      }
    });
  }

  constructor( private translate: TranslateService ) {}

  sendMessage()
  {
    if (this.message && this.username)
    {
      const messageObj = {
        message: this.message,
        username: this.username
      };
      this.websocketService.sendMessage(messageObj);
      this.message = '';
    }
 }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.websocketService.close();
  }
}

