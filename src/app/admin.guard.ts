import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const user = localStorage.getItem('email')

  if( !user) return false;

  if( user === 'praveenjoshua2394@gmail.com'){
    return true
  } else {
    router.navigate(['/login']);
    return false
  }
  
};
