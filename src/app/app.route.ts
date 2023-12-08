import { Route } from "@angular/router";
import { AppShellComponent } from "./components/app-shell/app-shell.component";
import { LoginComponent } from "./pages/login/login.component";
import { SignUpComponent } from "./pages/sign-up/sign-up.component";
import { authGuard } from "./auth.guard";
import { LandingComponent } from "./pages/landing/landing.component";


export const APP_ROUTE: Route[] = [
    {
        path: 'home',
        component: AppShellComponent,
        canActivate: [authGuard],
        loadChildren: () => import('./app-shell.route').then((m)=>m.APP_SHELL_ROUTE)
    },
    {
        path: 'lesson',
        component: AppShellComponent,
        canActivate: [authGuard],
        loadChildren: () => import('./lessons.route').then((m)=>m.LESSON_ROUTE)
    },

    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent},
    { path: '', component: LandingComponent},
    // { path: '', redirectTo: '/landing', pathMatch: 'full' }, // Redirect to login by default
    { path: '**', redirectTo: '/landing' } // Redirect to login for unknown routes
];