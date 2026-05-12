import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { UserRoleType } from '../../../../core/models/user-role';
import { Location } from '@angular/common';
import { PreliminaryDraftFormComponent } from "../../components/preliminary-draft-form/preliminary-draft-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

@Component({
  selector: 'app-preliminary-draft-edit-page',
  templateUrl: './preliminary-draft-edit-page.component.html',
  styleUrls: ['./preliminary-draft-edit-page.component.css'],
  imports: [PreliminaryDraftFormComponent, ConfirmationActionModalComponent]
})
export class PreliminaryDraftEditPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private preliminaryDraftService = inject(PreliminaryDraftService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  preliminaryDraftToEdit = signal<PreliminaryDraft | null>(null);

  confirmState = {
    show: false,
    pendingData: null as PreliminaryDraft | null
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    id ? this.loadPreliminaryDraftData(id) : this.router.navigate(['/preliminary-draft'])
  }

  private loadPreliminaryDraftData(id: string): void {
    this.preliminaryDraftService.getDraftByIdMock(id).subscribe({
      next: (found) => {
        if (found) {
          const currentUser = this.authService.currentUser();
          const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);

          const isOwner= found?.proposalData.director?.id === currentUser?.id;

          if(!isAdmin && !isOwner){
            this.handleUpdateError('No tienes permisos para editar este anteproyecto.');
            this.router.navigate(['/preliminary-draft']);
            return;
          }
          this.preliminaryDraftToEdit.set({...found});
        } else {
          this.handleNotFound();
        }
      }
    })
  }

  handleUpdate(updatedData: PreliminaryDraft): void {
    this.confirmState = { show: true, pendingData: updatedData };
  }

  confirmUpdate(): void {
    const currentDraft = this.preliminaryDraftToEdit();
    const dataToSave = this.confirmState.pendingData;

    if (!currentDraft?.preliminaryDraftId || !dataToSave) return;

    this.showUpdateInfoNotification();
    this.preliminaryDraftService.updatePreliminaryDraftMock(currentDraft.preliminaryDraftId, dataToSave).subscribe({
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

  private handleUpdateSuccess(): void{
    this.showUpdateSuccessNotification();
    this.confirmState = { show: false, pendingData: null };
    this.router.navigate(['/preliminary-draft'])
  }

  private handleUpdateError(customMessage?: string): void {
    this.showUpdateErrorNotification(customMessage);
    this.confirmState.show = false;
  }

  private handleNotFound(): void {
    this.showNotFoundNotification();
    this.router.navigate(['/preliminary-draft'])
  }

  private showUpdateInfoNotification() {
    this.notificationService.show({
      title: 'Procesando actualización',
      message: 'Estamos guardando los cambios en el anteproyecto...',
      type: NotificationType.INFO
    });
  }

  private showUpdateSuccessNotification() {
    this.notificationService.show({
      title: '¡Actualización exitosa!',
      message: 'El anteproyecto se ha modificado correctamente.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showUpdateErrorNotification(customMessage?: string) {
    this.notificationService.show({
      title: 'Error de actualización',
      message: customMessage || 'No se pudieron guardar los cambios. Por favor, intente de nuevo.',
      type: NotificationType.ERROR
    });
  }

  private showNotFoundNotification() {
    this.notificationService.show({
      title: 'Atención',
      message: 'El anteproyecto que intenta editar no fue encontrado en el sistema.',
      type: NotificationType.ERROR
    });
  }

}
