/* tslint:disable:no-unused-variable */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';

import { ProposalCreatePageComponent } from './proposal-create-page.component';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Modality, Proposal } from '../../interfaces/proposal.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { UserRoleType } from '../../../../core/models/user-role';

// --- Mocks de Componentes Hijos ---
@Component({
  selector: 'app-proposal-form',
  template: '',
  standalone: true
})
class MockProposalFormComponent {
  @Input() proposal: Proposal | null = null;
  @Output() onSubmit = new EventEmitter<Proposal>();
}

@Component({
  selector: 'app-confirmation-action-modal',
  template: '',
  standalone: true
})
class MockConfirmationModalComponent {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}

describe('ProposalCreatePageComponent', () => {
  let component: ProposalCreatePageComponent;
  let fixture: ComponentFixture<ProposalCreatePageComponent>;

  // Mocks de Servicios
  let mockProposalService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let mockLocation: any;

  // Datos de prueba corregidos (evitando error ts 2740)
  const mockProposalData: Proposal = {
    id: 'new-prop',
    title: 'Nueva Propuesta Test',
    description: 'Descripción detallada',
    modality: Modality.TI,
    state: stateList.EN_REVISION,
    authors: ['student-1'],
    director: {
      id: 'director-123',
      firstName: 'Juan',
      lastName: 'Pérez'
    } as any, // Casting para evitar errores de propiedades faltantes del User
    createdAt: new Date(),
    documents: [],
    evaluations: []
  };

  beforeEach(async () => {
    mockProposalService = {
      createProposalMock: jest.fn().mockReturnValue(of({}))
    };
    mockNotificationService = {
      show: jest.fn()
    };
    mockAuthService = {
      hasAnyRole: jest.fn().mockReturnValue(true)
    };
    mockRouter = {
      navigate: jest.fn()
    };
    mockLocation = {
      back: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProposalCreatePageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation }
      ]
    })
    .overrideComponent(ProposalCreatePageComponent, {
      set: {
        imports: [MockProposalFormComponent, MockConfirmationModalComponent]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProposalCreatePageComponent);
    component = fixture.componentInstance;
  });

  // --- TESTS DE CICLO DE VIDA Y ACCESO ---

  it('Debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Debe denegar acceso y redirigir si el usuario no tiene los roles permitidos', () => {
    mockAuthService.hasAnyRole.mockReturnValue(false);
    component.ngOnInit();

    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Acceso Denegado',
      type: NotificationType.ERROR
    }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
  });

  it('Debe permitir el acceso si el usuario es ADMINISTRADOR o DIRECTOR', () => {
    mockAuthService.hasAnyRole.mockReturnValue(true);
    component.ngOnInit();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(mockNotificationService.show).not.toHaveBeenCalled();
  });

  // --- TESTS DE FLUJO DE CREACIÓN ---

  it('Debe preparar el estado de confirmación cuando se emite handleCreateProposal', () => {
    component.handleCreateProposal(mockProposalData);

    expect(component.confirmState.show).toBe(true);
    expect(component.confirmState.pendingData).toEqual(mockProposalData);
  });

  it('Debe resetear el estado al cancelar la creación', () => {
    component.confirmState = { show: true, pendingData: mockProposalData };

    component.cancelCreation();

    expect(component.confirmState.show).toBe(false);
    expect(component.confirmState.pendingData).toBeNull();
  });

  it('Debe llamar al servicio de creación y navegar al éxito al confirmar', () => {
    // Setup del estado previo
    component.confirmState = { show: true, pendingData: mockProposalData };

    component.confirmCreation();

    // Verificación de notificaciones de proceso y éxito
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Procesando registro'
    }));
    expect(mockProposalService.createProposalMock).toHaveBeenCalledWith(mockProposalData);
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.CONFIRMATION
    }));

    // Verificación de limpieza y navegación
    expect(component.confirmState.show).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
  });

  it('Debe manejar errores del servidor durante la creación', () => {
    mockProposalService.createProposalMock.mockReturnValue(throwError(() => new Error('DB Error')));
    component.confirmState = { show: true, pendingData: mockProposalData };

    component.confirmCreation();

    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error de servidor',
      type: NotificationType.ERROR
    }));
  });

  it('No debe hacer nada en confirmCreation si no hay datos pendientes', () => {
    component.confirmState.pendingData = null;
    component.confirmCreation();

    expect(mockProposalService.createProposalMock).not.toHaveBeenCalled();
  });

  // --- TESTS DE NAVEGACIÓN ---

  it('Debe llamar a Location.back() al ejecutar goBack', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });
});
