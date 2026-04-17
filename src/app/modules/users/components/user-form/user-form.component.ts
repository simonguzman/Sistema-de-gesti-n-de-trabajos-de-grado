import { Component, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentificationType, User } from '../../interfaces/user.interface';
import { UserRole, UserRoleType } from '../../../../core/models/user-role';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { RolesSelectionModalComponent } from '../../../../shared/components/modals/roles/roles-selection-modal/roles-selection-modal.component';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, ButtonComponent, RolesSelectionModalComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent  {
  fb = inject(FormBuilder);

  isRolesModalOpen = false;
  currentRolesForModal: UserRole[] = [];
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
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  constructor() {
    const user = this.user();
    if (user) {
      this.userForm.patchValue(user);

      this.currentRolesForModal = Object.values(UserRoleType).map(type => ({
        type,
        assigned: user.roles.includes(type)
      }));
    }
  }

  submit() {
    if(this.userForm.invalid){
      this.userForm.markAllAsTouched();
      return;
    }
    this.onSubmit.emit(this.userForm.getRawValue() as User);
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
