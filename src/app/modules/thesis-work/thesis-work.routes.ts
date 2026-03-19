import { Routes } from '@angular/router';
import { ThesisWorkPageComponent } from './pages/thesis-work-page/thesis-work-page.component';

export const thesisWorkRoutes: Routes = [
  {
    path: '',
    component: ThesisWorkPageComponent,
    title: 'Trabajos de grado',
    data: { breadcrumb: 'Trabajos de grado'}
  }
]
