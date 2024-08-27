import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './user.service';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const userGuard: CanActivateFn = (route, state) => {

  let JWT = inject(AuthService);
  let router = inject(Router);
  if (!JWT.isAuthenticated())
  {
    router.navigate(['/login']);
    // JWT.logout();
    return false;
  }
  return true;
};
