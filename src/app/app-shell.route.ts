import { Route } from '@angular/router';
import { HomeComponent } from 'src/app/pages/home/home.component';
import { LessonsComponent } from './pages/lessons/lessons.component';

export const APP_SHELL_ROUTE: Route[] = [
    {
      path: '',
      component: HomeComponent,
    },
];