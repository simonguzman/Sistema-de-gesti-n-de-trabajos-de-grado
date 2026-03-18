import { Component } from '@angular/core';
import { TableComponent, Column } from "../../../../shared/components/table-component/table-component.component";
import { stateList } from '../../../../shared/components/state/state.component';

@Component({
  selector: 'app-users-page',
  imports: [TableComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
})
export class UsersPageComponent {

  protected stateList = stateList;

  testColumns: Column[] = [
    { field: 'identificacion', header: 'Identificación', type: 'text', width: '15%' },
    { field: 'nombre', header: 'Nombre', type: 'text', width: '15%'},
    { field: 'apellidos', header: 'Apellidos', type: 'text', width: '15%'},
    { field: 'estado', header: 'Estado', type: 'text', width: '15%'},
    {
      field: 'descripción',
      header: 'Descripción',
      type: 'actions',
      actions: [
        {action:'ver roles asignados', label: 'Ver roles asignados'}
      ],
      width: '20%'
    },
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

  testValue: any[] = [{
    identificacion: '1002819781',
    nombre: 'Simón',
    apellidos: 'Guzmán Anaya',
    estado: 'Activo'
  }];
}


