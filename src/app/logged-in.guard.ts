import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

export const loggedInGuard: CanActivateFn = (route, state) => {
  const auth = inject(AngularFireAuth);
  const router = inject(Router);
  
  return auth.authState.pipe(
    map(user => {
      if (user) {
        // User is already logged in, redirect to home
        router.navigate(['/home']);
        return false;
      } else {
        // User is not logged in, allow access to the route
        return true;
      }
    })
  );
};
