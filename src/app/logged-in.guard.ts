import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

export const loggedInGuard: CanActivateFn = (route, state) => {
    const auth = inject(AngularFireAuth);
    const router = inject(Router);

    return auth.authState.pipe(
        map((user) => {
            const isCompleteProfileSignup = route.routeConfig?.path === 'signup' && route.queryParamMap.get('mode') === 'complete-profile';

            if (user && !isCompleteProfileSignup) {
                // User is already logged in and not in complete-profile signup, redirect to home
                router.navigate(['/home']);
                return false;
            } else {
                // Either user is not logged in, or they are completing profile on signup
                return true;
            }
        }),
    );
};
