import { Routes } from '@angular/router';
import { UsersPageComponent } from './pages/users-page/users-page.component';

export const usersRoutes: Routes = [
  {
    path:'',
    component: UsersPageComponent,
    title: 'Gestión de usuarios',
    data: { breadcrumb: 'Usuarios' }
  },
]
