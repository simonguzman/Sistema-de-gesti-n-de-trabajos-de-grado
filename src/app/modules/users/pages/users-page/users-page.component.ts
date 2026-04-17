import { Component, computed, inject } from '@angular/core';
import { TableComponent, Column, TableButton } from "../../../../shared/components/table-component/table-component.component";
import { stateList } from '../../../../shared/components/state/state.component';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

// Importación del nuevo modal y sus modelos de roles
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';
import { UserRole, UserRoleType } from '../../../../core/models/user-role';
import { Router } from '@angular/router';
import { RolesModalComponent } from '../../../../shared/components/modals/roles/roles-modal/roles-modal.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    TableComponent,
    FileUploadModalComponent,
    ButtonComponent,
    RolesModalComponent,
    ConfirmationActionModalComponent
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
})
export class UsersPageComponent {
  // Exponemos los Enums y tipos protegidos para el template
  userService = inject(UserService);
  protected stateList = stateList;
  private router = inject(Router);

  // 1. Columnas de la tabla
  testColumns: Column[] = [
    { field: 'identificacion', header: 'Identificación', type: 'text', width: '15%' },
    { field: 'nombre', header: 'Nombre', type: 'text', width: '15%'},
    { field: 'apellidos', header: 'Apellidos', type: 'text', width: '15%'},
    { field: 'estado', header: 'Estado', type: 'text', width: '15%'},
    {
      field: 'roles',
      header: 'Descripción',
      type: 'actions',
      actions: [
        { action: 'ver roles asignados', label: 'Ver roles asignados', variant: 'primary' }
      ],
      width: '20%'
    },
    {
      field: 'acciones',
      header: 'Acciones',
      type: 'actions',
      actions: [
        { action: 'ver',    icon: 'visibility', variant: 'primary' },
        { action: 'editar',  icon: 'edit', variant: 'primary' },
        { action: 'eliminar', icon: 'delete', variant: 'primary' }
      ],
      width: '20%'
    },
  ];

  // 2. Valores de prueba para la tabla
  testValue: any[] = [{
    identificacion: '1002819781',
    nombre: 'Simón',
    apellidos: 'Guzmán Anaya',
    estado: 'Activo',
    originalData: {
      roles: [UserRoleType.DIRECTOR]
    }
  }];

  usersTableData = computed(() => {
    return this.userService.users().map(user => ({
      identificacion: user.idNumber?.toString() || '',
      nombre: user.firstName,
      apellidos: `${user.lastName} ${user.secondLastName || ''}`,
      estado: 'Activo', // Valor por defecto
      // Guardamos el objeto original por si necesitas editar o ver roles luego
      originalData: user
    }));
  });

  get displayValue() {
    return [...this.testValue, ...this.usersTableData()];
  }

  // 3. Variables de control para el Modal de Roles
  mostrarModalRoles = false;
  mostrarConfirmacion = false;
  usuarioSeleccionado = '';

  // Inicializamos los roles usando el Enum centralizado
  rolesUsuario: UserRole[] = [];

  // NUEVA VARIABLE: Para guardar los cambios antes de la confirmación final
  private rolesPendientes: UserRole[] = [];

  // 4. Variables para otros modales
  isModalOpen = false;

  /**
   * Maneja las acciones emitidas por la tabla
   */
  handleTableAction(event: { action: string, row: any }) {
    if (event.action === 'ver roles asignados') {
      this.usuarioSeleccionado = `${event.row.nombre} ${event.row.apellidos}`;
      if(event.row.originalData){
        const userRolesTypes = event.row.originalData.roles as UserRoleType[];
        this.rolesUsuario = Object.values(UserRoleType).map(type => ({
          type: type,
          assigned: userRolesTypes.includes(type)
        }));
      }
      this.mostrarModalRoles = true;
    }
    // Aquí puedes añadir lógica para 'ver', 'editar' o 'eliminar'
  }

  /**
   * Maneja la respuesta del modal de roles al presionar Guardar
   */
  handleSaveRoles(updatedRoles: UserRole[]) {
    console.log(`Guardando roles para ${this.usuarioSeleccionado}:`, updatedRoles);

    this.rolesPendientes = updatedRoles;
    // Aquí es donde dispararías el modal de confirmación que ya tienes configurado
    // Ejemplo: this.mostrarModalConfirmacion = true;
    this.mostrarModalRoles = false;
    this.mostrarConfirmacion = true;
  }

  confirmarCambios(){
    // 3. AHORA SÍ: Aplicamos los cambios pendientes a la fuente de verdad
    this.rolesUsuario = [...this.rolesPendientes];

    console.log('Cambios aplicados con éxito en el padre:', this.rolesUsuario);

    // 4. Limpiamos y cerramos
    this.rolesPendientes = [];
    this.mostrarConfirmacion = false;
  }

  handleFileUploaded(event: { fileName: string, file: File }) {
    console.log('Archivo recibido:', event.fileName);
  }

  handleHeaderButton(button: TableButton) {
    if (button.label === 'Crear usuarios') {
      this.router.navigate(['/users/crear']); // Navega a la ruta que creamos
    }
  }
}
