import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);
    private router = inject(Router);

  loginForm!: FormGroup;
  isLoading = false;

  constructor(

  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/notifications']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showLoginSuccess();
          this.router.navigate(['/notifications']);
        } else {
          this.showLoginError(response.message || 'Credenciales inválidas');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.showTechnicalError('Ocurrió un error técnico al intentar conectar.');
        console.error('Error en el flujo de login', err);
      }
    });
  }

  private showLoginSuccess(): void{
    this.notificationService.show({
      title: '¡Bienvenido!',
      message: 'Sesión iniciada correctamente.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showLoginError(message: string): void {
    this.notificationService.show({
      title: 'Error',
      message: message,
      type: NotificationType.ERROR
    });
  }

  private showTechnicalError(message: string): void {
    this.notificationService.show({
      title: 'Error del Sistema',
      message: message,
      type: NotificationType.SECURITY
    });
  }
}
