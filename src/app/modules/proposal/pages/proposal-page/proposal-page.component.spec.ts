/* tslint:disable:no-unused-variable */
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { throwError, Subject } from 'rxjs';
import { ProposalService } from '../../services/proposal.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ProposalPageComponent } from './proposal-page.component';

describe('ProposalPageComponent', () => {
  let component: ProposalPageComponent;
  let fixture: ComponentFixture<ProposalPageComponent>;

  let mockProposalService: any;
  let mockAuthService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  beforeEach(async () => {
    mockProposalService = {
      proposals: signal([
        { id: '1', title: 'Propuesta Test', description: 'Desc', state: 'Aprobado' }
      ]),
      deleteProposalMock: jest.fn()
    };

    mockAuthService = {
      hasAnyRole: jest.fn()
    };

    mockNotificationService = {
      show: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };
    await TestBed.configureTestingModule({
      imports: [ProposalPageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ProposalPageComponent);
    component = fixture.componentInstance;
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe ocultar acciones de edición/eliminación si el usuario no tiene permisos', () => {
    mockAuthService.hasAnyRole.mockReturnValue(false);
    component.ngOnInit();
    const accionesCol = component['columns'].find(c => c.field === 'acciones');
    const hasEdit = accionesCol?.actions?.some(a => a.action === 'editar');
    const hasDelete = accionesCol?.actions?.some(a => a.action === 'eliminar');
    expect(hasEdit).toBe(false);
    expect(hasDelete).toBe(false);
    expect(accionesCol?.actions?.length).toBe(1);
  });

  it('Debe mostrar todas las acciones si el usuario es ADMINISTRADOR', () => {
    mockAuthService.hasAnyRole.mockReturnValue(true);
    component.ngOnInit();
    const accionesCol = component['columns'].find(c => c.field === 'acciones');
    expect(accionesCol?.actions?.length).toBe(3);
  });

  it('Debe navegar a la creación al pulsar "Registrar propuesta"', () => {
    const btn = { label: 'Registrar propuesta', variant: 'primary' };
    component.handleHeaderButton(btn as any);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal/create']);
  });

  it('Debe abrir el modal de descripción con el contenido correcto', () => {
    const mockRow: any = { description: 'Contenido de prueba' };
    component.handleTableAction({ action: 'ver descripcion', row: mockRow });
    expect(component.descriptionModal.show).toBe(true);
    expect(component.descriptionModal.content).toBe('Contenido de prueba');
  });

  it('Debe completar el flujo de eliminación exitosamente', fakeAsync(() => {
    const proposalId = '123';
    const deleteSubject = new Subject<void>();
    mockProposalService.deleteProposalMock.mockReturnValue(deleteSubject.asObservable());
    component.deleteState = { show: true, id: proposalId, title: 'Test', loading: false };
    component.confirmDelete();
    expect(component.deleteState.loading).toBe(true);
    deleteSubject.next();
    deleteSubject.complete();
    tick();
    fixture.detectChanges();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.CONFIRMATION
    }));
    expect(component.deleteState.loading).toBe(false);
    expect(component.deleteState.show).toBe(false);
    expect(component.deleteState.id).toBeNull();
  }));

  it('Debe manejar errores en la eliminación', fakeAsync(() => {
    mockProposalService.deleteProposalMock.mockReturnValue(throwError(() => new Error('Error')));
    component.deleteState = { show: true, id: '1', title: 'Test', loading: false };
    component.confirmDelete();
    tick();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.ERROR
    }));
    expect(component.deleteState.loading).toBe(false);
    expect(component.deleteState.show).toBe(true);
  }));
});
