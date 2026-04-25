import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonComponent } from '../../button-component/button-component.component';
import { AuthService } from '../../../../modules/auth/services/auth.service';
import { ConfirmationActionModalComponent } from "../confirmation-action-modal/confirmation-action-modal.component";

export const passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    // Si no coinciden, asignamos el error al formGroup
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  selector: 'app-change-password-modal',
  imports: [DialogModule, CommonModule, ReactiveFormsModule, ButtonComponent, ConfirmationActionModalComponent],
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent {

  @Input() isOpen: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = false;
  isConfirmActionOpen = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  closeModal() {
    this.passwordForm.reset();
    this.onClose.emit();
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
    if (field === 'new') this.showNewPassword = !this.showNewPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Paso 1: El usuario da clic en "Confirmar" en el formulario
  onAttemptSave() {
    if (this.passwordForm.valid) {
      this.isConfirmActionOpen = true;
    }
  }

  // Paso 2: El usuario confirma en el modal de advertencia
  confirmChange() {
    this.isConfirmActionOpen = false;
    this.isLoading = true;

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.closeModal();
      },
      error: () => this.isLoading = false
    });
  }

}
