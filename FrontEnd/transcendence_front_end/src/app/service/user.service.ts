import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, filter, finalize, map, of, switchMap, take, tap, throwError, timer } from 'rxjs';
import { User } from '../interface/user';
// import { JWTService } from './jwt.service';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';
import { IActivateAccount } from '../pages/activate-account/activate-account.interface';
import { IResetPassword } from '../pages/reset-password/reset-password.interface';
import { IChangeEmail } from '../pages/change-email/change-email.interface';
import { IChangePassword } from '../pages/change-password/change-password.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private jwt :any;
 
  constructor() {}

  auth_url = 'http://localhost:8000/api/v1/';
  

  getLoggedInUser(): User | null 
  {
    const token = this.auth.getAccessToken();
    if (!token)
      return null;
    try 
    {
      const decodeedToken : any = jwtDecode(token);
      return {
        id : decodeedToken.user_id,
        email : decodeedToken.email,
        is_superuser : decodeedToken.is_superuser,
        otp : decodeedToken.otp,
      } as User;
    }
    catch (error)
    {
      console.log('Error decoding token: ', error);
      return null;
    }
  }

  getSpecificUser(id: number) : Observable<any>
  {
    return this.http.get(this.auth_url + 'users/' + id + '/');
  }


  registerUser(user: User) : Observable<any>
  {
    return this.http.post(this.auth_url + 'users/' , user, /* {headers} */); //we dont need to use , {withCredentials: true} because of interceptor
  }

  activateAccount(payload: IActivateAccount) : Observable<any>
  {
    return this.http.post(
      this.auth_url + 'users/activate/',
      payload
    );
  }

  requestPasswordResetLink(payload: {email: string}) : Observable<any>
  {
    return this.http.post(
      this.auth_url + 'users/' + 'forgot-password/',
      payload
    );
  }

  resetPassword(payload: IResetPassword) : Observable<any>
  {
    return this.http.post(
      this.auth_url + 'users/' + 'reset-password/',
      payload
    );
  }

  changePassword(payload: IChangePassword) : Observable<any>
  {
    return this.http.post(
      this.auth_url + 'users/' + 'change-password/',
      payload
    );
  }

  requestChangeEmailLink(payload: {email: string}) : Observable<any>
  {
    return this.http.post(
      this.auth_url + 'users/' + 'change-email/get-token/',
      payload
    );
  }

  changeEmail(payload: IChangeEmail): Observable<any>
  {
    return this.http.post(
      this.auth_url + 'users/' + 'change-email/',
      payload
    );
  }

  getUserData() : Observable<any>
  {
    return this.http.get(this.auth_url + 'users/');
  }

  removeUser(id: number) : Observable<any> //not implemented in backend
  {
    return this.http.delete(this.auth_url + 'user/delete/' + id + '/');
  }

  updateUser(user: User) : Observable<any>
  {
    return this.http.put(this.auth_url + 'users/' + user.id + '/', user);
  }

  
  showProfile(id: number) : Observable<any>
  {
    return this.http.get(this.auth_url + 'profiles/' + id + '/');
  }

  getterProfile(): Observable<any> {
      this.jwt = jwtDecode(localStorage.getItem('access_token') || "");
      return this.showProfile(this.jwt.user_id).pipe(
        map((data: any) => {
          return data; // This value will be emitted to the subscribers
        })
      );
  }

  getterjwt() : Observable<any> {
    return of(this.jwt);
  }
  
  changeFA(status: boolean, id: number): Observable<any>
  {
    return this.http.patch(this.auth_url + `users/${id}/`, { is_2fa_enabled: status });
  }
    
  showListProfiles() : Observable<any>
  {
    return this.http.get(this.auth_url + 'profiles/');
  }

  //User realationships functions

  BlockUser(id: number) : Observable<any>
  {
    return this.http.patch(this.auth_url + `users/blocklist/add/?blocked_id=${id}`, {});
  }

  unBlockUser(id: number) : Observable<any>
  {
    return this.http.patch(this.auth_url + `users/blocklist/remove/?blocked_id=${id}`, {});
  }

  listBlockedUsers() : Observable<any>
  {
    return this.http.get(this.auth_url + 'users/blocklist/');
  }

  addFriend(id: number) : Observable<any>
  {
    return this.http.post(this.auth_url + `friends/request/?friend_id=${id}`, {friend_id : id});
  }

  declineFriend(id: number) : Observable<any>
  {
    return this.http.post(this.auth_url + `users/friends/decline/`, {friend_id : id});
  }

  acceptFriend(id: number) : Observable<any>
  {
    return this.http.post(this.auth_url + `users/friends/accept/`, {friend_id : id});
  }

  //http://localhost:8000/api/v1/friends/remove/?friend_id=2
  removeFriend(id: number) : Observable<any>
  {
    return this.http.delete(this.auth_url + `friends/remove/?friend_id=${id}`, {});
  }


  // user list with relationship status
  userListRelationships() : Observable<any>
  {
    return this.http.get(this.auth_url + 'profile/list/');
  }

  

}
