import { Component, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentificationType, User } from '../../interfaces/user.interface';
import { UserRole, UserRoleType } from '../../../../core/models/user-role';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { RolesSelectionModalComponent } from '../../../../shared/components/modals/roles/roles-selection-modal/roles-selection-modal.component';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, ButtonComponent, RolesSelectionModalComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent  {
  fb = inject(FormBuilder);
  protected notificationService = inject(NotificationService);

  isRolesModalOpen = false;
  currentRolesForModal: UserRole[] = [];
  selectOpen = false;

  user = input<User | null>(null);
  @Output() onSubmit = new EventEmitter <User>();

  roles = Object.values(UserRoleType).map(role => ({
    label: role,
    value: role
  }));

  userForm = this.fb.group({
    idType: ['' as IdentificationType | null, [Validators.required]],
    idNumber: [null as number | null, [Validators.required, Validators.min(0)]],
    firstName: ['', [Validators.required]],
    secondName: [''],
    lastName: ['', [Validators.required]],
    secondLastName: ['', [Validators.required]],
    codeNumber: [null as number | null , [Validators.required, Validators.min(0)]],
    roles: new FormControl<UserRoleType[]>([], {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)]
    }),
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]]
  })

  constructor() {
    effect(() => {
      const userData = this.user();
      const passwordControl = this.userForm.get('password');
      if(userData){
        this.userForm.patchValue(userData);
        passwordControl?.setValidators([Validators.minLength(6)]);
      } else {
        this.userForm.reset();
        passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
      }
      passwordControl?.updateValueAndValidity();
    });
  }

  get IsEditMode(): boolean {
    return !!this.user();
  }

  submit() {
    if(this.userForm.invalid){
      this.userForm.markAllAsTouched();
      this.notificationService.show({
        title: 'Formulario incorrecto',
        message: 'Por favor, diligencie correctamente todos los campos obligatorios.',
        type: NotificationType.ERROR
      });
      return;
    }
    const formData = this.userForm.getRawValue() as User;
    this.onSubmit.emit(formData);
  }
  // Calculamos el nombre completo para el título del modal
  get fullName(): string {
    const { firstName, lastName } = this.userForm.value;
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Usuario';
  }

  // Helper para mostrar los roles seleccionados en la casilla
  get selectedRolesDisplay(): string {
    return this.userForm.controls.roles.value?.join(', ') || '';
  }

  openRolesModal() {
    // 1. Obtenemos los roles que ya están en el form (si existen)
    const selectedTypes: UserRoleType[] = this.userForm.get('roles')?.value || [];

    // 2. Mapeamos todos los posibles roles con su estado actual
    this.currentRolesForModal = Object.values(UserRoleType).map(type => ({
      type: type,
      assigned: selectedTypes.includes(type)
    }));

    // 3. Abrimos el modal
    this.isRolesModalOpen = true;
  }

  handleRolesSaved(updatedRoles: UserRole[]) {
    // 1. Guardamos la estructura completa localmente por si reabren el modal
    this.currentRolesForModal = updatedRoles;

    // 2. Filtramos solo los nombres de los roles activos para el FormControl
    const activeTypes = updatedRoles
      .filter(r => r.assigned)
      .map(r => r.type);

    this.userForm.get('roles')?.setValue(activeTypes);

    // 3. Cerramos
    this.isRolesModalOpen = false;
  }
}
