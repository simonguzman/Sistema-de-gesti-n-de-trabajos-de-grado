/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EvaluationsPerformedPageComponent } from './evaluations-performed-page.component';

import { ProposalService } from '../../services/proposal.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../shared/components/state/state.component';
import { Evaluation } from '../../interfaces/evaluation.interface';

describe('EvaluationsPerformedPageComponent', () => {
  let component: EvaluationsPerformedPageComponent;
  let fixture: ComponentFixture<EvaluationsPerformedPageComponent>;

  let mockProposalService: any;
  let mockDownloadService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let proposalsSignal: any;

  const mockEvaluation: Evaluation = {
    id: 'eval-1',
    proposalId: 'proposal-1', // <- ESTE CAMPO FALTA
    evaluatorName: 'Juan Perez',
    evaluatorRole: 'COMITE',
    signedDocuments: ['doc.pdf'],
    veredict: stateList.APROBADO,
    observations: 'Todo correcto',
    date: new Date()
  };

  const mockProposal = {
    id: 'proposal-1',
    evaluations: [mockEvaluation]
  };

  beforeEach(async () => {
    proposalsSignal = signal([mockProposal]);
    mockProposalService = {
      proposals: proposalsSignal.asReadonly()
    };
    mockDownloadService = {
      download: jest.fn()
    };

    mockNotificationService = {
      show: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    mockActivatedRoute = {
      pathFromRoot: [
        {
          snapshot: {
            paramMap: {
              get: jest.fn().mockReturnValue(null)
            }
          }
        },
        {
          snapshot: {
            paramMap: {
              get: jest.fn().mockReturnValue('proposal-1')
            }
          }
        }
      ]
    };
    await TestBed.configureTestingModule({
      imports: [EvaluationsPerformedPageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute}
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(
      EvaluationsPerformedPageComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe cargar el proposalId desde la ruta', () => {
    expect(component.proposalId()).toBe('proposal-1');
  });

  it('Debe retornar evaluaciones correctamente', () => {
    const evaluations = component.evaluations();
    expect(evaluations.length).toBe(1);
    expect(evaluations[0]).toEqual(mockEvaluation);
  });

  it('Debe retornar evaluaciones vacías si no existe proposalId', () => {
    component.proposalId.set(null);
    const evaluations = component.evaluations();
    expect(evaluations).toEqual([]);
  });

  it('Debe retornar evaluaciones vacías si no encuentra la propuesta', () => {
    component.proposalId.set('proposal-no-existe');
    const evaluations = component.evaluations();
    expect(evaluations).toEqual([]);
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

  it('No debe abrir modal con acciones desconocidas', () => {
    component.handleTableAction({
      action: 'otra_accion',
      row: mockEvaluation
    });
    expect(component.modalState()).toEqual({
      open: false,
      evaluation: null
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

  it('Debe descargar archivo correctamente', () => {
    component.handleDownload('evaluacion.pdf');
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Descarga iniciada',
          type: NotificationType.INFO
        })
      );
    expect(mockDownloadService.download).toHaveBeenCalledWith(
        'assets/evaluaciones/evaluacion.pdf',
        'evaluacion.pdf'
      );
  });

  it('Debe navegar hacia atrás', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['../'],
        { relativeTo: mockActivatedRoute }
      );
  });
});
