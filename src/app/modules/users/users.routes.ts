import { Routes } from '@angular/router';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { UserCreatePageComponent } from './pages/user-create-page/user-create-page.component';
import { UserEditPageComponent } from './pages/user-edit-page/user-edit-page.component';

export const usersRoutes: Routes = [
  {
    path:'',
    component: UsersPageComponent,
    title: 'Gestión de usuarios',
    data: { breadcrumb: 'Usuarios' }
  },
  {
    path:'crear',
    component: UserCreatePageComponent,
    title: 'Crear nuevo usuario',
    data: { breadcrumb: 'Crear'}
  },
  {
    path:'editar/:id',
    component: UserEditPageComponent,
    title: 'Editar usuario',
    data: { breadcrumb: 'Editar' }
  }
]
