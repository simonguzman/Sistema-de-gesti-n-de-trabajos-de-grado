import { Component } from '@angular/core';
import { TableComponent, Column } from "../../../shared/components/table-component/table-component.component";
import { ButtonComponent } from '../../../shared/components/button-component/button-component.component';
import { StateComponent, stateList } from '../../../shared/components/state/state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-users-page',
  imports: [TableComponent, ButtonComponent, StateComponent,EmptyStateComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
})
export class UsersPageComponent {

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

  testValue: any[] = [{
    titulo: 'Prueba',
    modalidad: 'Presencial',
    estado: 'Aprobado',
  }];
}


