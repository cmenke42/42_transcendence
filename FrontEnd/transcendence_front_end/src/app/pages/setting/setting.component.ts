import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ChatService } from '../../service/chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css'
})
export class SettingComponent implements OnInit, OnDestroy {
  messages: string[] = [];
  message: string = '';

  constructor(private chatService: ChatService) { }
  ngOnInit(): void {
    this.chatService;
  }

  ngOnDestroy(): void {
    this.disconnectSocket();
  }

  disconnectSocket() {
    this.chatService;
  }

  sendMessage()
  {
    if (this.message.trim())
    {
      this.chatService.sendMessage(this.message);
      this.message = '';
    }
  }
}

/* 
  ngOnInit(): void {
    this.initializeSocketConnection();
    this.receiveSocketResponse();
  }

  ngOnDestroy(): void {
    this.disconnectSocket();
  }

  initializeSocketConnection(): void {
    this.chatService.connect('room_name_or_identifier');
  }

  sendMessage(): void {
    this.chatService.connectSocket(this.message);
    this.message = ''; // Clear input field after sending message
  }

  receiveSocketResponse(): void {
    this.chatService.receiveStatus().subscribe((receivedMessage: any) => {
      this.messages.push(receivedMessage);
    });
  }

  disconnectSocket(): void {
    this.chatService.disconnectSocket();
  }

*/