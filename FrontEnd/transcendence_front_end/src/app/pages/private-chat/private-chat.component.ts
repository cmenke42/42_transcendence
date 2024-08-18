import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { UserService } from '../../service/user.service';
import { SocketsService } from '../../service/sockets.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../interface/user-profile';
import { User } from '../../interface/user';
import { ProfileUpdateService } from '../../service/ProfileUpdateService';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupMessageService } from '../../service/popup-message.service';


@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
  ],
  templateUrl: './private-chat.component.html',
  styleUrl: './private-chat.component.css'
})
export class PrivateChatComponent implements OnInit, OnDestroy {

  userService = inject(UserService);
  socketService = inject(SocketsService);
  profileUpdateService = inject(ProfileUpdateService);
  // cdr = inject(ChangeDetectorRef);
  router = inject(Router);
  receiver: string = '';
  receiver_data : UserProfile | null = null;
  current_user : string = '';
  message: string = '';
  messages = new BehaviorSubject<any[]>([]);
  private subscription: Subscription | null = null;
  user_id: number = 0;

  onlineUser : string[] = [];
  users: any[] = [];
  selected_user: any = null; // the user that is currently selected
  unreadMessages: { [key: string]: number } = {};
  private fetchUnreadMessageCountsInterval: any;
  invitation: string | null = null;


  constructor(
    private translate: TranslateService, private popupMessageService: PopupMessageService
  ) {
    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
    this.translate.use(preferredLanguage); 
  }

  ngOnInit(): void {

    this.getProfile();

    this.socketService.getOnlineStatus().subscribe(users => {
      console.log("Received online users in component:", users);
      this.onlineUser = users;
    });

    this.userRelation();

    // this.fetchUnreadMessageCountsInterval =  setInterval(() => this.fetchUnreadMessageCounts(), 3000);
    // setInterval(() => this.fetchUnreadMessageCounts(), 3000)
  }

  ngOnDestroy()
  {
    this.subscription?.unsubscribe();
    this.socketService.privateClose();
    clearInterval(this.fetchUnreadMessageCountsInterval); // do we need it?
    this.socketService.disconnectOnlineStatus(this.current_user);
  }

  userRelation()
  {
    this.userService.userListRelationships().subscribe({
      next: (users: any[]) => {
      this.users = users.filter(user => 
          user.nickname !== 'nickname-1' && user.friendship_status !== 'blocked'
        );
        console.log("filtered user list", this.users);
      },
      error: (err) => {
        console.log("Error...", err);
      }
    })
  }

  getProfile()
  {
    this.userService.getterProfile().subscribe(data => {
      this.current_user = data.nickname;
      console.log("what is data here? ", data);
      console.log("current user in private chat : ", this.current_user);
      this.fetchUnreadMessageCounts();
      this.socketService.connectOnlineStatus(this.current_user);
    });
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
    this.receiver_data = user;
    this.user_id = user.user_id;
    this.selected_user = user;
    this.socketService.privateConnect(this.current_user, this.receiver_data.nickname);
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

    this.subscription = this.userService.checkGameInvitation(this.user_id).subscribe({
      next: (response: any) => {
        this.invitation = response.status;
        // console.log("response check game invite: ", this.invitation);  
      },
      error: (err : any) => {
        console.log("Error checking game invite", err);
        this.popupMessageService.showMessage(this.user_id.toString(), 'error');
        //alert(this.user_id);
      }
    });
  }

  markMessagesAsRead()
  {
    if (this.receiver_data)
    {
    this.socketService.messageRead(this.current_user, this.receiver_data?.nickname).subscribe({
      next: (response: any) => {
        if (this.receiver_data)
          this.unreadMessages[this.receiver_data?.nickname] = 0; // reset the unread count
      },
      error: (err) => {
        console.log('Error marking messages as read: ', err);
      }
    });
  }
  }


  fetchMessages()
  {
    if (this.receiver_data)
    {
    this.socketService.getChatMessages(this.current_user, this.receiver_data?.nickname).subscribe({
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
  }


  sendMessage()
  {
    if (this.message)
      this.socketService.privateSendMessage(this.message);
    this.message = '';
  }

 

  isUserOnline(user: string) : boolean
  {
    console.log("online user", this.onlineUser);
    return this.onlineUser.includes(user);
  }

  gameInvite(receiver: number)
  {
    this.popupMessageService.showMessage('Game invite has been sent', 'success');
    this.userService.sendGameInvitation(receiver).subscribe(
        {
         next: () => {
          // this.ngOnInit();
          this.router.navigate(['/home/lobby']);
          // this.cdr.detectChanges();
          
        },
        error: (err : any) => {
          console.log("Error sending game invite", err);
          this.popupMessageService.showMessage("Error sending game invite", 'error');
          //alert("Error sending game invite");
        }
      });
  }

  getAvatarUrl(user: any): string {
    if (user.intra_avatar) {
      return user.intra_avatar;
    } else if (user.avatar) {
      return user.avatar;
    } else {
      return '../../../assets/default-avatar.png';
    }
  }


  // checkGameInvite(id: number)
  // {
  //   this.userService.checkGameInvitation(id).subscribe(
  //     {
  //      next: (response: any) => {
  //       if (response.invitation)
  //         alert("You have a game invitation from " + response.invitation.sender);
  //       else
  //         alert("No game invitation");
  //       // this.cdr.detectChanges();
  //       // this.ngOnInit();
  //     },
  //     error: (err : any) => {
  //       console.log("Error checking game invite", err);
  //       alert("Error checking game invite");
  //     }
  //   });
  // }

  responseGameInvite(id: number, status: string)
  {
    this.userService.InvitationResponse(id, status).subscribe(
      {
       next: () => {
        this.popupMessageService.showMessage("Game invite response sent successfully", 'success');
        //alert("Game invite response sent successfully");
        // this.ngOnInit();
        this.router.navigate(['/home/lobby']);
        // this.cdr.detectChanges();
        // this.router.navigate(['/home/private_chat'], { queryParams: { refresh: new Date().getTime() } });
        
      },
      error: (err : any) => {
        console.log("Error sending game invite response", err);
        this.popupMessageService.showMessage("Error sending game invite response", 'error');
        //alert("Error sending game invite response");
      }
    });
  }
  
}


  