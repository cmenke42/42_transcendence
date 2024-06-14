import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SocketsService } from '../../service/sockets.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {

  websocketService = inject(SocketsService);
  messages: any[] = [];
  message: string = '';
  roomName: string = 'example_room'; //Replace with your room name logic
  private subscription: Subscription | null = null;

  ngOnInit(): void 
  {
    this.websocketService.connect(this.roomName);

    this.subscription = this.websocketService.getMessage().subscribe((message) => {
      this.messages.push(message);
      console.log(message);
    });
  }

  sendMessage()
  {
    if (this.message)
        this.websocketService.sendMessage({ text: this.message});
    this.message = '';
 }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.websocketService.close();
  }

}
  
  // message: string[] = [];
  // newMessage: string = '';
  // ngOnInit(): void {
  //   //subscribe to the 'message' event and update the UI
  //   this.websocketService.listen('message').subscribe((data) => {
  //     console.log('check ');
  //     this.message.push(data);
  //   })
  // }

  // sendMessage()
  // {
  //   //emit the 'message' event with the message to the websocket server
  //   this.websocketService.emit('message', this.newMessage);
  //   this.newMessage = '';
  // }

