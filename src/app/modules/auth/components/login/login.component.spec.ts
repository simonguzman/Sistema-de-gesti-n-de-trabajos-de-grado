/* tslint:disable:no-unused-variable */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NEVER } from 'rxjs';

import { LoginComponent } from './login.component';

import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let mockAuthService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: jest.fn(() => false),
      login: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    mockNotificationService = {
      show: jest.fn()
    };
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe inicializar el formulario correctamente', () => {
    expect(component.loginForm).toBeTruthy();
    expect(component.loginForm.get('email')).toBeTruthy();
    expect(component.loginForm.get('password')).toBeTruthy();
  });

  it('Debe navegar a notifications si ya está autenticado', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('Debe marcar formulario como touched si es inválido', () => {
    const markSpy = jest.spyOn(component.loginForm,'markAllAsTouched');
    component.onSubmit();
    expect(markSpy).toHaveBeenCalled();
  });

  it('Debe hacer login exitosamente', fakeAsync(() => {
    mockAuthService.login.mockReturnValue(
      of({ success: true })
    );
    component.loginForm.setValue({
      email: 'test@test.com',
      password: '123456'
    });
    component.onSubmit();
    tick();
    expect(component.isLoading).toBe(false);
    expect(mockNotificationService.show).toHaveBeenCalledWith({
      title: '¡Bienvenido!',
      message: 'Sesión iniciada correctamente.',
      type: NotificationType.CONFIRMATION
    });
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '123456'
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/notifications']
      );
  }));

  it('Debe mostrar error si las credenciales son incorrectas', fakeAsync(() => {
    mockAuthService.login.mockReturnValue(
      of({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      })
    );
    component.loginForm.setValue({
      email: 'wrong@test.com',
      password: '123456'
    });
    component.onSubmit();
    tick();
    expect(component.isLoading).toBe(false);
    expect(mockNotificationService.show).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Correo o contraseña incorrectos.',
      type: NotificationType.ERROR
    });
  }));

  it('Debe mostrar mensaje por defecto si no viene message', fakeAsync(() => {
    mockAuthService.login.mockReturnValue(
      of({
        success: false
      })
    );
    component.loginForm.setValue({
      email: 'wrong@test.com',
      password: '123456'
    });
    component.onSubmit();
    tick();
    expect(mockNotificationService.show).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Credenciales inválidas',
      type: NotificationType.ERROR
    });
  }));

  it('Debe manejar errores técnicos correctamente', fakeAsync(() => {
    mockAuthService.login.mockReturnValue(
      throwError(() => new Error('Error técnico'))
    );
    component.loginForm.setValue({
      email: 'test@test.com',
      password: '123456'
    });
    component.onSubmit();
    tick();
    expect(component.isLoading).toBe(false);
    expect(mockNotificationService.show).toHaveBeenCalledWith({
      title: 'Error del Sistema',
      message: 'Ocurrió un error técnico al intentar conectar.',
      type: NotificationType.SECURITY
    });
  }));

  it('Debe activar isLoading al enviar formulario', () => {
    mockAuthService.login.mockReturnValue(NEVER);
    component.loginForm.setValue({
      email: 'test@test.com',
      password: '123456'
    });
    component.onSubmit();
    expect(component.isLoading).toBe(true);
  });

  it('Debe validar email requerido', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);
  });

  it('Debe validar formato de email', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('correo-invalido');
    expect(emailControl?.hasError('email')).toBe(true);
  });

  it('Debe validar password requerida', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBe(true);
  });

  it('Debe validar longitud mínima de password', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBe(true);
  });
});
