import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  // Añadimos una variable para manejar errores de autenticación en la UI
  loginError: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si ya hay sesión activa, lo mandamos directo al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/notifications']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = null;

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => { // 1. Ahora recibimos un objeto { success, message }
          this.isLoading = false;

          if (response.success) {
            console.log('Login exitoso');
            this.router.navigate(['/notifications']);
          } else {
            // 2. LÓGICA CLAVE: Ya no hardcodeamos el mensaje.
            // El servicio es ahora la "fuente de verdad" del motivo del fallo.
            this.loginError = response.message || 'Error de autenticación';
            console.error('Acceso denegado:', response.message);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.loginError = 'Ocurrió un error técnico al intentar conectar.';
          console.error('Error en el flujo de login', err);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
