import { Route } from "@angular/router";
import { AppShellComponent } from "./components/app-shell/app-shell.component";
import { LoginComponent } from "./pages/login/login.component";
import { SignUpComponent } from "./pages/sign-up/sign-up.component";


export const APP_ROUTE: Route[] = [
    {
        path: 'home',
        component: AppShellComponent,
        loadChildren: () => import('./app-shell.route').then((m)=>m.APP_SHELL_ROUTE)
    },
    {
        path: 'lesson',
        component: AppShellComponent,
        loadChildren: () => import('./lessons.route').then((m)=>m.LESSON_ROUTE)
    },

    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent},
];