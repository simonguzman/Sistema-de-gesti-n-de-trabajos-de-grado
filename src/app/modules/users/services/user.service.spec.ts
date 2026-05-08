import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { UserService } from './user.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IdentificationType, User, UserState } from '../interfaces/user.interface';
import { UserRoleType } from '../../../core/models/user-role';

describe('Service: User', () => {
  let service: UserService;

  const mockUser: User = {
    id: 'temp-id',
    idType: IdentificationType.CC,
    idNumber: 12345,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    roles: [UserRoleType.ADMINISTRADOR],
    password: 'password123',
    secondLastName: 'Test',
    codeNumber: 101,
    state: UserState.active
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(UserService);

    // MAGIA AQUÍ: Forzamos que el effect() inicial del constructor se ejecute
    // Esto asegura que 'Simón' se guarde en localStorage antes de que empiece cualquier test.
    TestBed.flushEffects();
  });

  it('debería crearse correctamente con el usuario inicial', () => {
    expect(service).toBeTruthy();
    expect(service.users().length).toBe(1);
    expect(service.users()[0].firstName).toBe('Simón');
  });

  describe('Métodos Mock (Signals & Persistence)', () => {

    it('debería agregar el usuario al signal y persistirlo en LocalStorage', fakeAsync(() => {
      service.createUserMock(mockUser).subscribe();

      tick(1000);

      // MAGIA AQUÍ: Obligamos a Angular a ejecutar el effect() después de que el signal cambió
      TestBed.flushEffects();

      const currentUsers = service.users();
      expect(currentUsers.length).toBe(2);
      expect(currentUsers.find(u => u.email === mockUser.email)).toBeDefined();

      const storedData = localStorage.getItem('sgtg_users');
      expect(storedData).not.toBeNull();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData.length).toBe(2);
      expect(parsedData[1].email).toBe(mockUser.email);
    }));

    it('debería actualizar los roles de un usuario y reflejarlo en storage', fakeAsync(() => {
      const newRoles = [UserRoleType.EVALUADOR];

      service.updateUserRolesMock('user-001', newRoles).subscribe();

      tick(500);
      TestBed.flushEffects(); // Forzamos el effect()

      const user = service.users().find(u => u.id === 'user-001');
      expect(user?.roles).toEqual(newRoles);

      const stored = JSON.parse(localStorage.getItem('sgtg_users') || '[]');
      // Ahora stored[0] sí existirá porque el beforeEach guardó a Simón correctamente
      expect(stored[0].roles).toEqual(newRoles);
    }));

    it('debería alternar el estado en el soft delete', fakeAsync(() => {
      service.softDeleteUserMock('user-001').subscribe();

      tick(800);
      TestBed.flushEffects(); // Forzamos el effect()

      expect(service.users()[0].state).toBe(UserState.inactive);

      service.softDeleteUserMock('user-001').subscribe();

      tick(800);
      TestBed.flushEffects(); // Forzamos el effect()

      expect(service.users()[0].state).toBe(UserState.active);
    }));

    it('debería recuperar un usuario por ID', fakeAsync(() => {
      let foundUser: User | undefined;

      service.getUserByIdMock('user-001').subscribe(user => {
        foundUser = user;
      });

      tick(500);
      expect(foundUser).toBeDefined();
      expect(foundUser?.firstName).toBe('Simón');
    }));
  });
});
