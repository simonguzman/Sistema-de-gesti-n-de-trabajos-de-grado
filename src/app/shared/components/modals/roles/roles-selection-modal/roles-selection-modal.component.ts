import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { UserRole, UserRoleType } from '../../../../../core/models/user-role';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../button-component/button-component.component';

@Component({
  selector: 'app-roles-selection-modal',
  imports: [DialogModule, CommonModule, ButtonComponent],
  templateUrl: './roles-selection-modal.component.html',
  styleUrls: ['./roles-selection-modal.component.css']
})
export class RolesSelectionModalComponent implements OnChanges {

  @Input() isOpen: boolean = false;
  @Input() roles: UserRole[] = [];

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<UserRole[]>();

  editableRoles: UserRole[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.initializeRoles();
    }
  }

  initializeRoles() {
    // Si no hay roles previos, cargamos todos los disponibles del Enum
    if (!this.roles || this.roles.length === 0) {
      this.editableRoles = Object.values(UserRoleType).map(role => ({
        type: role,
        assigned: false
      }));
    } else {
      this.editableRoles = this.roles.map(role => ({ ...role }));
    }
  }

  toggleRole(role: UserRole) {
    role.assigned = !role.assigned;
  }

  save() {
    this.onSave.emit(this.editableRoles);
    this.isOpenChange.emit(false);
  }

  close() {
    this.isOpenChange.emit(false);
  }

}
