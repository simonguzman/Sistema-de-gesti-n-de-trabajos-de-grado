/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>

  beforeEach(async() => {
    mockAuthService = {
      login: jest.fn(),
      logout: jest.fn(),
      isLoggedIn: jest.fn()
    } as unknown as jest.Mocked<AuthService>;

    mockRouter = {
      navigate: jest.fn()
    } as unknown as jest.Mocked<Router>;
    TestBed.configureTestingModule({
      imports: [ LoginComponent ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('El formulario debe ser inválido al inicio', () => {
    expect(component.loginForm.invalid).toBeTruthy();
  });

  it('Debe validar que el email sea obligatorio y tenga formato correcto', () => {
    const emailControl = component.loginForm.get('email');

    emailControl?.setValue('');
    expect(emailControl?.errors?.['required']).toBeTruthy();

    emailControl?.setValue('correo-no-valido');
    expect(emailControl?.errors?.['email']).toBeTruthy();

    emailControl?.setValue('usuario@unicauca.edu.co');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('Debe marcar los campos como "touched" cuando se intenta enviar un formulario inválido', () => {
    // Espiamos el método del formulario
    const spy = jest.spyOn(component.loginForm, 'markAllAsTouched');

    // Seteamos valores inválidos
    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();

    expect(spy).toHaveBeenCalled();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('El botón de inicio de sesión debe estar deshabilitado si el formulario es inválido', () => {
    // 1. Forzamos el estado inválido
    component.loginForm.setValue({ email: '', password: '' });
    fixture.detectChanges();

    // 2. Buscamos el componente hijo directamente por su clase (Directiva)
    const buttonDebugElement = fixture.debugElement.query(By.directive(ButtonComponent));
    const buttonInstance = buttonDebugElement.componentInstance as ButtonComponent;

    // 3. Verificamos la propiedad @Input() 'disabled' del componente
    expect(buttonInstance.disabled).toBe(true);
  });

  it('El botón debe habilitarse cuando el formulario es válido', () => {
    // Test extra para asegurar el flujo completo
    component.loginForm.setValue({
      email: 'estudiante@unicauca.edu.co',
      password: 'password123'
    });
    fixture.detectChanges();

    const buttonDebugElement = fixture.debugElement.query(By.directive(ButtonComponent));
    const buttonInstance = buttonDebugElement.componentInstance as ButtonComponent;

    expect(buttonInstance.disabled).toBe(false);
  });

  it('Debe llamar a authService.login y navegar al tener éxito', () => {
    const loginData = { email: 'test@unicauca.edu.co', password: 'password123' };

    // Ahora tienes tipado estricto en el mockReturnValue
    mockAuthService.login.mockReturnValue(of({ token: 'fake-token' }));

    component.loginForm.setValue(loginData);
    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('Debe manejar el error si el login falla', () => {
    // spyOn tipado automáticamente
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    mockAuthService.login.mockReturnValue(throwError(() => new Error('Invalid')));

    component.loginForm.setValue({ email: 'test@unicauca.edu.co', password: 'password123' });
    component.onSubmit();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
