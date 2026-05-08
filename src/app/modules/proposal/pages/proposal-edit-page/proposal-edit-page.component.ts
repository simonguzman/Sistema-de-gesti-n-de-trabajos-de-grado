import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Location } from '@angular/common';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { ProposalFormComponent } from "../../components/proposal-form/proposal-form.component";

@Component({
  selector: 'app-proposal-edit-page',
  templateUrl: './proposal-edit-page.component.html',
  styleUrls: ['./proposal-edit-page.component.css'],
  imports: [ConfirmationActionModalComponent, ProposalFormComponent]
})
export class ProposalEditPageComponent implements OnInit {

  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private location            = inject(Location);
  private proposalService     = inject(ProposalService);     // ← minúscula
  private notificationService = inject(NotificationService);

  proposalToEdit = signal<Proposal | null>(null);

  // Estado del flujo de confirmación agrupado
  confirmState = {
    show:        false,
    pendingData: null as Proposal | null
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    id ? this.loadProposalData(id) : this.router.navigate(['/proposal']);
  }

  private loadProposalData(id: string): void {
    this.proposalService.getProposalByIdMock(id).subscribe({
      next: (found) => {
        if (found) {
          // Clonamos para evitar modificar la referencia del servicio accidentalmente
          this.proposalToEdit.set({ ...found });
        } else {
          this.handleNotFound();
        }
      }
    });
  }

  handleUpdate(updatedData: Proposal): void {
    this.confirmState = { show: true, pendingData: updatedData };
  }

  confirmUpdate(): void {
    const currentProposal = this.proposalToEdit();
    const dataToSave = this.confirmState.pendingData;
    if (!currentProposal?.id || !dataToSave) return;

    this.notificationService.show({
      title:   'Procesando actualización',
      message: 'Estamos actualizando la propuesta...',
      type:    NotificationType.INFO
    });

    this.proposalService.updateProposalMock(currentProposal.id, dataToSave).subscribe({
      next: () => this.handleUpdateSuccess(),
      error: () => this.handleUpdateError()
    });
  }

  cancelUpdate(): void {
    this.confirmState = { show: false, pendingData: null };
  }

  goBack(): void {
    this.location.back();
  }

  private handleUpdateSuccess(): void {
    this.notificationService.show({
      title:   '¡Actualización exitosa!',
      message: 'La propuesta fue actualizada correctamente.',
      type:    NotificationType.CONFIRMATION
    });
    this.confirmState = { show: false, pendingData: null };
    this.router.navigate(['/proposal']);
  }

  private handleUpdateError(): void {
    this.notificationService.show({
      title:   'Error',
      message: 'No se pudo actualizar la propuesta.',
      type:    NotificationType.ERROR
    });
    this.confirmState.show = false;
  }

  private handleNotFound(message = 'Propuesta no encontrada'): void {
    this.notificationService.show({
      title: 'Atención',
      message,
      type: NotificationType.ERROR
    });
    this.router.navigate(['/proposal']);
  }

}
