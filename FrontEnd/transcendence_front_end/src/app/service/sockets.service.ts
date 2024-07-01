import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, Subscriber } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class SocketsService {

  // private private_socket: WebsocketSubject<any>
  private socket: WebSocket | null = null;
  private private_socket: WebSocket | null = null;
  private message_subject = new Subject<any>();
  private http = inject(HttpClient);
  // private username: string = 'user1';
  connect(roomName: string, user: string) 
  {
    //Establish connection to the Websocket server
    // this.socket = io('ws://localhost:8000/ws/chat/');
    this.socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);
    const message = 
    {
      'message' : '',
      'username' : user,
    };
    this.socket.onopen = () =>
    {
      console.log('Websocket connected');
      this.sendMessage(message);
    };
    this.socket.onmessage = (event) => 
    {
      if (typeof message === 'object' && this.socket && this.socket.readyState === WebSocket.OPEN) {
        const messageString = JSON.stringify(message);
        console.log('stringify JSON : ', messageString);
        this.socket.send(messageString);
      } else {
        console.error('Invalid message format or WebSocket not open');
      }
    };
    this.socket.onclose = () =>
    {
      console.log('Websocket disconnected');
      this.sendMessage({ username: 'System', message: `${message.username} has left the chat` });
    };
    this.socket.onerror = (event) =>
    {
      console.log('Websocket error: ', event);
    };
  }

  sendMessage(message: any)
  {
    if (this.socket && this.socket.readyState === WebSocket.OPEN)
    {
      console.log('stringfy JSON : ' , JSON.stringify(message));
      this.socket.send(JSON.stringify(message));
    }
    else
      console.log('Websocket is not connected');
  }

  getMessage(): Observable<any>
  {
    return new Observable(observer => {
      if (this.socket)
      {
        this.socket.onmessage = (event) => {
          const message = JSON.parse(event.data.toString());
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
    if (this.socket)
        this.socket.close();
  }


  // private user
  privateConnect(sender: string, receiver: string)
  {
    if (this.private_socket) //why?
      this.private_socket.close();
    this.private_socket = new WebSocket(`ws://localhost:8000/ws/private_chat/${sender}/${receiver}/`);
    this.private_socket.onopen = () =>
    {
      console.log('Websocket connected');
      this.messageRead(sender, receiver);
    };
    this.private_socket.onmessage = (event) => 
    {
      const message = JSON.parse(event.data.toString());
      console.log('Message received: ', event.data);
      this.message_subject.next(message);
    };
    this.private_socket.onclose = () =>
    {
      console.log('Websocket disconnected');
    };
    this.private_socket.onerror = (event) =>
    {
      console.log('Websocket error: ', event);
    };
  }

  privateSendMessage(message: string)
  {
    if (this.private_socket && this.private_socket.readyState === WebSocket.OPEN)
        this.private_socket.send(JSON.stringify({ message }));
    else
      console.log('Websocket is not connected');
  }

  privateGetMessage() : Observable<any>
  {
    return new Observable(observer => {
      if (this.private_socket)
      {
        this.private_socket.onmessage = (event) => {
          const message = JSON.parse(event.data.toString());
          observer.next(message);
        };
        this.private_socket.onerror = (error) => {
          observer.error(error);
        };
        this.private_socket.onclose = () => {
          observer.complete();
        };
      }
      else
        observer.error('WebSocket connection is not established.');
    })
  }

  getChatMessages(sender: string, receiver: string): Observable<any>
  {
    return this.http.get(`http://localhost:8000/api/v1/get_messages/?sender=${sender}&receiver=${receiver}`);
  }

  messageRead(receiver:string, sender:string,) : Observable<any>
  {
    return this.http.put(`http://localhost:8000/api/v1/mark_message_as_read/`, { receiver, sender });
  }

  getUnreadMessageCounts(currentUser: string): Observable<any> {
    return this.http.get(`http://localhost:8000/api/v1/get_unread_message_counts/?current_user=${currentUser}`);
  }
  
  privateClose()
  {
    if (this.private_socket)
        this.private_socket.close();
  }


}

