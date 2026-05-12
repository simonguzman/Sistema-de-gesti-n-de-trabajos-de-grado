/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { of, throwError } from 'rxjs';

import { EvaluationProposalPageComponent } from './evaluation-proposal-page.component';

import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

import { Modality } from '../../interfaces/proposal.interface';
import { UserRoleType } from '../../../../core/models/user-role';


describe('EvaluationProposalPageComponent', () => {
  let component: EvaluationProposalPageComponent;
  let fixture: ComponentFixture<EvaluationProposalPageComponent>;

  let mockProposalService: any;
  let mockNotificationService: any;
  let mockDownloadService: any;
  let mockUserService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let mockLocation: any;
  let mockActivatedRoute: any;

  const mockProposal = {
    id: 'proposal-1',
    title: 'Propuesta Test',
    description: 'Descripción de prueba',
    modality: Modality.PP,
    state: stateList.EN_REVISION,
    authors: ['student-1'],
    directorId: 'director-1',
    codirector: 'codirector-1',
    advisor: 'advisor-1',
    documents: [
      {
        id: 'doc-1',
        name: 'Documento.pdf',
        url: 'http://test.com/file.pdf',
        uploadDate: '01/01/2025',
        type: 'Propuesta' as const,
        status: stateList.EN_REVISION
      }
    ],
    evaluations: [],
    createdAt: new Date()
  };

  beforeEach(async () => {
    mockProposalService = {
      getProposalByIdMock: jest.fn().mockReturnValue(
        of(mockProposal)
      ),
      validateProposalRules: jest.fn().mockReturnValue(null),
      addEvaluationMock: jest.fn().mockReturnValue(
        of(undefined)
      )
    };

    mockNotificationService = {show: jest.fn()};
    mockDownloadService = {download: jest.fn() };
    mockUserService = {
      getAuthorsNames: jest.fn().mockReturnValue(
        'Juan Perez'
      ),
      getUserFullName: jest.fn().mockImplementation(
        (id: string) => `Usuario ${id}`
      )
    };

    mockAuthService = {
      currentUser: signal({
        id: 'user-1',
        firstName: 'Simon',
        lastName: 'Guzman',
        roles: [UserRoleType.COMITE]
      }).asReadonly()
    };

    mockRouter = {navigate: jest.fn()};
    mockLocation = {back: jest.fn()};
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn().mockReturnValue('proposal-1')
        }
      },
      parent: {
        snapshot: {
          paramMap: {
            get: jest.fn().mockReturnValue('proposal-1')
          }
        }
      }
    };
    await TestBed.configureTestingModule({
      imports: [ EvaluationProposalPageComponent,ReactiveFormsModule ],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService},
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: ActivatedRoute, useValue: mockActivatedRoute}
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(
      EvaluationProposalPageComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe cargar la propuesta correctamente', () => {
    expect(component.proposal()).toEqual(
      mockProposal
    );
  });

  it('Debe regresar si no encuentra id', () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
    mockActivatedRoute.parent.snapshot.paramMap.get.mockReturnValue(null);
    component.ngOnInit();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe regresar si ocurre error cargando propuesta', () => {
    mockProposalService.getProposalByIdMock.mockReturnValue(
        throwError(() => new Error('Error'))
      );
    component.ngOnInit();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe guardar archivo firmado correctamente', () => {
    const file = new File(['contenido'],'firma.pdf');
    component.handleFileUploaded({fileName: 'firma.pdf',file});
    expect(component.signedFile()).toEqual({name: 'firma.pdf'});
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Formato A adjuntado',
        type: NotificationType.CONFIRMATION
      })
    );
  });

  it('Debe remover archivo firmado', () => {
    component.signedFile.set({name: 'firma.pdf' });
    component.removeSignedFile();
    expect(component.signedFile()).toBeNull();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Documento removido',
        type: NotificationType.INFO
      })
    );
  });

  it('Debe descargar documento original', () => {
    component.downloadOriginalDocument();
    expect(mockDownloadService.download).toHaveBeenCalledWith(
      'http://test.com/file.pdf',
      'Documento.pdf'
    );
  });

  it('Debe mostrar error si documento no tiene URL', () => {
    component.proposal.set({
      ...mockProposal,
      documents: [{
          ...mockProposal.documents[0],
          url: ''
        }]
    });
    component.downloadOriginalDocument();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error de descarga',
        type: NotificationType.ERROR
      })
    );
  });

  it('Debe marcar formulario si está inválido', () => {
    component.initiateEvaluationSubmit();
    expect(mockNotificationService.show).toHaveBeenCalledWith( expect.objectContaining({
        title: 'Formulario incompleto',
        type: NotificationType.ERROR
      })
    );
  });

  it('Debe mostrar error si no hay archivo firmado', () => {
    component.evaluationForm.patchValue({
      result: 'Aprobado',
      comments: 'Todo correcto'
    });
    component.initiateEvaluationSubmit();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Documento requerido',
        type: NotificationType.ERROR
      })
    );
  });

  it('Debe abrir modal de confirmación si formulario es válido', () => {
    component.evaluationForm.patchValue({
      result: 'Aprobado',
      comments: 'Todo correcto'
    });
    component.signedFile.set({name: 'firma.pdf'});
    component.initiateEvaluationSubmit();
    expect(component.modalState.confirm).toBe(true);
  });

  it('Debe cancelar evaluación', () => {
    component.modalState.confirm = true;
    component.cancelEvaluation();
    expect(component.modalState.confirm).toBe(false);
  });

  it('Debe registrar evaluación correctamente', () => {
    component.evaluationForm.patchValue({
      result: 'Aprobado',
      comments: 'Excelente propuesta'
    });
    component.signedFile.set({name: 'firma.pdf'});
    component.confirmEvaluation();
    expect(mockProposalService.addEvaluationMock).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['../'],
      { relativeTo: mockActivatedRoute }
    );
  });

  it('Debe mostrar error si falla guardar evaluación', () => {
    mockProposalService.addEvaluationMock.mockReturnValue(
        throwError(() => new Error('Error'))
      );
    component.evaluationForm.patchValue({
      result: 'Aprobado',
      comments: 'Excelente propuesta'
    });
    component.signedFile.set({name: 'firma.pdf'});
    component.confirmEvaluation();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error de servidor',
        type: NotificationType.ERROR
      })
    );
  });

  it('Debe mostrar error si falla validación de negocio', () => {
    mockProposalService.validateProposalRules.mockReturnValue('Error de negocio');
    component.evaluationForm.patchValue({
      result: 'Aprobado',
      comments: 'Excelente propuesta'
    });
    component.signedFile.set({name: 'firma.pdf'});
    component.confirmEvaluation();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Restricción de proceso',
        type: NotificationType.ERROR
      })
    );
  });

  it('Debe regresar usando location.back', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe retornar nombres correctamente', () => {
    expect(component.getStudentNames(['student-1'])).toBe('Juan Perez');
    expect(component.getDirectorName('director-1')).toBe('Usuario director-1');
  });

  it('Debe retornar vacío si no hay codirector', () => {
    expect(component.getCodirectorName(undefined)).toBe('');
  });

  it('Debe retornar vacío si no hay advisor', () => {
    expect(component.getAdvisorName(undefined)).toBe('');
  });
});
