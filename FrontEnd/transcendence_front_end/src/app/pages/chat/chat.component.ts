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

  
  username: string = '';

  userService = inject(UserService);
  websocketService = inject(SocketsService);
  router = inject(ActivatedRoute);
  messages: any[] = [];
  message: string = '';
  roomName: string = 'example_room'; //Replace with your room name logic
  private subscription: Subscription | null = null;
  // private private_subscription: Subscription | null = null;

  // // p_username: string = 'private_user';
  // // recipient: string = 'receiver';
  // private_messages: any[] = [];
  // private_message: string = '';
  // sender: string = this.username;
  // receiver: string = 'nickname-2';


  ngOnInit(): void 
  {
    this.router.params.subscribe(params => {
      this.username = params['username'];
      console.log('user name : ', this.username);
    })
    if (this.username)
      this.websocketService.connect(this.roomName, this.username);

    this.subscription = this.websocketService.getMessage().subscribe((message) => {
      this.messages.push(message);
      console.log('is it the message', message);
    });

  }


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

