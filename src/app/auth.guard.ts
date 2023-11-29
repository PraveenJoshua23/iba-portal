import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AngularFireAuth);
  const router = inject(Router)
  return auth.authState.pipe(
    map(user => {
      if (user) {
        return true;
      } else {
        // Redirect to the login page if not authenticated
        router.navigate(['/login'])
        return false;
      }
    }) 
  )
};
