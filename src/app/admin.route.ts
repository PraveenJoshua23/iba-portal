import { Route } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { EditAllUserComponent } from './pages/edit-user/edit-all-user.component';
import { adminGuard } from './admin.guard';


export const ADMIN_ROUTE: Route[] = [
    {
      path: '',
      component: AdminComponent,
      canActivate:[adminGuard]
    },
];