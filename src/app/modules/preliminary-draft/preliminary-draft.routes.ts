import { Routes } from '@angular/router';
import { PreliminaryDraftPageComponent } from './pages/preliminary-draft-page/preliminary-draft-page.component';

export const preliminaryDraftRoutes: Routes = [
  {
    path: '',
    component: PreliminaryDraftPageComponent,
    title: 'Anteproyectos de trabajo de grado',
    data: { breadcrumb: 'Anteproyectos'}
  }
]
