import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { catchError, switchMap, throwError, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth_service = inject(AuthService);

  const accessToken = auth_service.getAccessToken();
  let authReq = req;

  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error.code === 'token_not_valid') {
        if (!auth_service.isRefreshing) {
          console.log('Access token expired, attempting to refresh');
          return auth_service.refreshTokenRequest().pipe(
            switchMap(() => {
              const newAccessToken = auth_service.getAccessToken();
              if (newAccessToken) {
                console.log('New access token received');
                authReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newAccessToken}`
                  }
                });
                return next(authReq);
              } else {
                return throwError(() => new Error('No access token received'));
              }
            }),
            catchError(err => {
              console.error('Token refresh failed:', err);
              auth_service.logout();
              return throwError(() => err);
            })
          );
        } else {
          console.log('Already refreshing, waiting for new token');
          return auth_service.refreshTokenSubject.pipe(
            switchMap(token => {
              if (token) {
                authReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`
                  }
                });
                return next(authReq);
              } else {
                return throwError(() => new Error('Refresh token request failed'));
              }
            })
          );
        }
      } else {
        return throwError(() => error);
      }
    })
  );
};





/* 
return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      //auth_service.refreshTokenRequest()
      if (error.status === 401 && error.error.code === 'token_not_valid' && !auth_service.isrefreshing) 
      {
        console.log('Token expired, attempting to refresh...');
        // Token expired, attempt to refresh
        return auth_service.refreshTokenRequest().pipe(
          switchMap(() => {
            const newAccessToken = auth_service.getAccessToken();
            if (newAccessToken) {
              console.log('New access token received');
              authReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken}`
                }
              });
            }
            else
            {
              console.error('No access token received');
              auth_service.logout();
            }
            return next(authReq);
          }),
          catchError((err) => {
            console.error('Token refresh failed:', err);
            auth_service.logout();
            return throwError(() => err);
          })
        );
      }
      else
      {
        console.error('Error for if:', error);
      }
      return throwError(() => error);
    })
  );

*/