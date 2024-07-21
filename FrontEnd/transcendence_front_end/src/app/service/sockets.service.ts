import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscriber, timestamp } from 'rxjs';
import player from '../local-match-component/game/entitiy/player';



@Injectable({
  providedIn: 'root'
})
export class SocketsService {

  // private private_socket: WebsocketSubject<any>
  private socket: WebSocket | null = null;
  private private_socket: WebSocket | null = null;
  private message_subject = new Subject<any>();
  private http = inject(HttpClient);
  private onlineUsers = new BehaviorSubject<string[]>([]);

  connect(roomName: string, user: string) 
  {
    //Establish connection to the Websocket server
    this.socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);

    // const message = 
    // {
    //   'message' : '',
    //   'username' : user,
    // };
    this.socket.onopen = () =>
    {
      console.log('Websocket connected');
      this.sendMessage({message: '', username: user});
    };
    this.socket.onmessage = (event) => 
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
      // if (typeof message === 'object' && this.socket && this.socket.readyState === WebSocket.OPEN) {
      //   const messageString = JSON.stringify(message);
      //   console.log('stringify JSON : ', messageString);
      //   this.socket.send(messageString);
      // } else {
      //   console.error('Invalid message format or WebSocket not open');
      // }
    };
    this.socket.onclose = () =>
    {
      console.log('Websocket disconnected');
      this.sendMessage({ username: 'System', message: `${user} has left the chat` });
    };
    this.socket.onerror = (event) =>
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
    // return new Observable(observer => {
    //   if (this.socket)
    //   {
    //     this.socket.onmessage = (event) => {
    //       const message = JSON.parse(event.data.toString());
    //       observer.next(message);
    //     };
    //     this.socket.onerror = (error) => {
    //       observer.error(error);
    //     };
    //     this.socket.onclose = () => {
    //       observer.complete();
    //     };
    //   }
    //   else
    //     observer.error('WebSocket connection is not established.');
    // })
  }

  close()
  {
    if (this.socket)
        this.socket.close();
  }


  // private user
  privateConnect(sender: string, receiver: string)
  {
    if (this.private_socket) 
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

    // online status
    connectOnlineStatus(username: string)
    {
      this.socket = new WebSocket(`ws://localhost:8000/ws/online_status/`);
      this.socket.onopen = () =>
      {
        console.log('Websocket connected');
        this.socket?.send(JSON.stringify({ type: 'online', username: username }));
      };
      this.socket.onmessage = (event) => 
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
      this.socket.onerror = (event) =>
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

    private game_state_subject = new Subject<any>(); //move to upper level
    // Game Socket Method
    connectGameSocket(roomName: string)
    {
      this.socket = new WebSocket(`ws://localhost:8000/ws/game/${roomName}/`);
      this.socket.onopen = () =>
      {
        console.log('Websocket connected');
      };
      this.socket.onmessage = (event) => 
      {
        const message = JSON.parse(event.data.toString());
        // console.log('Message received: ', event.data);
        this.game_state_subject.next(message);
      };
      this.socket.onclose = () =>
      {
        console.log('Websocket disconnected');
        setTimeout(() => this.connectGameSocket(roomName), 5000);
      }
      this.socket.onerror = (event) =>
      {
        console.log('Websocket error: ', event);
      }
    }


    sendGameState(gameState: any)
    {
      if (this.socket && this.socket.readyState === WebSocket.OPEN)
      {

          this.socket.send(JSON.stringify({
            type: 'game_state_update',
            game_state: {
              ...gameState,
              timestamp: performance.now(),
            }
          }));
      }
      else
        console.log('Websocket is not connected');
    }

    sendGameStatusUpdate(gameStatus: string) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'game_status_update',
          gameStatus: gameStatus,
          timestamp: performance.now(),
        }));
      } else {
        console.log('Websocket is not connected');
      }
    }

    sendGameStart(roomName: string)
    {
      if (this.socket && this.socket.readyState === WebSocket.OPEN)
      {
        this.socket.send(JSON.stringify({
          type: 'game_start',
          room_name: roomName,
          timestamp: performance.now(),
        }));
      }
      else
        console.log('Websocket is not connected');
    
    }

    getGameState(): Observable<any>
    {
      return this.game_state_subject.asObservable();
    }

    closeGameSocket()
    {
      if (this.socket)
          this.socket.close();
    }
    


}

