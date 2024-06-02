import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserService } from '../service/user.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  let user_service = inject(UserService);
  const myToken = getJwtToken();

  if (myToken && user_service.isTokenExpired(myToken))
  {
      return user_service.refreshToken().pipe(
        switchMap(data => {
          user_service.storeJwtToken(data);
          var cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
          return next(cloned);
        }),
        catchError(err => {
          user_service.logout();
          console.error('Token refresh failed:', err);
          return throwError(() => new Error('Token refresh failed'));
        })
      );
  }
  if (myToken)
  {
    var cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${myToken}`,
      },
    });
    return next(cloned);
  }
  return next(req);
};

function getJwtToken(): string | null 
{
  return localStorage.getItem('access_token');
}

/* 
 if (myToken && user_service.isTokenExpired(myToken))
  {
    user_service.refreshToken().subscribe({
      next: data => {},
      error: err => {
        user_service.logout();
        console.error('Token refresh failed:', err);
      }
    });
  }
  if (myToken)
  {
    var cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${myToken}`,
      },
    });
    return next(cloned);
  }
*/