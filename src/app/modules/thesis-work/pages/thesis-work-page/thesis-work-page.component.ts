import { Component } from '@angular/core';
import { stateList } from '../../../../shared/components/state/state.component';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';

@Component({
  selector: 'app-thesis-work-page',
  imports: [TableComponent],
  templateUrl: './thesis-work-page.component.html',
  styleUrl: './thesis-work-page.component.css',
})
export class ThesisWorkPageComponent {

  protected stateList = stateList;

      testColumns: Column[] = [
        { field: 'titulo', header: 'Titulo', type: 'text', width: '30%' },
        { field: 'modalidad', header: 'Modalidad', type: 'text', width: '15%'},
        {
          field: 'descripción',
          header: 'Descripción',
          type: 'actions',
          actions: [
            {action:'ver descripción', label: 'Ver descripción', variant: 'primary'}
          ],
          width: '20%'
        },
        { field: 'estado', header: 'Estado', type: 'state', width: '15%' },
        {
        field: 'acciones',
        header: 'Acciones',
        type: 'actions',
        actions: [
          { action: 'ver',     icon: 'visibility', variant:'primary' },
          { action: 'editar',  icon: 'edit', variant:'primary' },
          { action: 'eliminar',icon: 'delete', variant: 'primary' }
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
