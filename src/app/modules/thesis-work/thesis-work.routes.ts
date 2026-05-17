import { Routes } from '@angular/router';
import { ThesisWorkPageComponent } from './pages/thesis-work-page/thesis-work-page.component';
import { ThesisWorkDetailsPageComponent } from './pages/thesis-work-details-page/thesis-work-details-page.component';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRoleType } from '../../core/models/user-role';
import { EvaluationsPerformedPageComponent } from '../../shared/pages/evaluations-performed-page/evaluations-performed-page.component';
import { LoadedDocumentsThesisWorkPageComponent } from './pages/loaded-documents-thesis-work-page/loaded-documents-thesis-work-page.component';
import { UploadAdvancePageComponent } from './pages/upload-advance-page/upload-advance-page.component';
import { EvaluateAdvancePageComponent } from './pages/evaluate-advance-page/evaluate-advance-page.component';
import { UploadFinalDeliveryPageComponent } from './pages/upload-final-delivery-page/upload-final-delivery-page.component';
import { RegisterPazYSalvoPageComponent } from './pages/register-paz-y-salvo-page/register-paz-y-salvo-page.component';
import { RegisterSustentationPageComponent } from './pages/register-sustentation-page/register-sustentation-page.component';


export const thesisWorkRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Trabajos de grado'},
    children:[
      {
        path: '',
        component: ThesisWorkPageComponent,
        title: 'Trabajos de grado',
        data: { breadcrumb: null},
      },
      {
        path: 'details/:id',
        data: { breadcrumb: 'Información del trabajo de grado' },
        children:[
          {
            path: '',
            component: ThesisWorkDetailsPageComponent,
            canActivate: [roleGuard],
            title: 'Información del trabajo de grado',
            data: {
              breadcrumb: null,
              roles: [
                UserRoleType.ADMINISTRADOR,
                UserRoleType.DIRECTOR,
                UserRoleType.CODIRECTOR,
                UserRoleType.ASESOR,
                UserRoleType.ESTUDIANTE,
                UserRoleType.DECANATURA,
                UserRoleType.CONSEJO,
                UserRoleType.JURADO
              ]
            }
          },
          {
            path: 'evaluations_performed',
            component: EvaluationsPerformedPageComponent,
            canActivate: [roleGuard],
            title: 'Evaluaciones realizadas',
            data: {
              breadcrumb: 'Evaluaciones realizadas',
              roles: [
                UserRoleType.ADMINISTRADOR,
                UserRoleType.DIRECTOR,
                UserRoleType.CODIRECTOR,
                UserRoleType.ASESOR,
                UserRoleType.ESTUDIANTE,
                UserRoleType.DECANATURA,
                UserRoleType.CONSEJO,
                UserRoleType.JURADO
              ]
            }
          },
          {
            path: 'loaded_documents',
            data: { breadcrumb: 'Documentos cargados' },
            children: [
              {
                path: '',
                component: LoadedDocumentsThesisWorkPageComponent,
                canActivate: [roleGuard],
                title: 'Documentos cargados',
                data: {
                  breadcrumb: null,
                  roles: [
                    UserRoleType.ADMINISTRADOR,
                    UserRoleType.DIRECTOR,
                    UserRoleType.CODIRECTOR,
                    UserRoleType.ASESOR,
                    UserRoleType.ESTUDIANTE,
                    UserRoleType.DECANATURA,
                    UserRoleType.CONSEJO,
                    UserRoleType.JURADO
                  ]
                }
              },
              {
                path: 'upload_advance',
                component: UploadAdvancePageComponent,
                canActivate: [roleGuard],
                title: 'Cargar avances',
                data: {
                  breadcrumb: 'Cargar avances',
                  roles: [
                    UserRoleType.ADMINISTRADOR,
                    UserRoleType.ESTUDIANTE,
                  ]
                }
              },
              {
                path: 'evaluate_advance/:advanceId',
                component: EvaluateAdvancePageComponent,
                canActivate: [roleGuard],
                title: 'Evaluar avances',
                data: {
                  breadcrumb: 'Evaluar avances',
                  roles: [UserRoleType.ADMINISTRADOR, UserRoleType.DIRECTOR, UserRoleType.CODIRECTOR, UserRoleType.ASESOR]
                }
              },
              {
                path: 'upload_final_delivery',
                component: UploadFinalDeliveryPageComponent,
                canActivate: [roleGuard],
                title: 'Registrar entrega final',
                data: {
                  breadcrumb: 'Registrar entrega final',
                  roles: [UserRoleType.ADMINISTRADOR, UserRoleType.DIRECTOR]
                }
              },
              {
                path: 'register_paz_y_salvo',
                component: RegisterPazYSalvoPageComponent,
                canActivate: [roleGuard],
                title: 'Registrar paz y salvo',
                data: {
                  breadcrumb: 'Registrar paz y salvo',
                  roles: [UserRoleType.ADMINISTRADOR, UserRoleType.DECANATURA]
                }
              },
              {
                path: 'register_sustentation',
                component: RegisterSustentationPageComponent,
                canActivate: [roleGuard],
                title: 'Registrar sustentacion',
                data: {
                  breadcrumb: 'Registrar sustentacion',
                  roles: [UserRoleType.ADMINISTRADOR, UserRoleType.CONSEJO]
                }
              },
            ]
          },
        ]
      }
    ]
  }
]
