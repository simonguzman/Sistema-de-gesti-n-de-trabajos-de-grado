import { Component } from '@angular/core';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../shared/components/state/state.component';

@Component({
  selector: 'app-preliminary-draft-page',
  imports: [TableComponent],
  templateUrl: './preliminary-draft-page.component.html',
  styleUrl: './preliminary-draft-page.component.css',
})
export class PreliminaryDraftPageComponent {

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
