import { Routes } from '@angular/router';
import { ProposalPageComponent } from './pages/proposal-page/proposal-page.component';
import { ProposalCreatePageComponent } from './pages/proposal-create-page/proposal-create-page.component';

export const proposalRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Propuestas'},
    children: [
      {
        path: '',
        component: ProposalPageComponent,
        title: 'Propuestas de trabajo de grado',
        data: { breadcrumb: null }
      },
      {
        path: 'create',
        component: ProposalCreatePageComponent,
        title: 'Registrar propuesta de trabajo de grado',
        data: { breadcrumb: 'Crear propuesta' }
      }
    ]
  }
]
