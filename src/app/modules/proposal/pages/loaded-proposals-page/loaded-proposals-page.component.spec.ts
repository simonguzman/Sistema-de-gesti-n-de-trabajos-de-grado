import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadedProposalsPageComponent } from './loaded-proposals-page.component';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../core/enums/state.enum';

describe('LoadedProposalsPageComponent', () => {
  let component: LoadedProposalsPageComponent;
  let fixture: ComponentFixture<LoadedProposalsPageComponent>;

  // Mocks
  let mockProposalService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let mockDownloadService: any;
  let mockActivatedRoute: any;

  // Señales para los mocks (esto permite que los computed del componente reaccionen)
  const proposalsSignal = signal<any[]>([]);
  const currentUserSignal = signal<any>({ id: 'user-123', firstName: 'Juan' });

  const mockProposal = {
    id: 'prop-123',
    title: 'Propuesta Test',
    director: { id: 'user-123', firstName: 'Juan' },
    documents: [
      { id: 'doc-1', name: 'Documento 1', status: stateList.EN_REVISION, url: 'http://test.com' }
    ]
  };

  beforeEach(async () => {
    // Sincronizamos la señal de propuestas con nuestro dato de prueba
    proposalsSignal.set([mockProposal]);

    mockProposalService = {
      proposals: proposalsSignal, // El componente usa this.proposalService.proposals()
      uploadCorrectionMock: jest.fn().mockReturnValue(of({}))
    };

    mockNotificationService = {
      show: jest.fn()
    };

    mockAuthService = {
      currentUser: currentUserSignal, // CORRECCIÓN: El componente usa authService.currentUser()
      hasAnyRole: jest.fn().mockReturnValue(false)
    };

    mockRouter = {
      navigate: jest.fn()
    };

    mockDownloadService = {
      download: jest.fn()
    };

    mockActivatedRoute = {
      parent: {
        snapshot: {
          paramMap: {
            get: jest.fn().mockReturnValue('prop-123')
          }
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [LoadedProposalsPageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: FileDownloadService, useValue: mockDownloadService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadedProposalsPageComponent);
    component = fixture.componentInstance;
  });

  it('Debe crear el componente y cargar datos correctamente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.proposalId()).toBe('prop-123');
    // Verifica que el computed funcionó
    expect(component.documentsTableData().length).toBe(1);
  });

  it('Debe identificar al director y mostrar el botón de carga', () => {
    fixture.detectChanges();
    const buttons = component.headerButtons();
    expect(buttons.length).toBe(1);
    expect(buttons[0].label).toContain('Cargar propuesta corregida');
  });

  it('Debe navegar a evaluación cuando se dispara la acción', () => {
    // 1. Forzamos que el usuario tenga permisos de comité para que 'evaluate' sea una acción permitida
    mockAuthService.hasAnyRole.mockReturnValue(true);

    fixture.detectChanges(); // Recalcular computed 'documentsTableData' con el nuevo permiso

    // 2. Obtenemos la fila que ahora sí debería tener 'evaluate' en allowedActions
    const rowWithPermissions = component.documentsTableData()[0];
    const event = { action: 'evaluate', row: rowWithPermissions };

    // 3. Ejecutar
    component.handleTableAction(event);

    // 4. Verificar
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['evaluate_proposal'],
      expect.objectContaining({ relativeTo: mockActivatedRoute })
    );
  });

  it('Debe descargar el archivo correctamente', () => {
    fixture.detectChanges();
    const row = component.documentsTableData()[0];

    component.handleTableAction({ action: 'download', row });

    expect(mockDownloadService.download).toHaveBeenCalled();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.INFO
    }));
  });

  it('Debe abrir el modal de archivos al presionar el botón del header', () => {
    fixture.detectChanges();
    component.handleHeaderButton();
    expect(component.fileModalOpen()).toBe(true);
  });

  it('Debe manejar el flujo de subida de archivos (selección -> confirmación)', () => {
    fixture.detectChanges();
    const mockFile = new File([''], 'doc_corregido.pdf');

    // Simular selección
    component.onFileSelected({ fileName: 'doc_corregido.pdf', file: mockFile });
    expect(component.confirmModalOpen()).toBe(true);
    expect(component.uploadState()?.fileName).toBe('doc_corregido.pdf');

    // Simular confirmación exitosa
    component.confirmUpload();
    expect(mockProposalService.uploadCorrectionMock).toHaveBeenCalled();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.CONFIRMATION
    }));
  });

  it('Debe deshabilitar el botón de carga si la última versión está aprobada', () => {
    // Actualizamos la propuesta en la señal para que el computed reaccione
    const approvedProposal = {
      ...mockProposal,
      documents: [{ ...mockProposal.documents[0], status: stateList.APROBADO }]
    };
    proposalsSignal.set([approvedProposal]);

    fixture.detectChanges();
    const buttons = component.headerButtons();
    expect(buttons[0].disabled).toBe(true);
  });
});
