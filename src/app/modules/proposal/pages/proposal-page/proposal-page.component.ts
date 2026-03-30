import { Component } from '@angular/core';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../shared/components/state/state.component';
import { DescriptionModalComponent } from '../../../../shared/components/modals/description-modal/description-modal.component';


@Component({
  selector: 'app-proposal-page',
  imports: [TableComponent, DescriptionModalComponent],
  templateUrl: './proposal-page.component.html',
  styleUrl: './proposal-page.component.css',
})
export class ProposalPageComponent {

   protected stateList = stateList;

   // 3. Variables para controlar el modal
   mostrarModalDesc: boolean = false;
   tituloParaModal: string = '';
   textoParaModal: string = '';

    testColumns: Column[] = [
      { field: 'titulo', header: 'Titulo', type: 'text', width: '30%' },
      { field: 'modalidad', header: 'Modalidad', type: 'text', width: 'auto'},
      {
        field: 'descripción',
        header: 'Descripción',
        type: 'actions',
        actions: [
          {action:'ver descripción', label: 'Ver descripción', variant: 'primary'}
        ],
        width: 'auto'
      },
      { field: 'estado', header: 'Estado', type: 'state', width: 'auto' },
      {
      field: 'acciones',
      header: 'Acciones',
      type: 'actions',
      actions: [
        { action: 'ver',     icon: 'visibility', variant: 'primary' },
        { action: 'editar',  icon: 'edit', variant: 'primary' },
        { action: 'eliminar',icon: 'delete', variant: 'primary' }
      ],
      width: 'auto'
      },
    ];

    testValue: any[] = [
      {
        titulo: 'Frontend de las funcionalidades asociadas a la aplicación web para la Facultad de Ingeniería Electrónica y Telecomunicaciones, dedicada a los módulos de Gestión de Trabajos de Grado de los programas de pregrado, Gestión de Estadísticas y Gestión de Notificaciones',
        modalidad: 'Practica profesional',
        descripcion: 'Desarrollar un prototipo del FrontEnd de una aplicación web para apoyar la gestión de los procesos académicos y administrativos asociados a los trabajos de grado, las estadísticas y las notificaciones de la FIET, facilitando la organización, el seguimiento y la comunicación de la información, con el fin de contribuir al mejoramiento de la eficiencia del proceso y a la satisfacción de los usuarios involucrados. ',
        estado: 'Aprobado',
      },
      {
        titulo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        modalidad: 'Trabajo de investigacón',
        estado: 'Aprobado con observaciones',
      },
      {
        titulo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        modalidad: 'Practica profesional',
        estado: 'No aprobado',
      },
      {
        titulo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        modalidad: 'Trabajo de investigación',
        estado: 'Aprobado con observaciones',
      },
      {
        titulo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        modalidad: 'Practica profesional',
        estado: 'Aprobado',
      },
      {
        titulo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        modalidad: 'Practica profesional',
        estado: 'Aprobado',
      },
    ];

    // 4. Función para capturar el evento de la tabla
  handleTableAction(event: { action: string, row: any }) {
    if (event.action === 'ver descripción') {
      this.tituloParaModal = 'Descripción de la propuesta';
      // Asignamos el contenido de la columna 'titulo' o una propiedad 'descripcion' si existiera
      this.textoParaModal = event.row.descripcion;
      this.mostrarModalDesc = true;
    }
  }
}
