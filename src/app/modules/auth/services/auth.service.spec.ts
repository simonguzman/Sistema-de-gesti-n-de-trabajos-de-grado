/* tslint:disable:no-unused-variable */

import { TestBed, fakeAsync, inject, tick } from '@angular/core/testing';
import { AuthService, ChangePasswordResponse } from './auth.service';

describe('Service: Auth', () => {
  let service: AuthService;
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('Debe ser creado', () => {
    expect(service).toBeTruthy();
  });
  it('Debe iniciar con estado false si no existe un token en el storage', (done) => {
    service.isLoggedIn().subscribe(status => {
      expect(status).toBeFalsy();
      done();
    });
  });
  it('Debe iniciar con estado true si ya existe un token al cargar el servicio', () => {
    localStorage.setItem('auth_token', 'token-previo');
    const serviceWithToken = new AuthService();
    serviceWithToken.isLoggedIn().subscribe(status => {
      expect(status).toBeTruthy();
    });
  });
  it('Debe realizar el login, guardar el token y actualizar el estado', fakeAsync(() => {
    const credentials = { email: 'siguzman@unicauca.edu.co', password: '1234567'};
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    let result: any;
    service.login(credentials).subscribe(res => result = res);
    tick(1000);
    expect(result.token).toBe('fake-jwt-token-12345');
    expect(setItemSpy).toHaveBeenCalledWith('auth_token','fake-jwt-token-12345');
    service.isLoggedIn().subscribe(status => {
      expect(status).toBeTruthy();
    });
  }));
  it('Debe eliminar el token y actualizar el estado al cerrar sesión', () => {
    localStorage.setItem('auth_token', 'token_activo');
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    service.logout();
    expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
    expect(localStorage.getItem('auth_token')).toBeNull();
    service.isLoggedIn().subscribe(status => {
      expect(status).toBeFalsy();
    });
  });
  describe('changePassword', () => {
    it('debe retornar una respuesta exitosa después del delay simulado', fakeAsync(() => {
      let response: ChangePasswordResponse | undefined;
      const currentPass = 'oldPassword123';
      const newPass = 'newPassword456';

      service.changePassword(currentPass, newPass).subscribe(res => {
        response = res;
      });

      // El servicio tiene un delay(1500)
      tick(1500);

      expect(response).toBeDefined();
      expect(response?.success).toBeTruthy();
      expect(response?.message).toContain('actualizada correctamente');
    }));

    it('debe imprimir en consola al completar la simulación (uso de tap)', fakeAsync(() => {
      const consoleSpy = jest.spyOn(console, 'log');

      service.changePassword('a', 'b').subscribe();
      tick(1500);

      expect(consoleSpy).toHaveBeenCalledWith('Petición de cambio de contraseña exitosa simulada');
    }));
  });
});
