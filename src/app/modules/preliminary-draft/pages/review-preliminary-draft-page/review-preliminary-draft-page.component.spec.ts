/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewPreliminaryDraftPageComponent } from './review-preliminary-draft-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal, Component, Input, Output, EventEmitter } from '@angular/core';

// Interfaces y Modelos
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';

// Componentes Reales (necesarios para la referencia en overrideComponent)
import { ReviewPreliminaryDraftFormComponent } from "../../components/review-preliminary-draft-form/review-preliminary-draft-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

// Servicios
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';

// Mock del formulario hijo
@Component({
  selector: 'app-review-preliminary-draft-form',
  template: '',
  standalone: true
})
class MockReviewForm {
  @Input() preliminaryDraft: any;
  @Input() isSubmitting = false;
  @Output() onSaveEvaluation = new EventEmitter<any>();
  @Output() onDownloadPreliminaryDraft = new EventEmitter<void>();
}

// Mock del modal de confirmación
@Component({
  selector: 'app-confirmation-action-modal',
  template: '',
  standalone: true
})
class MockConfirmationModal {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

describe('ReviewPreliminaryDraftPageComponent', () => {
  let component: ReviewPreliminaryDraftPageComponent;
  let fixture: ComponentFixture<ReviewPreliminaryDraftPageComponent>;

  // Mocks de servicios
  let preliminaryDraftServiceMock: any;
  let authServiceMock: any;
  let notificationServiceMock: any;
  let downloadServiceMock: any;
  let routerMock: any;

  const mockUser = { id: 'user-123', firstName: 'Juan', lastName: 'Perez' };

  const mockDraft: any = {
    preliminaryDraftId: 'draft-999',
    proposalId: 'prop-111',
    state: stateList.EN_REVISION,
    createdAt: new Date().toISOString(),
    proposalData: { title: 'Sistema de Gestión Académica', description: 'Descripción de prueba' },
    evaluators: [{ id: 'user-123' }],
    evaluations: [],
    documents: [
      { id: 'doc-1', type: 'Anteproyecto', uploadDate: '2026-01-01', url: 'link1', name: 'v1.pdf' },
      { id: 'doc-2', type: 'Correccion', uploadDate: '2026-02-01', url: 'link2', name: 'v2.pdf' }
    ]
  };

  beforeEach(async () => {
    preliminaryDraftServiceMock = {
      getPreliminaryDraftByIdMock: jest.fn().mockReturnValue(of(mockDraft)),
      addEvaluationMock: jest.fn().mockReturnValue(of({}))
    };

    authServiceMock = {
      currentUser: signal(mockUser)
    };

    notificationServiceMock = { show: jest.fn() };
    downloadServiceMock = { download: jest.fn() };
    routerMock = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ReviewPreliminaryDraftPageComponent],
      providers: [
        { provide: PreliminaryDraftService, useValue: preliminaryDraftServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: FileDownloadService, useValue: downloadServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'draft-999' } },
            parent: { snapshot: { paramMap: { get: () => 'draft-999' } } }
          }
        }
      ]
    })
    .overrideComponent(ReviewPreliminaryDraftPageComponent, {
      remove: {
        imports: [
          ReviewPreliminaryDraftFormComponent,
          ConfirmationActionModalComponent
        ]
      },
      add: {
        imports: [MockReviewForm, MockConfirmationModal]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewPreliminaryDraftPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente y cargar datos si el usuario es evaluador', () => {
    expect(component).toBeTruthy();
    expect(preliminaryDraftServiceMock.getPreliminaryDraftByIdMock).toHaveBeenCalledWith('draft-999');
    expect(component.preliminaryDraftState()).toEqual(mockDraft);
  });

  describe('Lógica de activeRevision (Computed)', () => {
    it('debería seleccionar la revisión más reciente (Correccion sobre Anteproyecto)', () => {
      const active = component.activeRevision();
      expect(active?.id).toBe('doc-2');
      expect(active?.type).toBe('Correccion');
    });
  });

  describe('Control de Acceso', () => {
    it('debería denegar acceso si el usuario no está en la lista de evaluadores', () => {
      const draftSinPermiso = { ...mockDraft, evaluators: [{ id: 'otro-usuario' }] };
      preliminaryDraftServiceMock.getPreliminaryDraftByIdMock.mockReturnValue(of(draftSinPermiso));

      component.ngOnInit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Acceso Denegado'
      }));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Procesamiento de Evaluación', () => {
    it('debería ejecutar el proceso de evaluación exitosamente', () => {
      const mockReview = {
        formValues: { result: 'Aprobado', comments: 'Cumple requisitos' },
        file: new File([], 'acta.pdf')
      };
      component.pendingReviewData.set(mockReview);

      component.processEvaluation();

      expect(preliminaryDraftServiceMock.addEvaluationMock).toHaveBeenCalled();
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.CONFIRMATION
      }));
    });

    it('debería manejar errores cuando falla el guardado en el servidor', () => {
      preliminaryDraftServiceMock.addEvaluationMock.mockReturnValue(throwError(() => new Error()));
      component.pendingReviewData.set({
        formValues: { result: 'Aprobado' },
        file: new File([], 'f.pdf')
      });

      component.processEvaluation();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error al guardar'
      }));
    });
  });

  describe('Descargas', () => {
    it('debería descargar el archivo de la revisión activa', () => {
      component.downloadCurrentDocument();
      expect(downloadServiceMock.download).toHaveBeenCalledWith('link2', 'v2.pdf');
    });
  });
});
