import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const user = localStorage.getItem('email')

  if( !user) return false;
  console.log(user)
  if( user === 'admin@hsztc.com'){
    return true
  } else {
    router.navigate(['/login']);
    return false
  }
  
};
