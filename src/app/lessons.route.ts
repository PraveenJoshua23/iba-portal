import { Route } from '@angular/router';
import { LessonsComponent } from './pages/lessons/lessons.component';
import { LessonResolver } from './shared/resolvers/lesson.resolver';

export const LESSON_ROUTE: Route[] = [
    {
        path: ':category/:id',
        component: LessonsComponent,
        resolve: {
            lessonData: LessonResolver,
        },
    },
];
