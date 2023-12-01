import { Route } from '@angular/router';
import { HomeComponent } from 'src/app/pages/home/home.component';

export const APP_SHELL_ROUTE: Route[] = [
    {
      path: '',
      component: HomeComponent,
    },
];