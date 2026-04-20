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

  idUserForRoles: string | null = null;

  // 3. Variables de control para el Modal de Roles
  mostrarModalRoles = false;
  mostrarConfirmacion = false;
  usuarioSeleccionado = '';

  mostrarConfirmacionEliminar = false;
  idUsuarioAEliminar: string | null = null;
  mensajeConfirmacion = ' ';

  // Inicializamos los roles usando el Enum centralizado
  rolesUsuario: UserRole[] = [];

  // NUEVA VARIABLE: Para guardar los cambios antes de la confirmación final
  private pendingRoles: UserRole[] = [];

  // 4. Variables para otros modales
  isModalOpen = false;

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
        { action: 'ver roles asignados', label: 'Ver roles asignados', variant: 'primary', disabled: false }
      ],
      width: '20%'
    },
    {
      field: 'acciones',
      header: 'Acciones',
      type: 'actions',
      actions: [
        { action: 'ver',    icon: 'visibility', variant: 'primary', disabled: false },
        { action: 'editar',  icon: 'edit', variant: 'primary', disabled: false },
        { action: 'eliminar', icon: 'delete', variant: 'primary', disabled: false }
      ],
      width: '20%'
    },
  ];

  // 2. Valores de prueba para la tabla
  testValue: any[] = [{
    id: 1,
    identificacion: '1002819781',
    nombre: 'Simón',
    apellidos: 'Guzmán Anaya',
    estado: 'Activo',
    originalData: {
      roles: [UserRoleType.DIRECTOR]
    }
  }];

  usersTableData = computed(() => {
    return this.userService.users().map(user => {
      // DEFINICIÓN: Calculamos la constante para cada usuario dentro del map
      const esInactivo = user.state === 'Inactivo';

      return {
        identificacion: user.idNumber?.toString() || '',
        nombre: user.firstName,
        apellidos: `${user.lastName} ${user.secondLastName || ''}`,
        estado: user.state || 'Activo',
        roles: [
          {
            action: 'ver roles asignados',
            label: 'Ver roles asignados',
            variant: 'primary',
            disabled: esInactivo
          },
        ],

        // Configuramos las acciones dinámicamente según el estado
        acciones: [
          {
            action: 'ver',
            icon: 'visibility',
            variant: 'primary',
            disabled: esInactivo
          },
          {
            action: 'editar',
            icon: 'edit',
            variant: 'primary',
            disabled: esInactivo // Ahora TypeScript sí encuentra la variable
          },
          {
            action: 'eliminar',
            icon: esInactivo ? 'person_check' : 'delete',
            variant: 'primary', // Usamos 'secondary' para que coincida con tu ButtonComponent
            disabled: false
          },
        ],
        originalData: user
      };
    });
  });

  // Eliminamos testValue y dejamos solo la fuente de verdad del servicio
  get displayValue() {
    return this.usersTableData();
  }

  /**
   * Maneja las acciones emitidas por la tabla
   */
  handleTableAction(event: { action: string, row: any }) {
    console.log('Acción disparada:', event.action); // Debug
    console.log('Data de la fila:', event.row);      // Debug
    if (event.action === 'ver roles asignados') {
      this.idUserForRoles = event.row.originalData?.id;
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
    if (event.action === 'editar'){
      const userId = event.row.originalData?.id;
      if(userId){
        this.router.navigate(['/users/editar', userId]);
      }
    }
    if (event.action === 'eliminar'){
      const user = event.row.originalData;
      this.idUsuarioAEliminar = user.id;
      this.usuarioSeleccionado = `${event.row.nombre} ${event.row.apellidos}`;
      const esInactivo = event.row.estado === 'Inactivo';
      this.mensajeConfirmacion = esInactivo
        ? `¿Desea habilitar nuevamente al usuario ${this.usuarioSeleccionado}?`
        : `¿Desea deshabilitar al usuario ${this.usuarioSeleccionado}? Esta acción limitará sus accesos al sistema.`
      this.mostrarConfirmacionEliminar = true;
    }
  }

  /**
   * Maneja la respuesta del modal de roles al presionar Guardar
   */
  handleSaveRoles(updatedRoles: UserRole[]) {
    console.log(`Guardando roles para ${this.usuarioSeleccionado}:`, updatedRoles);

    this.pendingRoles = updatedRoles;
    // Aquí es donde dispararías el modal de confirmación que ya tienes configurado
    // Ejemplo: this.mostrarModalConfirmacion = true;
    this.mostrarModalRoles = false;
    this.mostrarConfirmacion = true;
  }

  confirmarCambios(){
    if (!this.idUserForRoles) return;

    // 1. Extraemos solo los UserRoleType que el usuario seleccionó
    const finalsRoles = this.pendingRoles
      .filter(rol => rol.assigned === true)
      .map(rol => rol.type);

    // 2. Llamamos al servicio para actualizar (asumiendo que tienes un método update)
    this.userService.updateUserRolesMock(this.idUserForRoles, finalsRoles).subscribe({
      next: () => {
        console.log('Roles actualizados en el servicio');

        // 3. Limpiamos y cerramos
        this.mostrarConfirmacion = false;
        this.pendingRoles = [];
        this.idUserForRoles = null;
      },
      error: (err) => console.error('Error al actualizar roles', err)
    });
  }

  confirmarSoftDelete() {
    if (this.idUsuarioAEliminar){
      this.userService.softDeleteUserMock(this.idUsuarioAEliminar).subscribe({
        next:() => {
          console.log('Estado del usuario actualizado con éxito.');
          this.mostrarConfirmacionEliminar = false;
          this.idUsuarioAEliminar = null;
        },
        error: (err) => console.error('Error al actualizar estado', err)
      });
    }
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
