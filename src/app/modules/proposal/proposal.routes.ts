import { Routes } from '@angular/router';
import { ProposalPageComponent } from './pages/proposal-page/proposal-page.component';
import { ProposalCreatePageComponent } from './pages/proposal-create-page/proposal-create-page.component';
import { ProposalEditPageComponent } from './pages/proposal-edit-page/proposal-edit-page.component';
import { ProposalDetailsPageComponent } from './pages/proposal-details-page/proposal-details-page.component';
import { DownloadableFormatsPageComponent } from './pages/downloadable-formats-page/downloadable-formats-page.component';

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
        path: 'downloadable_formats',
        component: DownloadableFormatsPageComponent,
        title: 'Formatos descargables',
        data: { breadcrumb: 'Formatos descargables' }
      },
      {
        path: 'create',
        component: ProposalCreatePageComponent,
        title: 'Registrar propuesta de trabajo de grado',
        data: { breadcrumb: 'Crear propuesta' }
      },
      {
        path: 'edit/:id',
        component: ProposalEditPageComponent,
        title: 'Editar propuesta de trabajo de grado',
        data: { breadcrumb: 'Actualizar propuesta' }
      },
      {
        path: 'details/:id',
        component: ProposalDetailsPageComponent,
        title: 'Información de la propuesta',
        data: { breadcrumb: 'Información de la propuesta' }
      }
    ]
  }
]
