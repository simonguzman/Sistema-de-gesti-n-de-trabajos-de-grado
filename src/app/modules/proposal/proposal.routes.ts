import { Routes } from '@angular/router';
import { ProposalPageComponent } from './pages/proposal-page/proposal-page.component';

export const proposalRoutes: Routes = [
  {
    path: '',
    component: ProposalPageComponent,
    title: 'Propuestas de trabajo de grado',
    data: { breadcrumb: 'Propuestas'}
  },
]
