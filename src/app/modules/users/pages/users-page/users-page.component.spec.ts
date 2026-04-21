import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersPageComponent } from './users-page.component';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { IdentificationType, User, UserState } from '../../interfaces/user.interface';
import { signal } from '@angular/core';
import { UserRoleType } from '../../../../core/models/user-role';
import { of } from 'rxjs';

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
        codeNumber: 101,
        state: UserState.active
      }
    ]),
    softDeleteUserMock: jest.fn().mockReturnValue(of(undefined)),
    updateUserRolesMock: jest.fn().mockReturnValue(of(undefined))
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
  });

  describe('Acciones de la Tabla', () => {
    it('debería abrir el modal de roles con la información correcta', () => {
      const event = {
        action: 'ver roles asignados',
        row: {
          nombre: 'Juan',
          apellidos: 'Perez Soto',
          // Aseguramos que la info esté tanto en la raíz como en originalData
          originalData: {
            id: '1',
            firstName: 'Juan',
            lastName: 'Perez',
            roles: [UserRoleType.DIRECTOR]
          }
        }
      };

      component.handleTableAction(event);

      expect(component.showRolesModal).toBe(true);
      // Validamos que el nombre se haya concatenado correctamente
      expect(component.selectedUser).toContain('Juan');

      const directorRole = component.rolesUser.find(role => role.type === UserRoleType.DIRECTOR);
      expect(directorRole?.assigned).toBe(true);
    });

    it('debería navegar a la ruta de creación al presionar el botón del header', () => {
      component.handleHeaderButton({ label: 'Crear usuarios', variant: 'primary' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/crear']);
    });
  });

  describe('Flujo de Confirmación de Roles', () => {
    it('debería cerrar modal de roles y abrir confirmación al guardar roles', () => {
      const newRoles = [{ type: UserRoleType.ADMINISTRADOR, assigned: true }];

      component.handleSaveRoles(newRoles);

      expect(component.showRolesModal).toBe(false);
      expect(component.showConfirmation).toBe(true);
    });

    it('debería aplicar los cambios finales al confirmar', () => {
      const pendingRoles = [{ type: UserRoleType.DIRECTOR, assigned: true }];
      // @ts-ignore - Accediendo a propiedad privada para el test
      component.pendingRoles = pendingRoles;

      component.idUserForRoles = '1';

      component.confirmChanges();

      expect(mockUserService.updateUserRolesMock).toHaveBeenCalled();
      expect(component.showConfirmation).toBe(false);
    });
  });
  it('debería navegar a la página de edición con el ID correcto', () => {
    const event = {
      action: 'editar',
      row: {
        originalData: { id: 'user-123' }
      }
    };

    component.handleTableAction(event);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/editar', 'user-123']);
  });
  it('debería ejecutar la lógica de eliminación con el ID correcto', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const event = {
      action: 'eliminar',
      row: {
        nombre: 'Test',
        estado: 'Activo',
        originalData: { id: '999' }
      }
    };

    component.handleTableAction(event);

    // Verificamos que console.log haya recibido "Data de la fila:" seguido de un objeto que contenga el ID
    expect(consoleSpy).toHaveBeenCalledWith(
      'Data de la fila:',
      expect.objectContaining({ originalData: expect.objectContaining({ id: '999' }) })
    );
  });
  it('debería limpiar los cambios pendientes si se cancela la confirmación', () => {
    const originalRoles = [...component.rolesUser];
    // @ts-ignore
    component.pendingRoles = [{ type: UserRoleType.DIRECTOR, assigned: true }];

    component.showConfirmation = false; // Simulamos cerrar sin confirmar

    // @ts-ignore
    expect(component.rolesUser).toEqual(originalRoles);
  });
  it('debería llamar al servicio al confirmar cambios de roles', () => {
      // Usamos el mismo nombre de variable que te funcionó en el test anterior
      // @ts-ignore
      component.idUserForRoles = '1';
      // @ts-ignore
      component.pendingRoles = [{ type: UserRoleType.DIRECTOR, assigned: true }];

      component.confirmChanges();

      expect(mockUserService.updateUserRolesMock).toHaveBeenCalled();
      expect(component.showConfirmation).toBe(false);
  });

  it('debería ejecutar la lógica de Soft Delete correctamente', () => {
    // 1. Simulamos que se seleccionó un usuario para eliminar
    component.idUserToDisabled = '123';

    // 2. Ejecutamos la confirmación
    component.confirmSoftDelete();

    // 3. Verificamos que se llamó al servicio y se limpió el estado
    expect(mockUserService.softDeleteUserMock).toHaveBeenCalledWith('123');
    expect(component.showDisabledConfirmation).toBe(false);
    expect(component.idUserToDisabled).toBeNull();
  });

  it('debería configurar el mensaje de confirmación correcto según el estado (Habilitar/Deshabilitar)', () => {
    const eventEliminar = {
      action: 'eliminar',
      row: { nombre: 'Juan', apellidos: 'Perez', estado: 'Activo', originalData: { id: '1' } }
    };

    component.handleTableAction(eventEliminar);
    expect(component.confirmationMessage).toContain('¿Desea deshabilitar al usuario');

    const eventHabilitar = {
      action: 'eliminar',
      row: { nombre: 'Juan', apellidos: 'Perez', estado: 'Inactivo', originalData: { id: '1' } }
    };

    component.handleTableAction(eventHabilitar);
    expect(component.confirmationMessage).toContain('¿Desea habilitar nuevamente');
  });
});
