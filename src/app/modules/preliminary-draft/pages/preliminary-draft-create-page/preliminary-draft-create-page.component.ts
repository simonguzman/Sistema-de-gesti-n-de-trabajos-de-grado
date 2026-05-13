import { Component, inject, OnInit } from '@angular/core';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { UserRoleType } from '../../../../core/models/user-role';
import { Location } from '@angular/common';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { PreliminaryDraftFormComponent } from "../../components/preliminary-draft-form/preliminary-draft-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';

@Component({
  selector: 'app-preliminary-draft-create-page',
  templateUrl: './preliminary-draft-create-page.component.html',
  styleUrls: ['./preliminary-draft-create-page.component.css'],
  imports: [PreliminaryDraftFormComponent, ConfirmationActionModalComponent]
})
export class PreliminaryDraftCreatePageComponent implements OnInit {
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  confirmState = {
    show: false,
    pendingData: null as PreliminaryDraft | null
  };

  ngOnInit(): void {
    if (!this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR, UserRoleType.DIRECTOR])) {
      this.showAccessDeniedNotification();
      this.router.navigate(['/preliminary-draft']);
    }
  }

  // Recibe los datos del FormComponent
  handleCreatePreliminaryDraft(preliminaryDraft: PreliminaryDraft): void {
    this.confirmState = { show: true, pendingData: preliminaryDraft };
  }

  confirmCreation(): void {
    if (!this.confirmState.pendingData) return;

    const data = this.confirmState.pendingData;
    this.confirmState.show = false;
    this.showProcessingNotification();

    this.preliminaryDraftService.createPreliminaryDraftMock(data).subscribe({
      next: () => this.handleCreationSuccess(),
      error: (err) => {
        console.error(err);
        this.notificationService.show({
          title: 'Error',
          message: 'No se pudo guardar el anteproyecto.',
          type: NotificationType.ERROR
        });
      }
    });
  }

  cancelCreation(): void {
    this.confirmState = { show: false, pendingData: null };
  }

  goBack(): void {
    this.location.back();
  }

  private handleCreationSuccess(): void {
    this.notificationService.show({
      title: '¡Anteproyecto registrado!',
      message: 'El anteproyecto ha sido creado exitosamente y está listo para evaluación.',
      type: NotificationType.CONFIRMATION
    });
    this.confirmState = { show: false, pendingData: null };
    this.router.navigate(['/preliminary-draft']);
  }

  private showAccessDeniedNotification() {
    this.notificationService.show({
      title: 'Acceso Denegado',
      message: 'No tienes los permisos requeridos para registrar anteproyectos.',
      type: NotificationType.ERROR
    });
  }

  private showProcessingNotification() {
    this.notificationService.show({
      title: 'Procesando registro',
      message: 'Estamos guardando la información del anteproyecto en el sistema...',
      type: NotificationType.INFO
    });
  }
}
