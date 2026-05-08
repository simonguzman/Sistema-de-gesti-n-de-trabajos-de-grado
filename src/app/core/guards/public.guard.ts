import { inject } from '@angular/core';
import { CanActivateFn, Router, } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const publicGuard: CanActivateFn = ( route, state ) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if(authService.isAuthenticated()){
    router.navigate(['/notifications']);
    return false;
  }
  return true;
};
