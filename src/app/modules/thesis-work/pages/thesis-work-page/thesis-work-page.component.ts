import { Component } from '@angular/core';
import { stateList } from '../../../../shared/components/state/state.component';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { EvaluationModalComponent } from '../../../../shared/components/modals/evaluation-modal/evaluation-modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { RegisterInformationModalComponent } from '../../../../shared/components/modals/register-information-modal/register-information-modal.component';
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';

@Component({
  selector: 'app-thesis-work-page',
  imports: [TableComponent, EvaluationModalComponent, ButtonComponent, RegisterInformationModalComponent, ConfirmationActionModalComponent],
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
  mockDocs: string[] = [
  'Monografia_trabajo_de_grado_Simon_Guzman_Anaya.pdf',
  'Formato-E_trabajo_de_grado_Simon_Guzman_Anaya.pdf',
  'Anexo_Metodologia_Joe_Doe.pdf'
]; // Array vacío para ver el mensaje "No han sido cargados archivos..."

  // 3. Métodos para abrir y cerrar
  abrirModal() {
    this.mostrarModalEvaluacion = true;
  }

  cerrarModal() {
    this.mostrarModalEvaluacion = false;
  }
  // En ThesisWorkPageComponent

// 1. Control del nuevo modal
mostrarModalRegistro: boolean = false;

// 2. Mock Data para Registro (con más campos)
mockRegistro = {
  header: 'Detalles de la entrega final',
  sub: 'Información del trabajo de grado',
  titulo: 'Frontend de las funcionalidades asociadas a la plataforma de gestión...',
  modalidad: 'Práctica profesional',
  estudiante: 'Simón Guzmán Anaya',
  director: 'Vanessa Agredo Solano',
  codirector: 'Pablo Augusto Mage Imbachi', // Para probar el @if
  asesor: 'Alejandro Toledo Tovar',        // Para probar el @if
  fecha: new Date(2025, 8, 30),
  estado: 'En revision' as stateList,
  docs: [
    'Monografia_trabajo_de_grado_Simon_Guzman_Anaya.pdf',
    'Formato-E_trabajo_de_grado_Simon_Guzman_Anaya.pdf'
  ]
};

// 3. Métodos
abrirRegistro() { this.mostrarModalRegistro = true; }
cerrarRegistro() { this.mostrarModalRegistro = false; }

descargarDesdeRegistro(file: string) {
  console.log('Descargando desde Registro:', file);
}

  mostrarConfirmacion: boolean = false;

  miFuncionDeGuardado() { this.mostrarConfirmacion = true}
  // En el padre

}
