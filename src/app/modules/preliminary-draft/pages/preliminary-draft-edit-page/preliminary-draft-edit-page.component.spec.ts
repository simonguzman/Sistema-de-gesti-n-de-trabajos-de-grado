import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreliminaryDraftEditPageComponent } from './preliminary-draft-edit-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { signal, Component, Input, Output, EventEmitter } from '@angular/core';

// Interfaces y Modelos
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

// Servicios
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

// Componentes Reales para referencia en override
import { PreliminaryDraftFormComponent } from "../../components/preliminary-draft-form/preliminary-draft-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

// --- MOCKS DE COMPONENTES ---
@Component({
  selector: 'app-preliminary-draft-form',
  template: '',
  standalone: true
})
class MockDraftForm {
  @Input() initialData: any;
  @Output() onSubmit = new EventEmitter<any>();
}

@Component({
  selector: 'app-confirmation-action-modal',
  template: '',
  standalone: true
})
class MockConfirmModal {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() isProcessing: boolean = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

describe('PreliminaryDraftEditPageComponent', () => {
  let component: PreliminaryDraftEditPageComponent;
  let fixture: ComponentFixture<PreliminaryDraftEditPageComponent>;

  // Mocks de dependencias
  let preliminaryDraftServiceMock: any;
  let notificationServiceMock: any;
  let authServiceMock: any;
  let routerMock: any;
  let locationMock: any;

  const mockDraftData: any = {
    preliminaryDraftId: 'edit-123',
    proposalData: {
      title: 'Proyecto a editar',
      director: { id: 'user-director' }
    }
  };

  beforeEach(async () => {
    preliminaryDraftServiceMock = {
      getPreliminaryDraftByIdMock: jest.fn().mockReturnValue(of(mockDraftData)),
      updatePreliminaryDraftMock: jest.fn().mockReturnValue(of({}))
    };

    notificationServiceMock = { show: jest.fn() };

    authServiceMock = {
      currentUser: signal({ id: 'user-director' }),
      hasAnyRole: jest.fn().mockReturnValue(false)
    };

    routerMock = { navigate: jest.fn() };
    locationMock = { back: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [PreliminaryDraftEditPageComponent],
      providers: [
        { provide: PreliminaryDraftService, useValue: preliminaryDraftServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => 'edit-123' } }
          }
        }
      ]
    })
    .overrideComponent(PreliminaryDraftEditPageComponent, {
      remove: {
        imports: [
          PreliminaryDraftFormComponent,
          ConfirmationActionModalComponent
        ]
      },
      add: { imports: [MockDraftForm, MockConfirmModal] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreliminaryDraftEditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería cargar los datos del anteproyecto al iniciar si el usuario es el dueño', () => {
    expect(preliminaryDraftServiceMock.getPreliminaryDraftByIdMock).toHaveBeenCalledWith('edit-123');
    expect(component.preliminaryDraftToEdit()).toEqual(mockDraftData);
  });

  describe('Control de Seguridad en Carga', () => {
    it('debería redirigir si el usuario no es dueño ni administrador', () => {
      // Usuario diferente al director
      authServiceMock.currentUser.set({ id: 'otro-usuario' });
      authServiceMock.hasAnyRole.mockReturnValue(false);

      component.ngOnInit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR
      }));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/preliminary-draft']);
    });

    it('debería permitir el acceso si el usuario es Administrador aunque no sea dueño', () => {
      authServiceMock.currentUser.set({ id: 'admin-id' });
      authServiceMock.hasAnyRole.mockReturnValue(true); // Es ADMIN

      component.ngOnInit();

      expect(component.preliminaryDraftToEdit()).not.toBeNull();
      expect(routerMock.navigate).not.toHaveBeenCalledWith(['/preliminary-draft']);
    });
  });

  describe('Flujo de Actualización', () => {
    it('debería abrir el modal de confirmación al intentar actualizar', () => {
      const updatedData = { ...mockDraftData, title: 'Nuevo Titulo' };
      component.handleUpdate(updatedData);

      expect(component.confirmState().isOpen).toBe(true);
      expect(component.confirmState().pendingData).toEqual(updatedData);
    });

    it('debería completar el proceso de actualización exitosamente', () => {
      const updatedData = { ...mockDraftData, title: 'Cambio Final' };
      component.confirmState.set({ isOpen: true, pendingData: updatedData, isProcessing: false });

      component.confirmUpdate();

      expect(preliminaryDraftServiceMock.updatePreliminaryDraftMock).toHaveBeenCalledWith('edit-123', updatedData);
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        title: '¡Cambios guardados!'
      }));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/preliminary-draft']);
    });

    it('debería manejar el error si la actualización falla en el servidor', () => {
      preliminaryDraftServiceMock.updatePreliminaryDraftMock.mockReturnValue(throwError(() => new Error()));
      component.confirmState.set({ isOpen: true, pendingData: mockDraftData, isProcessing: false });

      component.confirmUpdate();

      expect(component.confirmState().isProcessing).toBe(false);
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error de guardado'
      }));
    });
  });

  describe('Navegación', () => {
    it('debería volver atrás al llamar a goBack()', () => {
      component.goBack();
      expect(locationMock.back).toHaveBeenCalled();
    });

    it('debería cerrar el modal al cancelar la actualización', () => {
      component.confirmState.set({ isOpen: true, pendingData: mockDraftData, isProcessing: false });
      component.cancelUpdate();
      expect(component.confirmState().isOpen).toBe(false);
      expect(component.confirmState().pendingData).toBeNull();
    });
  });
});
