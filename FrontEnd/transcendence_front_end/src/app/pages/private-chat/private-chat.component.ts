import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { UserService } from '../../service/user.service';
import { SocketsService } from '../../service/sockets.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../interface/user-profile';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './private-chat.component.html',
  styleUrl: './private-chat.component.css'
})
export class PrivateChatComponent implements OnInit, OnDestroy {

  userService = inject(UserService);
  socketService = inject(SocketsService);
  router = inject(Router);
  receiver: string = '';
  current_user : string = '';
  message: string = '';
  messages = new BehaviorSubject<any[]>([]);
  private subscription: Subscription | null = null;
  user_id: number = 0;

  users: any[] = [];
  selected_user: any = null; // the user that is currently selected
  unreadMessages: { [key: string]: number } = {};
  private fetchUnreadMessageCountsInterval: any;


  ngOnInit(): void {

    this.userService.getterProfile().subscribe(data => {
      this.current_user = data.nickname;
      this.fetchUnreadMessageCounts();
    });
    this.userService.showListProfiles().subscribe(users => {
      this.users = users;
    })

    this.fetchUnreadMessageCountsInterval =  setInterval(() => this.fetchUnreadMessageCounts(), 3000);
    // setInterval(() => this.fetchUnreadMessageCounts(), 3000)
  }

  fetchUnreadMessageCounts() {
    if (this.current_user)
    {
      this.socketService.getUnreadMessageCounts(this.current_user).subscribe({
        next: (response: any) => {
          if (response && response.unread_counts) {
            this.unreadMessages = response.unread_counts;
          } else {
            console.error('Unexpected response format:', response);
          }
        },
        error: (err) => {
          console.log('Error fetching unread message counts: ', err);
        }
      });
    }
  }


  selectUser(user: UserProfile)
  {
    this.receiver = user.nickname;
    this.user_id = user.user_id;
    this.selected_user = user;
    this.socketService.privateConnect(this.current_user, this.receiver);
    this.fetchMessages();
    this.markMessagesAsRead();
    this.subscription?.unsubscribe();

    // subscribe to the new message stream
    this.subscription = this.socketService.privateGetMessage().subscribe({
      next: (message) => {
        const current_message = this.messages.getValue();
        this.messages.next([...current_message, message]);
    },
    error: (err) => {
      console.log('Error fetching messages: ', err);
    }
  })
  }

  markMessagesAsRead()
  {
    this.socketService.messageRead(this.current_user, this.receiver).subscribe({
      next: (response: any) => {

        this.unreadMessages[this.receiver] = 0; // reset the unread count
      },
      error: (err) => {
        console.log('Error marking messages as read: ', err);
      }
    });
  }


  fetchMessages()
  {
    this.socketService.getChatMessages(this.current_user, this.receiver).subscribe({
      next: (response: any) => {
        console.log("response fetch message: ", response);
        if (Array.isArray(response.message))
          this.messages.next(response.message);
        else
        {
          console.log('Error fetching messages: ', response);
          this.messages.next([]);
        }
      },
      error: (err) => {
        console.log('Error fetching messages error: ', err);
        this.messages.next([]);
      }
    })
  }


  sendMessage()
  {
    if (this.message)
      this.socketService.privateSendMessage(this.message);
    this.message = '';
  }

  ngOnDestroy()
  {
    this.subscription?.unsubscribe();
    this.socketService.privateClose();
    clearInterval(this.fetchUnreadMessageCountsInterval);
  }

}
