import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordModalComponent } from './change-password-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../modules/auth/services/auth.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChangePasswordModalComponent', () => {
  let component: ChangePasswordModalComponent;
  let fixture: ComponentFixture<ChangePasswordModalComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    // Creamos un mock del servicio para no depender de la API real
    authServiceMock = {
      changePassword: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordModalComponent, // Importamos como standalone
        ReactiveFormsModule,
        NoopAnimationsModule // Necesario para componentes de PrimeNG (diálogos)
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el formulario como inválido', () => {
    expect(component.passwordForm.valid).toBeFalsy();
  });

  describe('Validaciones de contraseña', () => {
    it('debe validar que la contraseña nueva tenga al menos 8 caracteres', () => {
      const newPwdControl = component.passwordForm.get('newPassword');
      newPwdControl?.setValue('123');
      expect(newPwdControl?.hasError('minlength')).toBeTruthy();

      newPwdControl?.setValue('12345678');
      expect(newPwdControl?.hasError('minlength')).toBeFalsy();
    });

    it('debe detectar cuando las contraseñas no coinciden (passwordMatchValidator)', () => {
      component.passwordForm.patchValue({
        newPassword: 'password123',
        confirmPassword: 'password456'
      });

      expect(component.passwordForm.hasError('passwordMismatch')).toBeTruthy();
    });

    it('debe ser válido cuando las contraseñas coinciden y cumplen requisitos', () => {
      component.passwordForm.patchValue({
        currentPassword: 'current_pass',
        newPassword: 'new_password_8',
        confirmPassword: 'new_password_8'
      });

      expect(component.passwordForm.valid).toBeTruthy();
    });
  });

  describe('Interacciones y visibilidad', () => {
    it('debe alternar la visibilidad de la contraseña', () => {
      expect(component.showCurrentPassword).toBeFalsy();
      component.togglePasswordVisibility('current');
      expect(component.showCurrentPassword).toBeTruthy();
    });

    it('debe abrir el modal de confirmación al intentar guardar con datos válidos', () => {
      component.passwordForm.patchValue({
        currentPassword: 'valid',
        newPassword: 'valid_password',
        confirmPassword: 'valid_password'
      });

      component.onAttemptSave();
      expect(component.isConfirmActionOpen).toBeTruthy();
    });
  });

  describe('Envío de datos', () => {
    it('debe llamar al servicio changePassword cuando se confirme el cambio', () => {
      // Configuramos el mock para devolver un éxito
      authServiceMock.changePassword.mockReturnValue(of({ success: true }));
      const closeSpy = jest.spyOn(component, 'closeModal');

      component.passwordForm.patchValue({
        currentPassword: 'old',
        newPassword: 'new_password_long',
        confirmPassword: 'new_password_long'
      });

      component.confirmChange();

      expect(authServiceMock.changePassword).toHaveBeenCalledWith('old', 'new_password_long');
      expect(component.isLoading).toBeFalsy();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('debe manejar errores del servicio', () => {
      authServiceMock.changePassword.mockReturnValue(throwError(() => new Error('Error')));

      component.confirmChange();

      expect(component.isLoading).toBeFalsy();
      expect(component.isConfirmActionOpen).toBeFalsy();
    });
  });

  it('debe resetear el formulario y emitir onClose al cerrar el modal', () => {
    const emitSpy = jest.spyOn(component.onClose, 'emit');
    component.passwordForm.get('currentPassword')?.setValue('algo');

    component.closeModal();

    expect(component.passwordForm.get('currentPassword')?.value).toBeNull();
    expect(emitSpy).toHaveBeenCalled();
  });
});
