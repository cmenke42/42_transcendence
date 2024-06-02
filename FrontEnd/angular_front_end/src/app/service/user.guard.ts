import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './user.service';
import { inject } from '@angular/core';

export const userGuard: CanActivateFn = (route, state) => {

  let authService = inject(UserService);
  let router = inject(Router);
  if (!authService.isLoggedIn())
  {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
