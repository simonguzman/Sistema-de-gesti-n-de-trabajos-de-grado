/* tslint:disable:no-unused-variable */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { UserState } from '../../../modules/users/interfaces/user.interface';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserService } from '../../../modules/users/services/user.service';
import { Router } from '@angular/router';

describe('Service: Auth', () => {
  let service: AuthService;
  let userServiceMock: any;
  let routerMock: any;

  const mockUser = {
    id: '1',
    email: 'test@unicauca.edu.co',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    roles: ['DIRECTOR'],
    state: UserState.active
  };

  beforeEach(() => {
    // Limpiamos localStorage antes de cada test
    localStorage.clear();

    // Mocks de dependencias
    userServiceMock = {
      users: jest.fn().mockReturnValue([mockUser]),
      updateUserPasswordMock: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('Debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('Debe iniciar con isAuthenticated en false si no hay sesión guardada', () => {
    // La señal computada debe ser false
    expect(service.isAuthenticated()).toBeFalsy();
    expect(service.currentUser()).toBeNull();
  });

  it('Debe recuperar la sesión del localStorage al instanciar el servicio', () => {
    // 1. Preparamos el storage ANTES de crear el servicio
    localStorage.setItem('sgtg_session', JSON.stringify(mockUser));

    // 2. Usamos runInInjectionContext para que el inject() interno de AuthService funcione
    const newService = TestBed.runInInjectionContext(() => new AuthService());

    expect(newService.isAuthenticated()).toBeTruthy();
    expect(newService.currentUser()?.email).toBe(mockUser.email);
  });

  describe('login', () => {
    it('Debe iniciar sesión exitosamente con credenciales correctas', fakeAsync(() => {
      const credentials = { email: 'test@unicauca.edu.co', password: 'password123' };
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      let result: any;
      service.login(credentials).subscribe(res => result = res);

      tick(1000); // El servicio tiene delay(1000)

      expect(result.success).toBeTruthy();
      expect(service.currentUser()).toEqual(mockUser);
      expect(setItemSpy).toHaveBeenCalledWith('sgtg_session', JSON.stringify(mockUser));
    }));

    it('Debe retornar error si el usuario está inactivo', fakeAsync(() => {
      const inactiveUser = { ...mockUser, state: UserState.inactive };
      userServiceMock.users.mockReturnValue([inactiveUser]);

      let result: any;
      service.login({ email: inactiveUser.email, password: inactiveUser.password }).subscribe(res => result = res);

      tick(1000);

      expect(result.success).toBeFalsy();
      expect(result.message).toContain('inhabilitada');
    }));
  });

  describe('logout', () => {
    it('Debe limpiar el estado y el storage al cerrar sesión', () => {
      // Simulamos usuario logueado
      localStorage.setItem('sgtg_session', JSON.stringify(mockUser));

      service.logout();

      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('sgtg_session')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('changePassword', () => {
    it('Debe actualizar la contraseña si la actual es correcta', fakeAsync(() => {
      // En lugar de localStorage manual, usamos el propio método login del servicio
      // para que la señal interna _currentUser se actualice correctamente.
      service.login({ email: mockUser.email, password: mockUser.password }).subscribe();
      tick(1000);

      let response: any;
      service.changePassword('password123', 'newPassword456').subscribe(res => response = res);
      tick(1500);

      expect(response.success).toBeTruthy();
      expect(service.currentUser()?.password).toBe('newPassword456');
    }));

    it('Debe fallar si la contraseña actual no coincide', (done) => {
      localStorage.setItem('sgtg_session', JSON.stringify(mockUser));
      const authService = TestBed.inject(AuthService);

      authService.changePassword('wrong_pass', 'newPass').subscribe({
        error: (err) => {
          expect(err.message).toContain('incorrecta');
          done();
        }
      });
    });
  });

  describe('hasAnyRole', () => {
    it('Debe retornar true si el usuario tiene uno de los roles requeridos', fakeAsync(() => {
      // Forzamos el estado de login
      service.login({ email: mockUser.email, password: mockUser.password }).subscribe();
      tick(1000);

      expect(service.hasAnyRole(['DIRECTOR', 'ADMIN'])).toBeTruthy();
    }));
  });
});
