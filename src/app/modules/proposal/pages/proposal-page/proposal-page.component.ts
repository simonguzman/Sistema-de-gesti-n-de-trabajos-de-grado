import { Component } from '@angular/core';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../shared/components/state/state.component';


@Component({
  selector: 'app-proposal-page',
  imports: [TableComponent],
  templateUrl: './proposal-page.component.html',
  styleUrl: './proposal-page.component.css',
})
export class ProposalPageComponent {

   protected stateList = stateList;

    testColumns: Column[] = [
      { field: 'titulo', header: 'Titulo', type: 'text', width: '30%' },
      { field: 'modalidad', header: 'Modalidad', type: 'text', width: '15%'},
      {
        field: 'descripción',
        header: 'Descripción',
        type: 'actions',
        actions: [
          {action:'ver descripción', label: 'Ver descripción'}
        ],
        width: '20%'
      },
      { field: 'estado', header: 'Estado', type: 'state', width: '15%' },
      {
      field: 'acciones',
      header: 'Acciones',
      type: 'actions',
      actions: [
        { action: 'ver',     icon: 'visibility' },
        { action: 'editar',  icon: 'edit' },
        { action: 'eliminar',icon: 'delete' }
      ],
      width: '20%'
      },
    ];

    testValue: any[] = [
      {
        titulo: 'Frontend de las funcionalidades asociadas a la aplicación web para la Facultad de Ingeniería Electrónica y Telecomunicaciones, dedicada a los módulos de Gestión de Trabajos de Grado de los programas de pregrado, Gestión de Estadísticas y Gestión de Notificaciones',
        modalidad: 'Practica profesional',
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
}
