import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SocketsService } from '../../service/sockets.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserService } from '../../service/user.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {

  
  username: string | null = null;

  userService = inject(UserService);
  websocketService = inject(SocketsService);
  router = inject(ActivatedRoute);
  messages: any[] = [];
  message: string = '';
  roomName: string = 'example_room'; //Replace with your room name logic
  private subscription: Subscription | null = null;
  private private_subscription: Subscription | null = null;

  // p_username: string = 'private_user';
  // recipient: string = 'receiver';
  private_messages: any[] = [];
  private_message: string = '';
  sender: string = 'nickname-2';
  receiver: string = 'nickname-2';


  ngOnInit(): void 
  {
    this.router.params.subscribe(params => {
      this.username = params['username'];
      console.log('user name : ', this.username);
    })
    // if (this.username)
    //   this.websocketService.connect(this.roomName, this.username);

    // this.subscription = this.websocketService.getMessage().subscribe((message) => {
    //   this.messages.push(message);
    //   console.log('is it the message', message);
    // });
    if (this.username)
      this.websocketService.privateConnect(this.username, this.receiver);
    this.private_subscription = this.websocketService.privateGetMessage().subscribe((message) => {
      this.private_messages.push(message);
      console.log('is it the private message', message);
    })
  }

  sendPrivateMessage(): void
  {
    if (this.private_message)
      this.websocketService.privateSendMessage(this.private_message);
    this.private_message = '';
  }
  sendMessage()
  {
    if (this.message )
        this.websocketService.sendMessage(this.message);
    this.message = '';
 }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.websocketService.close();
  }
}


/* 
@Component({
  selector: 'app-chat',
  template: `
    <div *ngFor="let msg of messages">
      <strong>{{msg.sender}}:</strong> {{msg.message}}
    </div>
    <input [(ngModel)]="message" placeholder="Type your message">
    <input [(ngModel)]="recipient" placeholder="Recipient username">
    <button (click)="sendMessage()">Send</button>
  `
})
export class ChatComponent implements OnInit {
  messages: any[] = [];
  message: string = '';
  recipient: string = '';
  username: string = 'current_user'; // Replace with actual current user's username

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    this.wsService.connect(this.username);
    this.wsService.getMessages().subscribe(msg => {
      this.messages.push(msg);
    });
  }

  sendMessage(): void {
    if (this.message && this.recipient) {
      this.wsService.sendMessage(this.recipient, this.message);
      this.message = '';
    }
  }
}
*/