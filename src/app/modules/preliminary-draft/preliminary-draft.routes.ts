import { Routes } from '@angular/router';
import { PreliminaryDraftPageComponent } from './pages/preliminary-draft-page/preliminary-draft-page.component';
import { DownloadableFormatsPageComponent } from '../../shared/pages/downloadable-formats-page/downloadable-formats-page.component';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRoleType } from '../../core/models/user-role';
import { PreliminaryDraftCreatePageComponent } from './pages/preliminary-draft-create-page/preliminary-draft-create-page.component';
import { PreliminaryDraftDetailsPageComponent } from './pages/preliminary-draft-details-page/preliminary-draft-details-page.component';
import { PreliminaryDraftEditPageComponent } from './pages/preliminary-draft-edit-page/preliminary-draft-edit-page.component';

export const preliminaryDraftRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Anteproyectos'},
    children: [
      {
        path: '',
        component: PreliminaryDraftPageComponent,
        title: 'Anteproyectos de trabajo de grado',
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
        component: PreliminaryDraftCreatePageComponent,
        canActivate: [roleGuard],
        title: 'Registrar anteproyecto',
        data: {
          breadcrumb: 'Registrar anteproyecto',
          roles: [UserRoleType.ADMINISTRADOR, UserRoleType.DIRECTOR]
        }
      },
      {
        path: 'edit/:id',
        component: PreliminaryDraftEditPageComponent,
        canActivate: [roleGuard],
        title: 'Editar anteproyecto de trabajo de grado',
        data: {
          breadcrumb: 'Actualizar propuesta',
          roles: [UserRoleType.ADMINISTRADOR, UserRoleType.DIRECTOR]
        }
      },
      {
        path: 'details/:id',
        data: { breadcrumb: 'Información del anteoryecto' },
        children:[
          {
            path: '',
            component: PreliminaryDraftDetailsPageComponent,
            canActivate: [roleGuard],
            title: 'Información del anteproyecto',
            data: {
              breadcrumb: null,
              roles: [
                UserRoleType.ADMINISTRADOR,
                UserRoleType.DIRECTOR,
                UserRoleType.CODIRECTOR,
                UserRoleType.ASESOR,
                UserRoleType.ESTUDIANTE,
                UserRoleType.JEFE_DEP,
                UserRoleType.EVALUADOR,
                UserRoleType.CONSEJO
              ]
            },
          },
        ]
      },
    ]
  }
]
