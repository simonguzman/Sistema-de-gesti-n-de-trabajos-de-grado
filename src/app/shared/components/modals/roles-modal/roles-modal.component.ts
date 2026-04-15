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
export class RolesModalComponent implements OnChanges {

  @Input() isOpen: boolean = false;
  @Input() username: string = '';
  @Input() roles: UserRole[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<UserRole[]>();

  isEditing = false;
  draftRoles: UserRole[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetDraft();
      this.isEditing = false;
    }
  }

  // 🔹 COPIA LIMPIA SIEMPRE
  private resetDraft() {
    this.draftRoles = this.roles.map(r => ({ ...r }));
  }

  // 🔹 ENTRAR EN EDICIÓN
  startEdit() {
    this.resetDraft();
    this.isEditing = true;
  }

  // 🔹 CANCELAR (NO GUARDA NADA)
  cancelEdit() {
    this.resetDraft();
    this.isEditing = false;
  }

  // 🔹 TOGGLE SOLO EN DRAFT
  toggleRole(role: UserRole) {
    role.assigned = !role.assigned;
  }

  // 🔹 GUARDAR (ÚNICO PUNTO DE MUTACIÓN REAL)
  save() {
    this.onSave.emit(this.draftRoles.map(r => ({ ...r })));
    this.isEditing = false;
  }

  close() {
    this.isEditing = false;
    this.onClose.emit();
  }
}
