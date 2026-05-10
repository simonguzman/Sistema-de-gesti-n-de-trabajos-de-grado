/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { LoadedProposalsPageComponent } from './loaded-proposals-page.component';

import { ProposalService } from '../../services/proposal.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../shared/components/state/state.component';
import { UserRoleType } from '../../../../core/models/user-role';

import { ProposalDocument } from '../../interfaces/proposalDocument.inteface';

describe('LoadedProposalsPageComponent', () => {
  let component: LoadedProposalsPageComponent;
  let fixture: ComponentFixture<LoadedProposalsPageComponent>;

  let mockProposalService: any;
  let mockDownloadService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let proposalsSignal: any;
  let currentUserSignal: any;

  const mockDocument: ProposalDocument = {
    id: 'doc-1',
    name: 'Documento Test',
    url: 'http://test.com/file.pdf',
    uploadDate: '01 - 01 - 2025',
    type: 'Correccion' as const,
    status: stateList.EN_REVISION
  };

  const mockProposal = {
    id: 'proposal-1',
    directorId: 'director-1',
    documents: [mockDocument]
  };

  beforeEach(async () => {
    proposalsSignal = signal([mockProposal]);
    currentUserSignal = signal<any>({
      id: 'director-1',
      roles: [UserRoleType.DIRECTOR]
    });

    mockProposalService = {
      proposals: proposalsSignal.asReadonly(),
      uploadCorrectionMock: jest.fn().mockReturnValue(
        of(undefined)
      )
    };

    mockDownloadService = {
      download: jest.fn()
    };

    mockNotificationService = {
      show: jest.fn()
    };

    mockAuthService = {
      currentUser: currentUserSignal.asReadonly(),
      hasAnyRole: jest.fn((roles: string[]) =>
        currentUserSignal()?.roles?.some(
          (role: string) => roles.includes(role)
        ) || false
      )
    };

    mockRouter = {
      navigate: jest.fn()
    };

    mockActivatedRoute = {
      parent: {
        snapshot: {
          paramMap: {
            get: jest.fn().mockReturnValue('proposal-1')
          }
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [LoadedProposalsPageComponent],
      providers: [
        { provide: ProposalService,useValue: mockProposalService },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(LoadedProposalsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe cargar el proposalId desde la ruta', () => {
    expect(component.proposalId()).toBe('proposal-1');
  });

  it('Debe abrir el modal si el usuario es director', () => {
    component.handleHeaderButton();
    expect(component.fileModalOpen()).toBe(true);
  });

  it('Debe mostrar notificación si no tiene permisos', () => {
    currentUserSignal.set({
      id: 'otro-user',
      roles: []
    });
    component.handleHeaderButton();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Acceso denegado',
      type: NotificationType.ERROR
    }));
  });

  it('Debe guardar archivo seleccionado y abrir modal de confirmación', () => {
    const file = new File(['contenido'], 'test.pdf');
    component.onFileSelected({
      fileName: 'test.pdf',
      file
    });
    expect(component.uploadState()).toEqual({
      fileName: 'test.pdf',
      file
    });
    expect(component.fileModalOpen()).toBe(false);
    expect(component.confirmModalOpen()).toBe(true);
  });

  it('Debe subir documento correctamente', () => {
    const file = new File(['contenido'], 'test.pdf');
    component.uploadState.set({
      fileName: 'test.pdf',
      file
    });
    component.proposalId.set('proposal-1');
    component.confirmUpload();
    expect(mockProposalService.uploadCorrectionMock).toHaveBeenCalled();
    expect(component.confirmModalOpen()).toBe(false);
    expect(component.uploadState()).toBeNull();
  });

  it('No debe subir si no hay uploadState', () => {
    component.uploadState.set(null);
    component.confirmUpload();
    expect(mockProposalService.uploadCorrectionMock).not.toHaveBeenCalled();
  });

  it('Debe cancelar subida correctamente', () => {
    component.confirmModalOpen.set(true);
    component.uploadState.set({
      fileName: 'test.pdf',
      file: new File(['contenido'], 'test.pdf')
    });
    component.cancelUpload();
    expect(component.confirmModalOpen()).toBe(false);
    expect(component.uploadState()).toBeNull();
  });

  it('Debe navegar hacia atrás', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['../'],
        { relativeTo: mockActivatedRoute }
      );
  });

  it('Debe descargar documento correctamente', () => {
    const row = mockDocument;
    component.handleTableAction({
      action: 'download',
      row
    });
    expect(mockDownloadService.download).toHaveBeenCalledWith(
        row.url,
        `${row.name}.pdf`
      );
  });

  it('Debe mostrar notificación si el documento no tiene URL', () => {
    const row: ProposalDocument = {
      ...mockDocument,
      url: ''
    };
    component.handleTableAction({
      action: 'download',
      row
    });
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Archivo no disponible',
      type: NotificationType.ERROR
    }));
  });

  it('Debe navegar a evaluación', () => {
    component.handleTableAction({
      action: 'evaluate',
      row: mockDocument
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['evaluate_proposal'],
        { relativeTo: mockActivatedRoute }
      );
  });

  it('Debe retornar acciones de evaluación para COMITE', () => {
    currentUserSignal.set({
      id: 'comite-1',
      roles: [UserRoleType.COMITE]
    });
    const data = component.documentsTableData();
    expect(data[0].acciones.length).toBe(2);
  });

  it('Debe retornar solo download si no tiene rol permitido', () => {
    currentUserSignal.set({
      id: 'user-normal',
      roles: []
    });
    const data = component.documentsTableData();
    expect(data[0].acciones.length).toBe(1);
  });

  it('Debe deshabilitar botón header si documento está aprobado', () => {
    proposalsSignal.set([
      {
        ...mockProposal,

        documents: [
          {
            ...mockDocument,
            status: stateList.APROBADO
          }
        ]
      }
    ]);
    const buttons = component.headerButtons();
    expect(buttons[0].disabled).toBe(true);
  });

  it('Debe habilitar botón header si documento NO está aprobado', () => {
    const buttons = component.headerButtons();
    expect(buttons[0].disabled).toBe(false);
  });

  it('Debe retornar headerButtons vacío si no hay usuario', () => {
    currentUserSignal.set(null);
    const buttons = component.headerButtons();
    expect(buttons).toEqual([]);
  });

  it('Debe retornar documentsTableData vacío si no hay proposalId', () => {
    component.proposalId.set(null);
    const data = component.documentsTableData();
    expect(data).toEqual([]);

  });

  it('Debe retornar documentsTableData vacío si no encuentra propuesta', () => {
    component.proposalId.set('no-existe');
    const data = component.documentsTableData();
    expect(data).toEqual([]);
  });
});
