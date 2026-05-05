import { Component, inject } from '@angular/core';
import { ProposalFormComponent } from '../../components/proposal-form/proposal-form.component';
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Router } from '@angular/router';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-proposal-create-page',
  imports: [ProposalFormComponent, ConfirmationActionModalComponent],
  templateUrl: './proposal-create-page.component.html',
  styleUrls: ['./proposal-create-page.component.css']
})
export class ProposalCreatePageComponent {

  private proposalService = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private location = inject(Location);

  isConfirmModalOpen = false;
  pendingProposalData: Proposal | null = null;

  handleCreateProposal(proposalData: Proposal) {
    this.pendingProposalData = proposalData;
    this.isConfirmModalOpen = true;
  }

  cancelCreation() {
    this.isConfirmModalOpen = false;
    this.pendingProposalData = null;
  }

  confirmCreation() {
    if (!this.pendingProposalData) return;

    this.isConfirmModalOpen = false;
    this.showInfoNotification();

    this.proposalService.createProposalMock(this.pendingProposalData).subscribe({
      next: (response) => {
        this.pendingProposalData = null;
        this.showConfirmationNotification();
        this.router.navigate(['/proposal']); // Ajusta la ruta según tu routing
      },
      error: (err) => {
        console.error('Error en la creación de la propuesta', err);
        this.showErrorNotification();
      }
    });
  }

  private showInfoNotification() {
    this.notificationService.show({
      title: 'Procesando registro',
      message: 'Estamos guardando la información de la propuesta...',
      type: NotificationType.INFO
    });
  }

  private showConfirmationNotification() {
    this.notificationService.show({
      title: 'Propuesta registrada',
      message: 'La propuesta ha sido registrada correctamente.',
      type: NotificationType.CONFIRMATION,
    });
  }

  private showErrorNotification() {
    this.notificationService.show({
      title: 'Error de servidor',
      message: 'No se pudo guardar la propuesta. Intente nuevamente.',
      type: NotificationType.ERROR,
    });
  }

  goBack() {
    this.location.back();
  }

}
