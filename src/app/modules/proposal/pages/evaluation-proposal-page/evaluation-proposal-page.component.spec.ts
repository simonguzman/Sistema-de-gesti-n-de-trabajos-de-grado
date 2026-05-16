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

  // CORRECCIÓN: El objeto debe tener director.id, codirector.id, etc.
  const mockProposal: any = {
    id: 'proposal-1',
    title: 'Propuesta Test',
    description: 'Descripción de prueba',
    modality: Modality.PP,
    state: stateList.EN_REVISION,
    authors: ['student-1'],
    director: { id: 'director-1' },    // Cambiado de directorId a objeto
    codirector: { id: 'codirector-1' }, // Cambiado de string a objeto
    advisor: { id: 'advisor-1' },       // Cambiado de string a objeto
    documents: [
      {
        id: 'doc-1',
        name: 'Documento.pdf',
        url: 'http://test.com/file.pdf',
        uploadDate: new Date('2025-01-01'), // Aseguramos que sea Date o string válido
        type: 'Propuesta',
        status: stateList.EN_REVISION
      }
    ],
    evaluations: [],
    createdAt: new Date()
  };

  beforeEach(async () => {
    mockProposalService = {
      getProposalByIdMock: jest.fn().mockReturnValue(of(mockProposal)),
      validateProposalRules: jest.fn().mockReturnValue(null),
      addEvaluationMock: jest.fn().mockReturnValue(of(undefined))
    };

    mockNotificationService = { show: jest.fn() };
    mockDownloadService = { download: jest.fn() };
    mockUserService = {
      getAuthorsNames: jest.fn().mockReturnValue('Juan Perez'),
      getUserFullName: jest.fn().mockImplementation((id: string) => `Usuario ${id}`)
    };

    mockAuthService = {
      currentUser: signal({
        id: 'user-1',
        firstName: 'Simon',
        lastName: 'Guzman',
        roles: [UserRoleType.COMITE]
      })
    };

    mockRouter = { navigate: jest.fn() };
    mockLocation = { back: jest.fn() };
    mockActivatedRoute = {
      snapshot: {
        paramMap: { get: jest.fn().mockReturnValue('proposal-1') }
      },
      parent: {
        snapshot: {
          paramMap: { get: jest.fn().mockReturnValue('proposal-1') }
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [EvaluationProposalPageComponent, ReactiveFormsModule],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationProposalPageComponent);
    component = fixture.componentInstance;

    // Ejecutamos la detección de cambios inicial para que ngOnInit se complete
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe cargar la propuesta correctamente', () => {
    expect(component.proposal()).toEqual(mockProposal);
  });

  it('Debe regresar si no encuentra id', () => {
    // Simulamos que no hay ID en la ruta
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
    if (mockActivatedRoute.parent) {
      mockActivatedRoute.parent.snapshot.paramMap.get.mockReturnValue(null);
    }

    component.ngOnInit();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe regresar si ocurre error cargando propuesta', () => {
    mockProposalService.getProposalByIdMock.mockReturnValue(throwError(() => new Error('Error')));
    component.ngOnInit();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe guardar archivo firmado correctamente', () => {
    const file = new File(['contenido'], 'firma.pdf');
    component.handleFileUploaded({ fileName: 'firma.pdf', file });
    expect(component.signedFile()).toEqual({ name: 'firma.pdf' });
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Formato A adjuntado'
    }));
  });

  it('Debe remover archivo firmado', () => {
    component.signedFile.set({ name: 'firma.pdf' });
    component.removeSignedFile();
    expect(component.signedFile()).toBeNull();
  });

  it('Debe descargar documento original', () => {
    component.downloadOriginalDocument();
    expect(mockDownloadService.download).toHaveBeenCalled();
  });

  it('Debe mostrar error si formulario está inválido al enviar', () => {
    component.evaluationForm.patchValue({ result: '', comments: '' });
    component.initiateEvaluationSubmit();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Formulario incompleto'
    }));
  });

  it('Debe abrir modal de confirmación si el formulario y archivo son válidos', () => {
    component.evaluationForm.patchValue({ result: 'Aprobado', comments: 'Excelente' });
    component.signedFile.set({ name: 'firma.pdf' });
    component.initiateEvaluationSubmit();
    expect(component.modalState().confirm).toBe(true);
  });

  it('Debe registrar la evaluación y navegar al finalizar', () => {
    component.evaluationForm.patchValue({ result: 'Aprobado', comments: 'Excelente' });
    component.signedFile.set({ name: 'firma.pdf' });

    component.confirmEvaluation();

    expect(mockProposalService.addEvaluationMock).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('Debe manejar errores del servidor al confirmar evaluación', () => {
    mockProposalService.addEvaluationMock.mockReturnValue(throwError(() => new Error('API Error')));
    component.evaluationForm.patchValue({ result: 'Aprobado', comments: 'Excelente' });
    component.signedFile.set({ name: 'firma.pdf' });

    component.confirmEvaluation();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error de servidor'
    }));
  });
});
