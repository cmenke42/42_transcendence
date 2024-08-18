import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscriber, timestamp } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SocketsService {

  // private private_socket: WebsocketSubject<any>
  private socket: WebSocket | null = null;
  // private private_socket: WebSocket | null = null;
  private message_subject = new Subject<any>();
  private http = inject(HttpClient);
  _authService = inject(AuthService);
  private onlineUsers = new BehaviorSubject<string[]>([]);

  connectionAll(url_link: string) : WebSocket
  {
    const accessToken = this._authService.getAccessToken() || '';
    const url = new URL(url_link);
    url.searchParams.append('access_token', accessToken);
    this.socket = new WebSocket(url.toString());
    return this.socket;
  }

  connect(roomName: string, user: string) 
  {
    //const socket  = this.connectionAll(`wss://localhost:6010/ws/chat/${roomName}/`);
    const socket  = this.connectionAll(`wss://${environment.Backend_IP}:6010/ws/chat/${roomName}/`);


    socket.onopen = () =>
    {
      console.log('Websocket connected');
      this.sendMessage({message: '', username: user});
    };
    socket.onmessage = (event) => 
    {
      try
      {
        const message = JSON.parse(event.data);
        this.message_subject.next(message);
      }
      catch (error)
      {
        console.error('Invalid message format', error);
      }
    };
    socket.onclose = () =>
    {
      console.log('Websocket disconnected');
      this.sendMessage({ username: 'System', message: `${user} has left the chat` });
    };
    socket.onerror = (event) =>
    {
      console.log('Websocket error: ', event);
      this.message_subject.error(event);
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
    return this.message_subject.asObservable();
  }

  close()
  {
    if (this.socket)
        this.socket.close();
  }


  // private user
  privateConnect(sender: string, receiver: string)
  {
    // if (this.private_socket) 
    //   this.private_socket.close();
    // this.private_socket = new WebSocket(`ws://localhost:8000/ws/private_chat/${sender}/${receiver}/`);
    const private_socket = this.connectionAll(`wss://${environment.Backend_IP}:6010/ws/private_chat/${sender}/${receiver}/`);
    private_socket.onopen = () =>
    {
      console.log('Websocket connected');
      this.messageRead(sender, receiver);
    };
    private_socket.onmessage = (event) => 
    {
      const message = JSON.parse(event.data.toString());
      console.log('Message received: ', event.data);
      this.message_subject.next(message);
    };
    private_socket.onclose = () =>
    {
      console.log('Websocket disconnected');
    };
    private_socket.onerror = (event) =>
    {
      console.log('Websocket error: ', event);
    };
  }

  privateSendMessage(message: string)
  {
    if (this.socket && this.socket.readyState === WebSocket.OPEN)
        this.socket.send(JSON.stringify({ message }));
    else
      console.log('Websocket is not connected');
  }

  privateGetMessage() : Observable<any>
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

  getChatMessages(sender: string, receiver: string): Observable<any>
  {
    return this.http.get(`https://${environment.Backend_IP}:6010/api/v1/get_messages/?sender=${sender}&receiver=${receiver}`);
  }

  messageRead(receiver:string, sender:string,) : Observable<any>
  {
    return this.http.put(`https://${environment.Backend_IP}:6010/api/v1/mark_message_as_read/`, { receiver, sender });
  }

  getUnreadMessageCounts(currentUser: string): Observable<any> {
    return this.http.get(`https://${environment.Backend_IP}:6010/api/v1/get_unread_message_counts/?current_user=${currentUser}`);
  }
  
  privateClose()
  {
    if (this.socket)
        this.socket.close();
  }

    // online status
    connectOnlineStatus(username: string)
    {
      const socket = this.connectionAll(`wss://${environment.Backend_IP}:6010/ws/online_status/`);
      socket.onopen = () =>
      {
        console.log('Websocket connected');
        this.socket?.send(JSON.stringify({ type: 'online', username: username }));
      };
      socket.onmessage = (event) => 
      {
        const message = JSON.parse(event.data.toString());
        if (message.type === 'online_users')
        {
          console.log('Online users....', message.online_users);
          this.onlineUsers.next(message.online_users);
          // this.message_subject.next(message.online_users);
        }
        // console.log('Message received: ', event.data);
      };
      socket.onerror = (event) =>
      {
        console.log('Websocket error: ', event);
      }

    }

    getOnlineStatus(): Observable<string[]>
    {
      return this.onlineUsers.asObservable();
    }

    disconnectOnlineStatus(username: string)
    {
      if (this.socket && this.socket.readyState === WebSocket.OPEN)
      {
        this.socket.send(JSON.stringify({ type: 'offline', username: username }));
        this.socket.close();
      }
    }

//     private game_state_subject = new Subject<any>(); //move to upper level
//     // Game Socket Method
//     connectGameSocket(roomName: string)
//     {
//       this.socket = new WebSocket(`ws://localhost:8000/ws/game/${roomName}/`);
//       this.socket.onopen = () =>
//       {
//         console.log('Websocket connected');
//       };
//       this.socket.onmessage = (event) => 
//       {
//         const message = JSON.parse(event.data.toString());
//         // console.log('Message received: ', event.data);
//         this.game_state_subject.next(message);
//       };
//       this.socket.onclose = () =>
//       {
//         console.log('Websocket disconnected');
//         setTimeout(() => this.connectGameSocket(roomName), 5000);
//       }
//       this.socket.onerror = (event) =>
//       {
//         console.log('Websocket error: ', event);
//       }
//     }


//     sendGameState(gameState: any)
//     {
//       if (this.socket && this.socket.readyState === WebSocket.OPEN)
//       {

//           this.socket.send(JSON.stringify({
//             type: 'game_state_update',
//             game_state: {
//               ...gameState,
//               timestamp: performance.now(),
//             }
//           }));
//       }
//       else
//         console.log('Websocket is not connected');
//     }

//     sendGameStatusUpdate(gameStatus: string) {
//       if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//         this.socket.send(JSON.stringify({
//           type: 'game_status_update',
//           gameStatus: gameStatus,
//           timestamp: performance.now(),
//         }));
//       } else {
//         console.log('Websocket is not connected');
//       }
//     }

//     sendGameStart(roomName: string)
//     {
//       if (this.socket && this.socket.readyState === WebSocket.OPEN)
//       {
//         this.socket.send(JSON.stringify({
//           type: 'game_start',
//           room_name: roomName,
//           timestamp: performance.now(),
//         }));
//       }
//       else
//         console.log('Websocket is not connected');
    
//     }

//     getGameState(): Observable<any>
//     {
//       return this.game_state_subject.asObservable();
//     }

//     closeGameSocket()
//     {
//       if (this.socket)
//           this.socket.close();
//     }
    


}

