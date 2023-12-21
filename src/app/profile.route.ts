import { Route } from '@angular/router';
import { ProfileComponent } from './components/profile/profile.component';

export const PROFILE_ROUTE: Route[] = [
    {
      path: '',
      component: ProfileComponent
    },
];