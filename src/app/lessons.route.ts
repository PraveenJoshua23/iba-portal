import { Route } from '@angular/router';
import { LessonsComponent } from './pages/lessons/lessons.component';

export const LESSON_ROUTE: Route[] = [
    {
      path: 'bb/:id',
      component: LessonsComponent
    }
];