import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCreatePageComponent } from './user-create-page.component';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Router } from '@angular/router';
import { IdentificationType, User } from '../../interfaces/user.interface';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { of, throwError } from 'rxjs';
import { Location } from '@angular/common';

describe('UserCreatePageComponent', () => {
  let component: UserCreatePageComponent;
  let fixture: ComponentFixture<UserCreatePageComponent>;

  const mockUserService = {
    createUserMock: jest.fn()
  };

  const mockNotificationService = {
    show: jest.fn()
  };

  const mockRouter = {
    navigate: jest.fn()
  };

  const mockLocation = {
    back: jest.fn()
  };

  const mockUser: User = {
    id: 'aacs',
    idType: 'CC' as IdentificationType,
    idNumber: 12345,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    roles: [UserRoleType.ADMINISTRADOR],
    password: 'password123',
    secondLastName: 'Test',
    codeNumber: 101
  };

  beforeEach(async() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ UserCreatePageComponent ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(UserCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Flujo de Creación de Usuario', () => {
    it('debería preparar los datos y abrir el modal al llamar a handleCreateUser', () => {
      component.handleCreateUser(mockUser);

      expect(component.pendingUserData).toEqual(mockUser);
      expect(component.isConfirmModalOpen).toBe(true);
    });

    it('debería limpiar los datos y cerrar el modal al cancelar', () => {
      component.pendingUserData = mockUser;
      component.isConfirmModalOpen = true;

      component.cancelCreation();

      expect(component.isConfirmModalOpen).toBe(false);
      expect(component.pendingUserData).toBeNull();
    });

    it('debería procesar la creación exitosa correctamente', () => {
      // Configuramos el mock para que retorne un éxito
      mockUserService.createUserMock.mockReturnValue(of({ success: true }));
      component.pendingUserData = mockUser;

      component.confirmCreation();

      // 1. Debe cerrar el modal
      expect(component.isConfirmModalOpen).toBe(false);

      // 2. Debe mostrar notificación de "Procesando" y luego "Éxito"
      expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.INFO
      }));
      expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.CONFIRMATION
      }));

      // 3. Debe navegar a /users
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    });

    it('debería manejar errores del servidor al crear usuario', () => {
      // Espiamos el log y le decimos que no haga nada (mockImplementation)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      // Configuramos el mock para que retorne un error
      mockUserService.createUserMock.mockReturnValue(throwError(() => new Error('Server Error')));
      component.pendingUserData = mockUser;

      component.confirmCreation();

      expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR
      }));
      // No debería navegar si hay error
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('no debería hacer nada en confirmCreation si no hay datos pendientes', () => {
      component.pendingUserData = null;
      component.confirmCreation();
      expect(mockUserService.createUserMock).not.toHaveBeenCalled();
    });
  });

  describe('Navegación', () => {
    it('debería llamar a location.back() al ejecutar goBack()', () => {
      component.goBack();
      expect(mockLocation.back).toHaveBeenCalled();
    });
  });
});
