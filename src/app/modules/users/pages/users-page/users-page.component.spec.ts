import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersPageComponent } from './users-page.component';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { IdentificationType, User } from '../../interfaces/user.interface';
import { signal } from '@angular/core';
import { UserRoleType } from '../../../../core/models/user-role';

describe('UserPageComponent', () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;

  // Mocks de servicios
  const mockUserService = {
    // Simulamos el signal de usuarios
    users: signal<User[]>([
      {
        id: '1',
        idNumber: 12345,
        firstName: 'Juan',
        lastName: 'Perez',
        secondLastName: 'Soto',
        email: 'juan@test.com',
        roles: [UserRoleType.DIRECTOR],
        password: '123',
        idType: 'CC' as IdentificationType,
        codeNumber: 101
      }
    ])
  };

  const mockRouter = {
    navigate: jest.fn()
  };

  beforeEach(async() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ UsersPageComponent ],
      providers: [
        { provide: UserService, useValue: mockUserService},
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Mapeo de Datos y Signals', () => {
    it('debería transformar los datos del signal al formato de la tabla', () => {
      // Accedemos al computed usersTableData
      const tableData = component.usersTableData();

      expect(tableData.length).toBe(1);
      expect(tableData[0].identificacion).toBe('12345');
      expect(tableData[0].nombre).toBe('Juan');
      expect(tableData[0].apellidos).toBe('Perez Soto');
    });

    it('debería combinar testValue con los datos del signal en displayValue', () => {
      const display = component.displayValue;
      // 1 de testValue (hardcoded) + 1 del mockUserService
      expect(display.length).toBe(2);
    });
  });

  describe('Acciones de la Tabla', () => {
    it('debería abrir el modal de roles con la información correcta', () => {
      const event = {
        action: 'ver roles asignados',
        row: {
          nombre: 'Juan',
          apellidos: 'Perez',
          originalData: { roles: [UserRoleType.DIRECTOR] }
        }
      };

      component.handleTableAction(event);

      expect(component.mostrarModalRoles).toBe(true);
      expect(component.usuarioSeleccionado).toBe('Juan Perez');

      // Verificar que el rol DIRECTOR esté asignado en el objeto de rolesUsuario
      const directorRole = component.rolesUsuario.find(r => r.type === UserRoleType.DIRECTOR);
      expect(directorRole?.assigned).toBe(true);
    });

    it('debería navegar a la ruta de creación al presionar el botón del header', () => {
      component.handleHeaderButton({ label: 'Crear usuarios', variant: 'primary' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/crear']);
    });
  });

  describe('Flujo de Confirmación de Roles', () => {
    it('debería cerrar modal de roles y abrir confirmación al guardar roles', () => {
      const nuevosRoles = [{ type: UserRoleType.ADMINISTRADOR, assigned: true }];

      component.handleSaveRoles(nuevosRoles);

      expect(component.mostrarModalRoles).toBe(false);
      expect(component.mostrarConfirmacion).toBe(true);
    });

    it('debería aplicar los cambios finales al confirmar', () => {
      const rolesPendientes = [{ type: UserRoleType.DIRECTOR, assigned: true }];
      // @ts-ignore - Accediendo a propiedad privada para el test
      component.rolesPendientes = rolesPendientes;

      component.confirmarCambios();

      expect(component.rolesUsuario).toEqual(rolesPendientes);
      expect(component.mostrarConfirmacion).toBe(false);
    });
  });
});
