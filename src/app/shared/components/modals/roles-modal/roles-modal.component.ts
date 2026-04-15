import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonComponent } from '../../button-component/button-component.component';

export enum UserRoleType {
  DIRECTOR = 'Director',
  ESTUDIANTE = 'Estudiante',
  CODIRECTOR = 'Codirector',
  ASESOR = 'Asesor',
  JEFE_DEP = 'Jefe de departamento',
  COMITE = 'Comité del programa',
  EVALUADOR = 'Evaluador',
  CONSEJO = 'Consejo de facultad',
  JURADO = 'Jurado'
}
export interface UserRole {
  type: UserRoleType;
  assigned: boolean;
}

@Component({
  selector: 'app-roles-modal',
  imports: [DialogModule, CommonModule, ButtonComponent],
  templateUrl: './roles-modal.component.html',
  styleUrls: ['./roles-modal.component.css']
})
export class RolesModalComponent {

  protected readonly RoleType = UserRoleType;

  @Input() isOpen: boolean = false;
  @Input() username: string = '';
  @Input() roles: UserRole[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<UserRole[]>();

  isEditing: boolean = false
  editableRoles: UserRole[] = [];

  ngOnChanges(changes: SimpleChanges ): void{
    if(changes['isOpen'] && this.isOpen){
      this.isEditing = false;
      this.initializeRoles();
    }
  }

  initializeRoles(){
    if(!this.roles || this.roles.length === 0){
      this.editableRoles = Object.values(UserRoleType).map(role => ({
        type: role,
        assigned: false
      }));
    } else {
      this.editableRoles = this.roles.map(role => ({...role}));
    }
  }

  toggleRole(role: UserRole){
    role.assigned = !role.assigned
  }

  closeModal(){
    this.isEditing = false; // Resetear SIEMPRE al cerrar
    this.isOpen = false;
    this.initializeRoles();
    this.isOpenChange.emit(false); // Avisar que se cerró
    this.onClose.emit();
  }

  toggleMode() {
    if(this.isEditing){
      this.initializeRoles();
    }
    this.isEditing = !this.isEditing;
  }

  saveRoles(){
    const rolesToSave = this.editableRoles.map(role => ({...role}));
    this.onSave.emit(rolesToSave);
    this.isEditing = false;
  }

  discargChanges(){
    this.initializeRoles();
  }
}
