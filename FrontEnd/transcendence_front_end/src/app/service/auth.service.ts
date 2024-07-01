import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../interface/user';
import { BehaviorSubject, Observable, catchError, finalize, tap, throwError, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8000/api/v1/';
  private jwtHelper = new JwtHelperService();
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private refreshTimeout: any;
  isRefreshing = false;
  refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // TODO: extract the logix into a separate auth component that is loaded every time.
  // so we can call afunction of this class in the ngoninit of that auth compoenent
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    if (this.accessToken && !this.jwtHelper.isTokenExpired(this.accessToken)) {
      console.log('Access token is valid, setting up refresh timer');
      this.isAuthenticatedSubject.next(true);
      this.startRefreshTokenTimer();
    } else if (this.refreshToken) {
      console.log('Access token is expired, attempting to refresh');
      this.refreshTokenRequest().subscribe({
        next: () => {
          console.log('Successfully refreshed token on init');
        },
        error: () => {
          console.error('Failed to refresh token on init, logging out');
          this.logout();
        }
      });
    }
  }

  storeJWTToken(token: any): void {
    if (token.access) {
      console.log('Storing new access token');
      localStorage.setItem('access_token', token.access);
      this.accessToken = token.access;
      this.startRefreshTokenTimer();
    }
    if (token.refresh) {
      console.log('Storing new refresh token');
      localStorage.setItem('refresh_token', token.refresh);
      this.refreshToken = token.refresh;
    }
    this.isAuthenticatedSubject.next(true);
  }

  login(user: User): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'login/', user)
      .pipe(tap(response => {
        if (!response.fa_pending)
          this.storeJWTToken(response);
      }));
  }

  verifyOTP(user: User) : Observable<any>
  {
    return this.http.post<any>(this.apiUrl + 'verify-otp/', {email: user.email, otp: user.otp})
      .pipe(tap(response => {
        this.storeJWTToken(response);
      }));
  }

  logout(): void {
    try {
      console.log('Logging out...');
  
      // Clear tokens from local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
  
      this.accessToken = null;
      // Update authentication state
      this.isAuthenticatedSubject.next(false);
      // Navigate to login page
      this.router.navigate(['/login']).then(success => {
      console.log('Navigating to login...');
        if (success) {
          console.log('Successfully navigated to login');
        } else {
          console.error('Failed to navigate to login');
        }
      });
  
      // Clear any running refresh timeout
      clearTimeout(this.refreshTimeout);
      // this.router.navigate(['/design']);
    } catch (error) {
      console.error('Error while logging out:', error);
    }
  }
  

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
  }

  // isAuthenticated(): boolean {
  //   const token = this.accessToken || localStorage.getItem('access_token');
  //   return token ? !this.jwtHelper.isTokenExpired(token) : false;
  // }

  isAuthenticated(): boolean {
    const token = this.accessToken || localStorage.getItem('access_token');
    console.log('Token', token);
    if (token) {
      const isExpired = this.jwtHelper.isTokenExpired(token);
      console.log('Token expired:', isExpired);
      return !isExpired;
    }
    return false;
  }

  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem('access_token');
  }

  refreshTokenRequest(): Observable<any> {
    const refreshToken = this.refreshToken || localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token found'));
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        switchMap(token => {
          if (token) {
            return of(token);
          } else {
            return throwError(() => new Error('No refresh token found'));
          }
        })
      );
    } else {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      return this.http.post<any>(this.apiUrl + 'login/refresh/', { refresh: refreshToken })
        .pipe(
          tap(response => {
            this.accessToken = response.access;
            if (this.accessToken) {
              localStorage.setItem('access_token', this.accessToken);
              this.startRefreshTokenTimer();
              this.refreshTokenSubject.next(this.accessToken);
            }
          }),
          catchError(error => {
            if (error.status === 401 && error.error.code === 'refresh_token_not_valid') {
              console.error('Refresh token expired, logging out...');
              this.logout();
            }
            return throwError(() => error);
          }),
          finalize(() => {
            this.isRefreshing = false;
          })
        );
    }
  }

  private startRefreshTokenTimer() {
    console.log('Starting refresh token timer...');
    const token = this.getAccessToken();
    if (token) {
      const expiration = this.jwtHelper.decodeToken(token).exp;
      const now = Math.floor(Date.now() / 1000);
      const remainingTime = expiration - now;
      const bufferTime = 30; // Reduced buffer time to 30 seconds
      console.log(`Token will expire in ${remainingTime} seconds, setting refresh timer for ${remainingTime - bufferTime} seconds`);
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = setTimeout(() => {
        if (!this.isRefreshing) {
          console.log('Token expired, attempting to refresh...');
          this.refreshTokenRequest().subscribe();
        }
      }, (remainingTime - bufferTime) * 1000);
    }
  }
}
