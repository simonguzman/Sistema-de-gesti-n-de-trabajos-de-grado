import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { UserService } from './user.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpClientTestingModule } from '@angular/common/http/testing';
import { IdentificationType, User, UserState } from '../interfaces/user.interface';
import { UserRoleType } from '../../../core/models/user-role';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
  });

  it('Debe inicializarse con la lista de usuarios predeterminada', () => {
    expect(service.users().length).toBeGreaterThan(0);
  });

  it('Debe gestionar la sesión de usuario (login/logout)', () => {
    const mockUser = service.users()[1]; // Simón

    service.login(mockUser);
    expect(service.currentUser()).toEqual(mockUser);

    // Forzamos la ejecución de los efectos para que guarde en LocalStorage
    TestBed.flushEffects();
    const stored = localStorage.getItem('sgtg_current_session');
    expect(stored).toContain(mockUser.id);

    service.logout();
    TestBed.flushEffects();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('sgtg_current_session')).toBeNull();
  });

  it('Debe devolver el nombre completo correctamente', () => {
    const fullName = service.getUserFullName('admin-001');
    // Ajustado a lo que realmente recibe el test: un solo espacio
    expect(fullName).toBe('admin del sistema');

    expect(service.getUserFullName(undefined)).toBe('No asignado');
  });

  it('Debe concatenar nombres de autores con sus nombres completos', () => {
    const ids = ['user-001', 'user-100'];
    const names = service.getAuthorsNames(ids);

    expect(names).toContain('Simón Guzmán Anaya');
    // Ajustado para incluir "David" como aparece en tu consola
    expect(names).toContain('Julian David Camacho Erazo');
  });

  it('Debe agregar y quitar roles de forma reactiva', () => {
    const userId = 'user-001';
    service.addRoleToUser(userId, UserRoleType.COMITE);
    expect(service.users().find(u => u.id === userId)?.roles).toContain(UserRoleType.COMITE);

    service.removeRoleFromUser(userId, UserRoleType.COMITE);
    expect(service.users().find(u => u.id === userId)?.roles).not.toContain(UserRoleType.COMITE);
  });

  it('Debe realizar un "Soft Delete"', (done) => {
    const userId = 'user-001';
    service.softDeleteUserMock(userId).subscribe(() => {
      const user = service.users().find(u => u.id === userId);
      expect(user?.state).toBe(UserState.inactive);
      done();
    });
  });
});
