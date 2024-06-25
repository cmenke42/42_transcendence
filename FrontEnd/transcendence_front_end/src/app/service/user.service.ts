import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, filter, finalize, map, switchMap, take, tap, throwError, timer } from 'rxjs';
import { User } from '../interface/user';
// import { JWTService } from './jwt.service';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private id :any;
 
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
      this.id = jwtDecode(localStorage.getItem('access_token') || "");
      return this.showProfile(this.id.user_id).pipe(
        map((data: any) => {
          return data; // This value will be emitted to the subscribers
        })
      );
  }
    
  showListProfiles() : Observable<any>
  {
    return this.http.get(this.auth_url + 'profiles/');
  }
}
