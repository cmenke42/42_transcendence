import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';




@Injectable({
  providedIn: 'root'
})
export class ChatService {
 
    private socket: WebSocket | null = null;

    constructor()
    {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat/`);

      this.socket.onmessage = (event) => this.onMessage(event);
      this.socket.onclose = (event) => this.onClose(event);
      this.socket.onerror = (event) => this.onError(event);
      this.socket.onopen = () => console.log('WebSocket connection opened');
    }

    private onMessage(event: MessageEvent)
    {
      const data = JSON.parse(event.data);
      const message = data['message'];
      console.log('Received message:', message);
    }

    private onError(event: Event) {
      console.error('WebSocket error:', event);
    }

    private onClose(event: CloseEvent)
    {
      console.error('Chat socket closed unexpectedly');
    }

    sendMessage(message: string)
    {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ 'message': message }));
      } else {
        console.error('WebSocket is not open. Ready state is:', this.socket?.readyState);
      }
    }
}

  /* 
  
  import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatSocket: WebSocket;

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/');

    this.chatSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const message = data['message'];
      // Handle incoming message
      console.log(message);
    };

    this.chatSocket.onclose = (event) => {
      console.error('Chat socket closed unexpectedly');
    };
  }

  sendMessage(message: string): void {
    this.chatSocket.send(JSON.stringify({
      'message': message
    }));
  }
}

component thingy

sendMessage(message: string): void {
    this.chatService.sendMessage(message);
  }
  */
  


  // private socker1: WebSocket;
/*   private socket: WebSocket;

  constructor() {}

  connect(roomName: string) {
    // Connect to the WebSocket with the specified room name
    this.socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}`);
  }

  // Send a message to the server
  sendMessage(message: string) {
    this.socket.send(message);
  }

  // Receive messages from the server
  receiveMessages() {
    this.socket.onmessage = (event) => {
      console.log(event.data);
    };
  }

  // Disconnect from the server
  disconnect() {
    this.socket.close();
  } */
//   private socket: Socket
//   constructor() 
//   {
//     this.socket = new Socket({
//       url: 'ws://localhost:8000/ws/chat',
//       options: {}
//     })
//   }

//   connect(roomName: string) {
//     // Connect to the WebSocket with the specified room name
//     this.socket.ioSocket.io.opts.query = { room_name: roomName };
//     this.socket.connect();
//   }

//    // this method is used to start connection/handhshake of socket with server
//  connectSocket(message: string) {
//   this.socket.emit('customconnect', message);
//  }

//    // this method is used to get response from server
//  receiveStatus() {
//   return this.socket.fromEvent('/get-response');
//  }

//    // this method is used to end web socket connection
//  disconnectSocket() {
//   this.socket.disconnect();
//  }

