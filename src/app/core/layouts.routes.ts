import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/MainLayout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/AuthLayout/auth-layout/auth-layout.component';

export const layoutsRoutes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('../modules/auth/auth.routes')
      .then(m => m.authRoutes)
  },
  {
    path:'',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'notifications',  // ← ruta por defecto
        pathMatch: 'full'
      },
      {
        path:'notifications',
        loadChildren: () => import('../modules/notifications/notifications.routes')
          .then(m => m.notificationsRoutes)
      },
      {
        path:'users',
        loadChildren: () => import('../modules/users/users.routes')
          .then(m => m.usersRoutes),
      },
      {
        path:'proposal',
        loadChildren: () => import('../modules/proposal/proposal.routes')
          .then(m => m.proposalRoutes)
      },
      {
        path:'preliminary-draft',
        loadChildren: () => import('../modules/preliminary-draft/preliminary-draft.routes')
          .then(m => m.preliminaryDraftRoutes)
      },
      {
        path:'thesis-work',
        loadChildren: () => import('../modules/thesis-work/thesis-work.routes')
          .then(m => m.thesisWorkRoutes)
      },
      {
        path:'statistics',
        loadChildren: () => import('../modules/statistics/statistics.routes')
          .then(m => m.statisticsRoutes)
      },
    ],
  },

  {
    path:'**',
    redirectTo:'auth/login',
  },
];

export default layoutsRoutes;
