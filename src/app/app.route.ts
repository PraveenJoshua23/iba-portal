import { Route } from '@angular/router';
import { AppShellComponent } from './components/app-shell/app-shell.component';
import { LoginComponent } from './pages/login/login.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { authGuard } from './auth.guard';
import { loggedInGuard } from './logged-in.guard';

export const APP_ROUTE: Route[] = [
    {
        path: 'home',
        component: AppShellComponent,
        canActivate: [authGuard],
        loadChildren: () => import('./app-shell.route').then((m) => m.APP_SHELL_ROUTE),
    },
    {
        path: 'profile',
        component: AppShellComponent,
        canActivate: [authGuard],
        loadChildren: () => import('./profile.route').then((m) => m.PROFILE_ROUTE),
    },
    {
        path: 'lesson',
        component: AppShellComponent,
        canActivate: [authGuard],
        loadChildren: () => import('./lessons.route').then((m) => m.LESSON_ROUTE),
    },
    {
        path: 'admin',
        component: AppShellComponent,
        canActivate: [authGuard],
        loadChildren: () => import('./admin.route').then((m) => m.ADMIN_ROUTE),
    },

    { path: 'login', component: LoginComponent, canActivate: [loggedInGuard] },
    { path: 'signup', component: SignUpComponent, canActivate: [loggedInGuard] },
    { path: '', redirectTo: '/home', pathMatch: 'full' }, // Redirect to home by default
    { path: '**', redirectTo: '/home' } // Redirect to home for unknown routes
];
