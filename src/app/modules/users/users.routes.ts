import { Routes } from '@angular/router';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { UserCreatePageComponent } from './pages/user-create-page/user-create-page.component';
import { UserEditPageComponent } from './pages/user-edit-page/user-edit-page.component';
import { UserDetailsPageComponent } from './pages/user-details-page/user-details-page.component';

export const usersRoutes: Routes = [
  {
    path:'profile',
    component: UserDetailsPageComponent,
    title: 'Mi perfil',
    data: { breadcrumb: 'Perfil'}
  },
  {
    path: '',
    data: { breadcrumb: 'Usuarios' },
    children: [
      {
        path:'',
        component: UsersPageComponent,
        title: 'Gestión de usuarios',
        data: { breadcrumb: null }
      },
      {
        path:'create',
        component: UserCreatePageComponent,
        title: 'Crear nuevo usuario',
        data: { breadcrumb: 'Crear usuario'}
      },
      {
        path:'edit/:id',
        component: UserEditPageComponent,
        title: 'Editar usuario',
        data: { breadcrumb: 'Editar usuario' }
      },
      {
        path:'details/:id',
        component: UserDetailsPageComponent,
        title: 'Información del usuario',
        data: { breadcrumb: 'Información del usuario'}
      }
    ]
  },
]
