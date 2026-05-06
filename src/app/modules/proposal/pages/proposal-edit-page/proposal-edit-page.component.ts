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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ProposalService = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private location = inject(Location);

  proposalToEdit = signal<Proposal | null>(null);

  isConfirmModalOpen = false;
  private pendingUpdateData: Proposal | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    id ? this.loadProposalData(id) : this.router.navigate(['/proposal'])
  }

  private loadProposalData(id: string): void {
    this.ProposalService.getProposalByIdMock(id).subscribe({
      next: (proposalFound) =>
        proposalFound
        ? this.proposalToEdit.set(proposalFound)
        : this.handleNotFound(),
      error: () => this.handleNotFound('Error al cargar la propuesta')
    });
  }

  handleUpdate(updatedData: Proposal): void{
    this.pendingUpdateData = updatedData;
    this.isConfirmModalOpen= true;
  }

  confirmUpdate(): void{
    const id = this.proposalToEdit()?.id;
    if(!id || !this.pendingUpdateData) return;
    this.showEditInfoNotificaction();
    this.ProposalService.updateProposalMock(id, this.pendingUpdateData).subscribe({
      next: () => this.handleUpdateSuccess(),
      error: () => this.handleUpdateError(),
    })
  }

  private handleUpdateSuccess(): void {
    this.showEditSuccessNotificaction();
    this.pendingUpdateData = null;
    this.router.navigate(['/proposal'])
  }

  private handleUpdateError(): void{
    this.showEditErrorNotification();
    this.isConfirmModalOpen = false;
  }

  private handleNotFound(message: string = 'Propuesta no encontrada'): void {
    this.notificationService.show({
      title: 'Atención',
      message,
      type: NotificationType.ERROR
    });
    this.router.navigate(['/proposal']);
  }

  cancelUpdate(): void{
    this.isConfirmModalOpen = false;
    this.pendingUpdateData = null;
  }

  goBack(): void {
    this.location.back()
  }

  private showEditInfoNotificaction(){
    this.notificationService.show({
      title: 'Procesando actualización',
      message: 'Estamos actualizando la propuesta...',
      type: NotificationType.INFO
    });
  }

  private showEditSuccessNotificaction(){
    this.notificationService.show({
      title: '¡Actualización exitosa!',
      message: 'La propuesta fue actualizada correctamente',
      type: NotificationType.CONFIRMATION
    });
  }

  private showEditErrorNotification(){
    this.notificationService.show({
      title: 'Error',
      message: 'No se pudo actualizar la propuesta',
      type: NotificationType.ERROR
    });
  }

}
