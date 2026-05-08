import { Component, inject, OnInit } from '@angular/core';
import { ProposalFormComponent } from '../../components/proposal-form/proposal-form.component';
import { ConfirmationActionModalComponent } from '../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Router } from '@angular/router';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserRoleType } from '../../../../core/models/user-role';

@Component({
  selector: 'app-proposal-create-page',
  imports: [ProposalFormComponent, ConfirmationActionModalComponent],
  templateUrl: './proposal-create-page.component.html',
  styleUrls: ['./proposal-create-page.component.css']
})
export class ProposalCreatePageComponent implements OnInit {

  private proposalService     = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router              = inject(Router);
  private location            = inject(Location);

  confirmState = {
    show:        false,
    pendingData: null as Proposal | null
  };

  ngOnInit(): void {
    if(!this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR, UserRoleType.DIRECTOR])){
      this.notificationService.show({
        title: 'Acceso Denegado',
        message: 'No tienes los permisos requeridos para registrar propuestas.',
        type: NotificationType.ERROR
      });
      this.router.navigate(['/proposal']);
    }
  }

  handleCreateProposal(proposalData: Proposal): void {
    this.confirmState = { show: true, pendingData: proposalData };
  }

  confirmCreation(): void {
    if (!this.confirmState.pendingData) return;

    this.confirmState.show = false;

    this.notificationService.show({
      title:   'Procesando registro',
      message: 'Estamos guardando la información de la propuesta...',
      type:    NotificationType.INFO
    });

    this.proposalService.createProposalMock(this.confirmState.pendingData).subscribe({
      next: () => {
        this.notificationService.show({
          title:   'Propuesta registrada',
          message: 'La propuesta ha sido registrada correctamente.',
          type:    NotificationType.CONFIRMATION
        });
        this.confirmState = { show: false, pendingData: null };
        this.router.navigate(['/proposal']);
      },
      error: () => {
        this.notificationService.show({
          title:   'Error de servidor',
          message: 'No se pudo guardar la propuesta. Intente nuevamente.',
          type:    NotificationType.ERROR
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

}
