/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { EvaluationsPerformedPageComponent } from './evaluations-performed-page.component';
import { ProposalService } from '../../../modules/proposal/services/proposal.service';
import { PreliminaryDraftService } from '../../../modules/preliminary-draft/services/preliminary-draft.service';
import { FileDownloadService } from '../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../components/notifications/services/notification.service';
import { stateList } from '../../../core/enums/state.enum';
import { NotificationType } from '../../components/notifications/models/notification.model';
import { Evaluation } from '../../../core/interfaces/evaluation.interface';

describe('EvaluationsPerformedPageComponent', () => {
  let component: EvaluationsPerformedPageComponent;
  let fixture: ComponentFixture<EvaluationsPerformedPageComponent>;

  let mockProposalService: any;
  let mockPreliminaryService: any;
  let mockDownloadService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  // Mock de evaluación cumpliendo con la interfaz (incluyendo documentId)
  const mockEvaluation: Evaluation = {
    id: 'eval-1',
    proposalId: 'proposal-1',
    documentId: 'doc-123',
    evaluatorName: 'Juan Perez',
    evaluatorRole: 'COMITE',
    signedDocuments: ['doc.pdf'],
    veredict: stateList.APROBADO,
    observations: 'Todo correcto',
    date: new Date()
  };

  const mockProposal = {
    id: 'proposal-1',
    title: 'Propuesta de prueba',
    evaluations: [mockEvaluation],
    documents: [{ id: 'doc-123', name: 'archivo.pdf', type: 'Propuesta' }]
  };

  beforeEach(async () => {
    mockProposalService = {
      proposals: signal([mockProposal]).asReadonly()
    };

    mockPreliminaryService = {
      preliminaryDrafts: signal([]).asReadonly()
    };

    mockDownloadService = {
      download: jest.fn()
    };

    mockNotificationService = {
      show: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn(),
      url: '/proposal/proposal-1/evaluations' // URL necesaria para la lógica del computed
    };

    // Mock reactivo para paramMap
    mockActivatedRoute = {
      paramMap: of(new Map([['id', 'proposal-1']])),
      snapshot: { paramMap: { get: () => 'proposal-1' } },
      parent: {
        paramMap: of(new Map([['id', 'proposal-1']])),
        snapshot: { paramMap: { get: () => 'proposal-1' } }
      }
    };

    await TestBed.configureTestingModule({
      imports: [EvaluationsPerformedPageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: PreliminaryDraftService, useValue: mockPreliminaryService },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationsPerformedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe retornar evaluaciones procesadas correctamente (acceso protected)', () => {
    // Usamos casting a any para acceder a la propiedad protected en el test
    const evaluations = (component as any).evaluationsWithPermissions();

    expect(evaluations.length).toBe(1);
    expect(evaluations[0].id).toBe(mockEvaluation.id);
    expect(evaluations[0].documentTargetName).toBe('archivo.pdf');
  });

  it('Debe abrir el modal al hacer click en view_details', () => {
    component.handleTableAction({
      action: 'view_details',
      row: mockEvaluation
    });
    expect(component.modalState()).toEqual({
      open: true,
      evaluation: mockEvaluation
    });
  });

  it('Debe cerrar el modal correctamente', () => {
    component.modalState.set({
      open: true,
      evaluation: mockEvaluation
    });
    component.closeModal();
    expect(component.modalState()).toEqual({
      open: false,
      evaluation: null
    });
  });

  it('Debe llamar al servicio de descarga correctamente', () => {
    component.handleDownload('evaluacion.pdf');
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.INFO,
      title: 'Descarga'
    }));
    expect(mockDownloadService.download).toHaveBeenCalledWith(
      'assets/evaluaciones/evaluacion.pdf',
      'evaluacion.pdf'
    );
  });

  it('Debe navegar hacia atrás relativo a la ruta activa', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['../'],
      { relativeTo: mockActivatedRoute }
    );
  });
});
