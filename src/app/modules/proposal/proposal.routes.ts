import { Routes } from '@angular/router';
import { ProposalPageComponent } from './pages/proposal-page/proposal-page.component';
import { ProposalCreatePageComponent } from './pages/proposal-create-page/proposal-create-page.component';
import { ProposalEditPageComponent } from './pages/proposal-edit-page/proposal-edit-page.component';
import { ProposalDetailsPageComponent } from './pages/proposal-details-page/proposal-details-page.component';
import { DownloadableFormatsPageComponent } from './pages/downloadable-formats-page/downloadable-formats-page.component';
import { LoadedProposalsPageComponent } from './pages/loaded-proposals-page/loaded-proposals-page.component';
import { EvaluationsPerformedPageComponent } from './pages/evaluations-performed-page/evaluations-performed-page.component';
import { EvaluationProposalPageComponent } from './pages/evaluation-proposal-page/evaluation-proposal-page.component';

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
        data: { breadcrumb: 'Información de la propuesta' },
        children:[
          {
            path: '',
            component: ProposalDetailsPageComponent,
            title: 'Información de la propuesta',
            data: { breadcrumb: null },
          },
          {
            path: 'evaluations_performed',
            component: EvaluationsPerformedPageComponent,
            title: 'Evaluaciones realizadas',
            data: { breadcrumb: 'Evaluaciones realizadas' }
          },
          {
            path: 'loaded_proposals',
            data: { breadcrumb: 'Propuestas cargadas' },
            children: [
              {
                path: '',
                component: LoadedProposalsPageComponent,
                title: 'Propuestas cargadas',
                data: { breadcrumb: null }
              },
              {
                path: 'evaluate_proposal',
                component: EvaluationProposalPageComponent,
                title: 'Evaluar propuesta',
                data: { breadcrumb: 'Evaluar propuesta' }
              }
            ]
          },
        ]
      }
    ]
  }
]
