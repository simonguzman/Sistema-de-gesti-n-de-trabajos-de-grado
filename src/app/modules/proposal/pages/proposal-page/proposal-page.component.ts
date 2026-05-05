import { Component, inject } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../shared/components/state/state.component';
import { DescriptionModalComponent } from '../../../../shared/components/modals/description-modal/description-modal.component';
import { Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';


@Component({
  selector: 'app-proposal-page',
  imports: [TableComponent, DescriptionModalComponent],
  templateUrl: './proposal-page.component.html',
  styleUrl: './proposal-page.component.css',
})
export class ProposalPageComponent {

   private router = inject(Router);
   protected stateList = stateList;
   private proposalService = inject(ProposalService)

   // 3. Variables para controlar el modal
   mostrarModalDesc: boolean = false;
   tituloParaModal: string = '';
   textoParaModal: string = '';

   protected testValue = this.proposalService.proposals;

    testColumns: Column[] = [
      { field: 'title', header: 'Titulo', type: 'text', width: '30%' },
      { field: 'modality', header: 'Modalidad', type: 'text', width: 'auto'},
      {
        field: 'description',
        header: 'Descripción',
        type: 'actions',
        actions: [
          {action:'ver descripcion', label: 'Ver descripcion', variant: 'primary', disabled: false}
        ],
        width: 'auto'
      },
      { field: 'state', header: 'Estado', type: 'state', width: 'auto' },
      {
      field: 'acciones',
      header: 'Acciones',
      type: 'actions',
      actions: [
        { action: 'ver',     icon: 'visibility', variant: 'primary', disabled: false },
        { action: 'editar',  icon: 'edit', variant: 'primary', disabled: false },
        { action: 'eliminar',icon: 'delete', variant: 'primary', disabled: false }
      ],
      width: 'auto'
      },
    ];

    // 4. Función para capturar el evento de la tabla
  handleTableAction(event: { action: string, row: any }) {
    const proposalId = event.row.id;
    switch (event.action) {
      case 'ver descripcion':
        this.tituloParaModal = 'Descripción de la propuesta';
        // Asignamos el contenido de la columna 'titulo' o una propiedad 'descripcion' si existiera
        this.textoParaModal = event.row.description;
        this.mostrarModalDesc = true;
        break;
      case 'ver':
        this.router.navigate(['/proposal/ver', proposalId]);
        break;
      case 'editar':
        this.router.navigate(['/proposal/editar', proposalId]);
        break;
      case 'eliminar':
        console.log('Lógica para eliminar propuesta:', proposalId);
        break;
    }
  }

  handleHeaderButton(button: TableButton){
    if(button.label === 'Registrar propuesta'){
      this.router.navigate(['/proposal/create']);
    }
  }
}
