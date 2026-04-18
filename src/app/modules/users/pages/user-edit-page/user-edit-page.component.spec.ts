import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserEditPageComponent } from './user-edit-page.component';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentificationType, User } from '../../interfaces/user.interface';
import { UserRoleType } from '../../../../core/models/user-role';
import { of, throwError } from 'rxjs';
import { Location } from '@angular/common';

describe('UserEditPageComponent', () => {
  let component: UserEditPageComponent;
  let fixture: ComponentFixture<UserEditPageComponent>;

  // Mocks de servicios
  let userServiceMock: jest.Mocked<UserService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let routerMock: jest.Mocked<Router>;
  let locationMock: jest.Mocked<Location>;

  const mockUser: User = {
    id: '123',
    idType: 'CC' as IdentificationType,
    idNumber: 12345,
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    roles: [UserRoleType.ADMINISTRADOR],
    password: '123',
    secondLastName: 'Test',
    codeNumber: 101
  };

  beforeEach(waitForAsync(() => {

    userServiceMock = {
      getUserByIdMock: jest.fn(),
      updateUserMock: jest.fn()
    } as any;

    notificationServiceMock = {
      show: jest.fn()
    } as any;

    routerMock = {
      navigate: jest.fn()
    } as any;

    locationMock = {
      back: jest.fn()
    }as any

    TestBed.configureTestingModule({
      imports: [ UserEditPageComponent ],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: {get: () => '123'}}
          }
        },
        { provide: UserService, useValue: userServiceMock },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    userServiceMock.getUserByIdMock.mockReturnValue(of(mockUser));
    fixture = TestBed.createComponent(UserEditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar los datos del usuario al iniciar (ngOnInit)', () => {
    expect(userServiceMock.getUserByIdMock).toHaveBeenCalledWith('123');
    expect(component.userToEdit()).toEqual(mockUser);
  });

  it('debería redirigir y mostrar error si el usuario no existe', () => {
    userServiceMock.getUserByIdMock.mockReturnValue(of(undefined));
    component.ngOnInit(); // Relanzamos para este caso específico

    expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Atención'
    }));
    expect(routerMock.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('debería abrir el modal de confirmación al llamar a handleUpdate', () => {
    component.handleUpdate(mockUser);
    expect(component.isConfirmModalOpen).toBe(true);
    // @ts-ignore - Accediendo a propiedad privada para el test
    expect(component.pendingUpdateData).toEqual(mockUser);
  });

  it('debería cerrar el modal al cancelar la actualización', () => {
    component.handleUpdate(mockUser);
    component.cancelUpdate();
    expect(component.isConfirmModalOpen).toBe(false);
  });

  it('debería llamar al servicio y navegar al confirmar la actualización con éxito', () => {
    userServiceMock.updateUserMock.mockReturnValue(of(mockUser));

    component.handleUpdate(mockUser);
    component.confirmUpdate();

    expect(userServiceMock.updateUserMock).toHaveBeenCalled();
    expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
      title: '¡Actualización exitosa!'
    }));
    expect(routerMock.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('debería mostrar notificación de error si falla la actualización', () => {
    userServiceMock.updateUserMock.mockReturnValue(throwError(() => new Error('Error')));

    component.handleUpdate(mockUser);
    component.confirmUpdate();

    expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error de actualización'
    }));
    expect(component.isConfirmModalOpen).toBe(false);
  });

  it('debería llamar a location.back al ejecutar goBack', () => {
    component.goBack();
    expect(locationMock.back).toHaveBeenCalled();
  });
});
