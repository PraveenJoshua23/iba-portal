import { Route } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';


export const ADMIN_ROUTE: Route[] = [
    {
      path: '',
      component: AdminComponent
    }
];