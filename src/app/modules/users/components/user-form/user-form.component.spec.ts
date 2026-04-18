/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFormComponent } from './user-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { IdentificationType, User } from '../../interfaces/user.interface';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  const mockNotificationService = {
    show: jest.fn()
  }

  beforeEach(async() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ UserFormComponent, ReactiveFormsModule ],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización  y validaciones del formulario', () => {
    it('Deberia inicializar el formulario como inválido (vacio)', () => {
      expect(component.userForm.invalid).toBeTruthy();
    })
    it('Deberia requerir los campos obligatorios', () => {
      const emailControl = component.userForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTruthy();
    })
    it('debería validar la longitud mínima de la contraseña', () => {
      const passwordControl = component.userForm.get('password');
      passwordControl?.setValue('12345'); // 5 caracteres
      expect(passwordControl?.hasError('minlength')).toBeTruthy();

      passwordControl?.setValue('123456'); // 6 caracteres
      expect(passwordControl?.hasError('minlength')).toBeFalsy();
    });
  });
  describe('Interacción con Inputs (Signals)', () => {
    it('debería popular el formulario si se pasa un usuario por input()', () => {
      const mockUser: Partial<User> = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@test.com',
        roles: [UserRoleType.ADMINISTRADOR]
      };

      // En Angular 17+, así se inyecta valor a un signal input() en pruebas
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      expect(component.userForm.get('firstName')?.value).toBe('Juan');
      expect(component.userForm.get('email')?.value).toBe('juan@test.com');
    });
  });

  describe('Lógica del Submit', () => {
    it('NO debería emitir onSubmit y DEBERÍA mostrar notificación si el form es inválido', () => {
      const emitSpy = jest.spyOn(component.onSubmit, 'emit');

      component.submit();

      expect(emitSpy).not.toHaveBeenCalled();
      expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Formulario incorrecto',
        type: NotificationType.ERROR
      }));
      // Verifica que los controles se marcaron como tocados para mostrar errores visuales
      expect(component.userForm.touched).toBeTruthy();
    });

    it('DEBERÍA emitir onSubmit si el formulario es válido', () => {
      const emitSpy = jest.spyOn(component.onSubmit, 'emit');

      // Llenamos el formulario con datos válidos
      component.userForm.patchValue({
        idType: 'CC' as IdentificationType,
        idNumber: 123456,
        firstName: 'Ana',
        lastName: 'Gómez',
        secondLastName: 'López',
        codeNumber: 9876,
        roles: [UserRoleType.ESTUDIANTE],
        email: 'ana@universidad.edu.co',
        password: 'password123'
      });

      component.submit();

      expect(component.userForm.valid).toBeTruthy();
      expect(emitSpy).toHaveBeenCalledWith(component.userForm.getRawValue() as User);
      expect(mockNotificationService.show).not.toHaveBeenCalled();
    });
  });

  describe('Gestión de Roles y Modal', () => {
    it('debería calcular correctamente el fullName para el modal', () => {
      component.userForm.patchValue({ firstName: 'Carlos', lastName: 'Ramírez' });
      expect(component.fullName).toBe('Carlos Ramírez');
    });

    it('debería devolver un string vacío en selectedRolesDisplay si no hay roles', () => {
      component.userForm.controls.roles.setValue([]);
      expect(component.selectedRolesDisplay).toBe('');
    });

    it('debería abrir el modal y preparar los roles actuales', () => {
      component.userForm.controls.roles.setValue([UserRoleType.DIRECTOR]);

      component.openRolesModal();

      expect(component.isRolesModalOpen).toBeTruthy();
      // Verifica que el rol de profesor quedó marcado como asignado
      const teacherRole = component.currentRolesForModal.find(r => r.type === UserRoleType.DIRECTOR);
      expect(teacherRole?.assigned).toBeTruthy();
    });

    it('debería guardar los roles actualizados desde el modal', () => {
      const mockUpdatedRoles = [
        { type: UserRoleType.ADMINISTRADOR, assigned: true, label: 'Admin' },
        { type: UserRoleType.ESTUDIANTE, assigned: false, label: 'Estudiante' }
      ];

      component.handleRolesSaved(mockUpdatedRoles);

      expect(component.isRolesModalOpen).toBeFalsy();
      expect(component.userForm.get('roles')?.value).toEqual([UserRoleType.ADMINISTRADOR]);
    });
  });
});
