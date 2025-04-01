import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Retrieve user email from localStorage
    const userEmail = localStorage.getItem('email');

    // Check if user is logged in and is the admin
    if (userEmail && userEmail === 'joshua23@gmail.com') {
        return true; // Allow access to the route
    } else {
        // Redirect to login if not authorized
        router.navigate(['/login']);
        return false; // Prevent access to the route
    }
};
