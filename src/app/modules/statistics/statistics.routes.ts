import { Routes } from '@angular/router';
import { StatisticsPageComponent } from './pages/statistics-page/statistics-page.component';

export const statisticsRoutes: Routes = [
  {
    path: '',
    component: StatisticsPageComponent,
    title: 'Estadisticas',
    data: { breadcrumb: 'Estadisticas' }
  }
]
