import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, switchMap, tap, throwError, timer } from 'rxjs';
import { User } from '../user';
import { jwtDecode } from 'jwt-decode';
import { UserData } from '../interface/user-data';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  private http = inject(HttpClient);
 
  constructor() { }

  auth_url = 'http://localhost:8000/api/v1/';
  private readonly ACCESS_TOKEN = 'access_token';
  private readonly REFRESH_TOKEN = 'refresh_token';
  private loggedUser?: string;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenRefreshedSubject = new Subject<void>();


  login(user: UserData): Observable<any>
  {
    return this.http.post(this.auth_url + 'login/', user).pipe(
      tap((response: any)  => {
        // this.saveUserDetails(tokens.user);
        const decodedToken = this.decodeToken(response.access);
        // console.log('data: ', user.is_superuser);
        this.saveUserDetails(decodedToken);
        this.doLoginUser(user.email, response);
      })
      // tap(tokens  => this.doLoginUser(user.email, tokens))
    )
  }

  getLoggedInUser(): UserData | null 
  {
    const user = localStorage.getItem('user');
    if (user) 
      return JSON.parse(user);
    return null;
  }

  getSpecificUser(id: number) : Observable<any>
  {
    return this.http.get(this.auth_url + 'user/' + id + '/');
  }

  private decodeToken(token: string): User 
  {
    return jwtDecode(token);
  }

  private saveUserDetails(user: User)
  {
    localStorage.setItem('user', JSON.stringify(user));
  }


  // private saveUserDetails(user: UserData)
  // {
  //   localStorage.setItem('user', JSON.stringify(user));
  // }

  private doLoginUser(email: string, token: any)
  {
    this.loggedUser = email;
    this.storeJwtToken(token);
    this.isAuthenticatedSubject.next(true);
  }

  storeJwtToken(tokens: any)
  {
    localStorage.setItem(this.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(this.REFRESH_TOKEN, tokens.refresh);
    // localStorage.setItem(this.ACC)
    // localStorage.setItem(this.JWT_TOKEN, jwt);
  }

  logout() 
  {
    // localStorage.removeItem(this.JWT_TOKEN);
    localStorage.removeItem(this.ACCESS_TOKEN);
    // localStorage.removeItem(this.REFRESH_TOKEN);
    this.isAuthenticatedSubject.next(false);
  }

  isLoggedIn()
  {
    return !!localStorage.getItem(this.ACCESS_TOKEN);
  }

  isTokenExpired(tokenString: string): boolean {
    if (!tokenString) return true;

    const decoded: any = jwtDecode(tokenString);
    if (!decoded.exp) return true;

    const expirationDate = decoded.exp * 1000;
    const now = new Date().getTime();
    return expirationDate < now;
  }

  get tokenRefreshed()
  {
    return this.tokenRefreshedSubject.asObservable();
  }

  refreshToken(): Observable<any> {
    const refreshTokenString = localStorage.getItem(this.REFRESH_TOKEN);
    if (!refreshTokenString) return EMPTY;

    // const refreshToken = JSON.parse(refreshTokenString);
    return this.http.post(this.auth_url + 'login/refresh/', { refresh: refreshTokenString })
      .pipe(
        tap(tokens =>  
          {
            // console.log('refresh token: ', tokens);
            this.storeJwtToken(tokens);
            this.tokenRefreshedSubject.next(); // Emit the token refreshed event
          }),
        catchError(err => {
          console.error('Token refresh failed:', err);
          this.logout();
          return throwError(() => new Error(err));
        })
        );
  }

  scheduleTokenRefresh() {
    const tokenString = localStorage.getItem(this.ACCESS_TOKEN);
    if (!tokenString) return;

    const decoded: any = jwtDecode(tokenString);
    if (!decoded.exp) return;

    const expirationDate = decoded.exp * 1000;
    const now = new Date().getTime();
    //refresh time 5 seconds before token expires
    // const timeToRefresh = expirationDate - now - 5000;
    const timeToRefresh = expirationDate - now - 300000; // Refresh 5 minutes before expiration

    if (timeToRefresh > 0) {
      timer(timeToRefresh).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe();
    }
  }

  registerUser(user: User) : Observable<any>
  {
    return this.http.post(this.auth_url + 'signup/' , user); //we dont need to use , {withCredentials: true} because of interceptor
  }

  getUserData() : Observable<any>
  {
    return this.http.get(this.auth_url + 'user/');
  }

  removeUser(id: number) : Observable<any>
  {
    return this.http.delete(this.auth_url + 'user/' + id + '/');
  }

  
}
