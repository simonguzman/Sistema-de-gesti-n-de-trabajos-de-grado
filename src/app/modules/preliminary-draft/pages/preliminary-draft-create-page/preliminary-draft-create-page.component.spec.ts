import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreliminaryDraftCreatePageComponent } from './preliminary-draft-create-page.component';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { signal, Component, Input, Output, EventEmitter } from '@angular/core';

// Componentes Reales para el override
import { PreliminaryDraftFormComponent } from "../../components/preliminary-draft-form/preliminary-draft-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

// Interfaces y Enums
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

// Servicios
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

// --- MOCKS DE COMPONENTES ---
@Component({
  selector: 'app-preliminary-draft-form',
  template: '',
  standalone: true
})
class MockDraftForm {
  @Output() onSubmit = new EventEmitter<any>();
}

@Component({
  selector: 'app-confirmation-action-modal',
  template: '',
  standalone: true
})
class MockConfirmModal {
  @Input() isOpen: boolean = false;
  @Input() isProcessing: boolean = false;
  @Input() title: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

describe('PreliminaryDraftCreatePageComponent', () => {
  let component: PreliminaryDraftCreatePageComponent;
  let fixture: ComponentFixture<PreliminaryDraftCreatePageComponent>;

  // Mocks de dependencias
  let preliminaryDraftServiceMock: any;
  let notificationServiceMock: any;
  let authServiceMock: any;
  let routerMock: any;
  let locationMock: any;

  const mockNewDraft: any = {
    proposalData: { title: 'Nuevo Anteproyecto', description: 'Test' }
  };

  beforeEach(async () => {
    preliminaryDraftServiceMock = {
      createPreliminaryDraftMock: jest.fn().mockReturnValue(of({}))
    };

    notificationServiceMock = { show: jest.fn() };

    authServiceMock = {
      hasAnyRole: jest.fn().mockReturnValue(true) // Por defecto permitimos acceso
    };

    routerMock = { navigate: jest.fn() };
    locationMock = { back: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [PreliminaryDraftCreatePageComponent],
      providers: [
        { provide: PreliminaryDraftService, useValue: preliminaryDraftServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock }
      ]
    })
    .overrideComponent(PreliminaryDraftCreatePageComponent, {
      // Usamos las clases reales para evitar el error 'any' only refers to a type
      remove: { imports: [PreliminaryDraftFormComponent, ConfirmationActionModalComponent] },
      add: { imports: [MockDraftForm, MockConfirmModal] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreliminaryDraftCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Seguridad de la Página (ngOnInit)', () => {
    it('debería permitir el acceso si el usuario es ADMINISTRADOR o DIRECTOR', () => {
      authServiceMock.hasAnyRole.mockReturnValue(true);
      component.ngOnInit();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('debería redirigir y mostrar error si el usuario no tiene permisos', () => {
      authServiceMock.hasAnyRole.mockReturnValue(false);
      component.ngOnInit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR,
        title: 'Acceso restringido'
      }));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/preliminary-draft']);
    });
  });

  describe('Flujo de Creación', () => {
    it('debería abrir el modal de confirmación al recibir datos del formulario', () => {
      component.handleCreatePreliminaryDraft(mockNewDraft);

      const state = component.confirmState();
      expect(state.isOpen).toBe(true);
      expect(state.pendingData).toEqual(mockNewDraft);
    });

    it('debería llamar al servicio de creación y navegar al éxito', () => {
      // Setup del estado previo
      component.confirmState.set({ isOpen: true, pendingData: mockNewDraft, isProcessing: false });

      component.confirmCreation();

      expect(preliminaryDraftServiceMock.createPreliminaryDraftMock).toHaveBeenCalledWith(mockNewDraft);
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.CONFIRMATION
      }));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/preliminary-draft']);
    });

    it('debería manejar el error del servidor correctamente', () => {
      preliminaryDraftServiceMock.createPreliminaryDraftMock.mockReturnValue(throwError(() => new Error('Server Error')));
      component.confirmState.set({ isOpen: true, pendingData: mockNewDraft, isProcessing: false });

      component.confirmCreation();

      expect(component.confirmState().isProcessing).toBe(false);
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR,
        title: 'Error de registro'
      }));
    });

    it('debería resetear el estado al cancelar la creación', () => {
      component.confirmState.set({ isOpen: true, pendingData: mockNewDraft, isProcessing: false });

      component.cancelCreation();

      expect(component.confirmState().isOpen).toBe(false);
      expect(component.confirmState().pendingData).toBeNull();
    });
  });

  describe('Navegación', () => {
    it('debería llamar a location.back() al ejecutar goBack()', () => {
      component.goBack();
      expect(locationMock.back).toHaveBeenCalled();
    });
  });
});
