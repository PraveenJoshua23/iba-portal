import { Route } from '@angular/router';
import { LessonsComponent } from './pages/lessons/lessons.component';
import { PlyrModule } from 'ngx-plyr';

export const LESSON_ROUTE: Route[] = [
    {
      path: 'bb/:id',
      component: LessonsComponent
    }
];