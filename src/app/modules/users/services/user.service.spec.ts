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

  beforeEach(async() => {
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
  })

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Métodos Reales (HTTP)', () => {
    it('debería enviar una petición POST al crear un usuario', () => {
      service.createUser(mockUser).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      // Validamos la URL y el método
      const req = httpMock.expectOne('https://api-sgtg-placeholder.com/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockUser);

      // Respondemos con el mock para cerrar el observable
      req.flush(mockUser);
    });
  });

  describe('Métodos Mock (Signals & Logic)', () => {
    it('debería agregar el usuario al signal usersList al usar createUserMock', (done) => {
      // Al ser un observable con delay, usamos done() para manejar la asincronía
      service.createUserMock(mockUser).subscribe(() => {
        const currentUsers = service.users();
        expect(currentUsers).toContain(mockUser);
        expect(currentUsers.length).toBe(1);
        done();
      });
    });

    it('debería mantener la inmutabilidad al actualizar el signal', (done) => {
      const secondUser = { ...mockUser, id: '456', firstName: 'Otro' };

      service.createUserMock(mockUser).subscribe(() => {
        service.createUserMock(secondUser).subscribe(() => {
          const list = service.users();
          expect(list.length).toBe(2);
          expect(list[0]).toEqual(mockUser);
          expect(list[1]).toEqual(secondUser);
          done();
        });
      });
    });
  });
});
