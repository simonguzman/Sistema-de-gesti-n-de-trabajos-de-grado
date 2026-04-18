import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IdentificationType, User } from '../interfaces/user.interface';
import { UserRoleType } from '../../../core/models/user-role';

describe('Service: User', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: '123',
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Métodos Reales (HTTP)', () => {
    it('debería enviar una petición POST al crear un usuario', () => {
      service.createUser(mockUser).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('https://api-sgtg-placeholder.com/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockUser);
      req.flush(mockUser);
    });
  });

  describe('Métodos Mock (Signals & Logic)', () => {
    it('debería agregar el usuario al signal usersList al usar createUserMock', (done) => {
      service.createUserMock(mockUser).subscribe(() => {
        const currentUsers = service.users();

        // CAMBIO: No usamos toContain(mockUser) porque el ID será diferente.
        // Verificamos propiedades que sabemos que no cambian.
        expect(currentUsers.length).toBe(1);
        expect(currentUsers[0].email).toBe(mockUser.email);
        expect(currentUsers[0].id).toBeDefined();
        expect(currentUsers[0].id).not.toBe(mockUser.id); // Validamos que se generó uno nuevo
        done();
      });
    });

    it('debería mantener la inmutabilidad al actualizar el signal', (done) => {
      // CAMBIO: Quitamos el ID de aquí para ser consistentes con la lógica de generación
      const secondUserData = { ...mockUser, email: 'otro@user.com', firstName: 'Otro' };

      service.createUserMock(mockUser).subscribe(() => {
        service.createUserMock(secondUserData).subscribe(() => {
          const list = service.users();
          expect(list.length).toBe(2);

          // CAMBIO: Comparamos por propiedades estáticas (email), no el objeto completo
          expect(list[0].email).toBe(mockUser.email);
          expect(list[1].email).toBe(secondUserData.email);
          done();
        });
      });
    });
  });
});
