import { Component, inject } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../shared/components/state/state.component';
import { DescriptionModalComponent } from '../../../../shared/components/modals/description-modal/description-modal.component';
import { Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { Proposal } from '../../interfaces/proposal.interface';


@Component({
  selector: 'app-proposal-page',
  imports: [TableComponent, DescriptionModalComponent, ConfirmationActionModalComponent],
  templateUrl: './proposal-page.component.html',
  styleUrl: './proposal-page.component.css',
})
export class ProposalPageComponent {

   private router = inject(Router);
   protected stateList = stateList;
   private proposalService = inject(ProposalService)
   private notificationService = inject(NotificationService);

   // 3. Variables para controlar el modal
   mostrarModalDesc: boolean = false;
   tituloParaModal: string = '';
   textoParaModal: string = '';

   showDeleteConfirmation = false;
   proposalIdToDelete: string | null = null;
   proposalTitleToDelete = '';
   isDeleting = false;

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
  handleTableAction(event: { action: string, row: Proposal }) {
    const proposalId = event.row.id;
    switch (event.action) {
      case 'ver descripcion':
        this.tituloParaModal = 'Descripción de la propuesta';
        // Asignamos el contenido de la columna 'titulo' o una propiedad 'descripcion' si existiera
        this.textoParaModal = event.row.description;
        this.mostrarModalDesc = true;
        break;
      case 'ver':
        this.router.navigate(['/proposal/details', proposalId]);
        break;
      case 'editar':
        this.router.navigate(['/proposal/edit', proposalId]);
        break;
      case 'eliminar':
        this.prepareDelete(event.row);
        break;
    }
  }

  handleHeaderButton(button: TableButton){
    switch(button.label){
      case 'Registrar propuesta':
        this.router.navigate(['/proposal/create']);
        break;
      case 'Formatos descargables':
        this.router.navigate(['/proposal/downloadable_formats']);
        break;
    }
  }

  confirmDelete() {
    if(!this.proposalIdToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.showDeleteInfoNotification();
    this.proposalService.deleteProposalMock(this.proposalIdToDelete).subscribe({
      next: () => {
        this.showDeleteSuccessNotification();
        this.resetDeleteState();
      },
      error: () => {
        this.showDeleteErrorNotification();
        this.isDeleting = false;
      }
    })
  }

  cancelDelete() {
    this.showDeleteConfirmation = false;
    this.proposalIdToDelete = null;
    this.proposalTitleToDelete = '';
  }

  private resetDeleteState() {
    this.isDeleting = false;
    this.showDeleteConfirmation = false;
    this.proposalIdToDelete = null;
    this.proposalTitleToDelete = '';
  }

  private showDeleteInfoNotification() {
    this.notificationService.show({
      title: 'Eliminando propuesta',
      message: 'Se está eliminando la propuesta...',
      type: NotificationType.INFO
    })
  }

  private prepareDelete(row: any){
    this.proposalIdToDelete = row.id;
    this.proposalTitleToDelete = row.title;
    this.showDeleteConfirmation = true;
  }

  private showDeleteSuccessNotification() {
    this.notificationService.show({
      title: 'Propuesta eliminada',
      message: 'La propuesta fue eliminada correctamente.',
      type: NotificationType.CONFIRMATION
    })
  }

  private showDeleteErrorNotification() {
    this.notificationService.show({
      title: 'Error',
      message: 'No se pudo eliminar la propuesta',
      type: NotificationType.ERROR
    });
  }

}
