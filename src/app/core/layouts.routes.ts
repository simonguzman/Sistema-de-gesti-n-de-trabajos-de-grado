import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { ProposalPageComponent } from './pages/proposal-page/proposal-page.component';
import { PreliminaryDraftPageComponent } from './pages/preliminary-draft-page/preliminary-draft-page.component';
import { ThesisWorkPageComponent } from './pages/thesis-work-page/thesis-work-page.component';
import { StatisticsPageComponent } from './pages/statistics-page/statistics-page.component';

export const layoutsRoutes: Routes = [
  {
    path:'',
    component: MainLayoutComponent,
    children: [
      {
        path:'notifications',
        component: NotificationsPageComponent,
      },
      {
        path:'users',
        component: UsersPageComponent,
      },
      {
        path:'proposal',
        component: ProposalPageComponent,
      },
      {
        path:'preliminary-draft',
        component: PreliminaryDraftPageComponent,
      },
      {
        path:'thesis-work',
        component: ThesisWorkPageComponent,
      },
      {
        path:'statistics',
        component: StatisticsPageComponent,
      },
      {
        path:'**',
        component: NotificationsPageComponent,
      },

    ],
  },

  {
    path:'**',
    redirectTo:'',
  },
];

export default layoutsRoutes;
