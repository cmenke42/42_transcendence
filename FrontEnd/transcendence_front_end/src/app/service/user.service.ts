import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, filter, finalize, switchMap, take, tap, throwError, timer } from 'rxjs';
import { User } from '../interface/user';
// import { JWTService } from './jwt.service';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  private http = inject(HttpClient);
  // private JWT = inject(JWTService);
  private auth = inject(AuthService);
 
  constructor() {}

  auth_url = 'http://localhost:8000/api/v1/';
  
  // login(user: User): Observable<any>
  // {
  //   return this.http.post(this.auth_url + 'login/', user).pipe(
  //     tap((response: any)  => {
  //       // this.saveUserDetails(tokens.user);
  //       console.log('User details saved: ', response.user);
  //       if (!response.fa_pending)
  //        this.JWT.saveStoredToken(response);
  //     })
  //   )
  // }

  // verifyOTP(user: User): Observable<any>
  // {
  //   return this.http.post(this.auth_url + 'verify-otp/', {email: user.email,otp: user.otp}).pipe
  //   (tap((response: any) => {
  //     this.JWT.saveStoredToken(response);
  //   }  
  //   ));
  // }

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
    return this.http.get(this.auth_url + 'user/' + id + '/');
  }


  registerUser(user: User) : Observable<any>
  {
    return this.http.post(this.auth_url + 'signup/' , user); //we dont need to use , {withCredentials: true} because of interceptor
  }

  getUserData() : Observable<any>
  {
    return this.http.get(this.auth_url + 'user/');
  }

  removeUser(id: number) : Observable<any> //not implemented in backend
  {
    return this.http.delete(this.auth_url + 'user/delete/' + id + '/');
  }

  updateUser(user: User) : Observable<any>
  {
    return this.http.put(this.auth_url + 'user/' + user.id + '/', user);
  }

  showProfile(id: number) : Observable<any>
  {
    return this.http.get(this.auth_url + 'user/' + id + '/profile/');
  }
}
