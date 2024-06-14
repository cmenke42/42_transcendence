import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
  let service = inject(AuthService);
  let router = inject(Router);
  if (service.isAuthenticated())
  {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
