import { Injectable } from '@angular/core';
import { Observable, Subscriber, observable } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketsService {

  private socket: WebSocket | null = null;
  connect(roomName: string) 
  {
    //Establish connection to the Websocket server
    // this.socket = io('ws://localhost:8000/ws/chat/');
    this.socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);
    this.socket.onopen = () =>
    {
      console.log('Websocket connected');
      const message = 
      {
        'message' : 'Hello world!'
      };
      this.sendMessage(message);
    };
    this.socket.onmessage = (event) => 
    {
      const message = JSON.parse(event.data);
      console.log('Message Received: ', message);
    };
    this.socket.onclose = () =>
    {
      console.log('Websocket disconnected');
    };
    this.socket.onerror = (event) =>
    {
      console.log('Websocket error: ', event);
    };
  }

  sendMessage(message: any)
  {
    if (this.socket)
      this.socket.send(JSON.stringify(message));
    else
      console.log('Websocket is not connected');
  }

  getMessage(): Observable<any>
  {
    return new Observable(observer => {
      if (this.socket)
      {
        this.socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          observer.next(message);
        };
        this.socket.onerror = (error) => {
          observer.error(error);
        };
        this.socket.onclose = () => {
          observer.complete();
        };
      }
      else
        observer.error('WebSocket connection is not established.');
    })
  }

  close()
  {
    this.socket?.close();
  }

  // listen(event: string):Observable<any>
  // {
  //   return new Observable((subscriber) => {
  //     //listen for the specified event and notify to the subscriber
  //     this.socket.on(event, (data: any) => {
  //       subscriber.next(data);
  //     })
  //   })
  // }

  // emit(event: string, data: any)
  // {
  //   //Emit the specified event with data to the websocket server
  //   this.socket.emit(event, data);
  // }
}
