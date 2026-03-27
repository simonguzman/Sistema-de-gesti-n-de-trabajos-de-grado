import { Component } from '@angular/core';
import { stateList } from '../../../../shared/components/state/state.component';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { EvaluationModalComponent } from '../../../../shared/components/modals/evaluation-modal/evaluation-modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

@Component({
  selector: 'app-thesis-work-page',
  imports: [TableComponent, EvaluationModalComponent, ButtonComponent],
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

  // 1. Variable para controlar la visibilidad del modal
  mostrarModalEvaluacion: boolean = false;

  // 2. Datos de prueba (Mock data idéntica a tu diseño)
  mockName: string = 'Joe Doe';
  mockRole: string = 'Jefe de departamento';
  mockDate: Date = new Date(2025, 7, 22); // 22 de Agosto de 2025
  // En tu ThesisWorkPageComponent
  mockState: stateList = 'Aprobado' as stateList;  // Tu estado válido
  mockComments: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
  mockDocs: string[] = []; // Array vacío para ver el mensaje "No han sido cargados archivos..."

  // 3. Métodos para abrir y cerrar
  abrirModal() {
    this.mostrarModalEvaluacion = true;
  }

  cerrarModal() {
    this.mostrarModalEvaluacion = false;
  }
}
