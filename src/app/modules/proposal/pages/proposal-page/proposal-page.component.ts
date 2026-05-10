import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { DescriptionModalComponent } from '../../../../shared/components/modals/description-modal/description-modal.component';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { UserRoleType } from '../../../../core/models/user-role';
import { Proposal } from '../../interfaces/proposal.interface';

const PROPOSAL_COLUMNS: Column[] = [
  { field: 'title', header: 'Titulo', type: 'text', width: '30%' },
  { field: 'modality', header: 'Modalidad', type: 'text', width: 'auto'},
  {
    field: 'description',
    header: 'Descripción',
    type: 'actions',
    actions: [{action:'ver descripcion', label: 'Ver descripcion', variant: 'primary', disabled: false}],
    width: 'auto'
  },
  { field: 'state', header: 'Estado', type: 'state', width: 'auto' },
  {
    field: 'acciones',
    header: 'Acciones',
    type: 'actions',
    actions: [
      { action: 'ver', icon: 'visibility', variant: 'primary', disabled: false },
      { action: 'editar', icon: 'edit', variant: 'primary', disabled: false },
      { action: 'eliminar', icon: 'delete', variant: 'primary', disabled: false }
    ],
    width: 'auto'
  },
];

const HEADER_BUTTONS: TableButton[] = [
  { label: 'Formatos descargables', variant: 'primary' },
  { label: 'Registrar propuesta',   variant: 'primary' }
]

@Component({
  selector: 'app-proposal-page',
  imports: [TableComponent, DescriptionModalComponent, ConfirmationActionModalComponent],
  templateUrl: './proposal-page.component.html',
  styleUrl: './proposal-page.component.css',
})
export class ProposalPageComponent implements OnInit {
  private router            = inject(Router);
  private proposalService   = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  protected proposals     = this.proposalService.proposals;
  protected columns: Column[] = [];
  protected headerButtons: TableButton[] = [];

  // Estado del modal de descripción
  descriptionModal = { show: false, title: '', content: '' };

  // Estado del flujo de eliminación
  deleteState = {
    show:    false,
    id:      null as string | null,
    title:   '',
    loading: false
  };

  ngOnInit(): void {
    const canManage = this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.DIRECTOR
    ]);
    const canRegister = this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.DIRECTOR
    ]);
    this.headerButtons = canRegister
      ? [...HEADER_BUTTONS]
      : HEADER_BUTTONS.filter(btn => btn.label !== 'Registrar propuesta');
    this.columns = PROPOSAL_COLUMNS.map(col => {
      if (col.field === 'acciones') {
        return {
          ...col,
          actions: canManage
            ? col.actions
            : col.actions?.filter(a => a.action === 'ver')
        };
      }
      return { ...col };
    });
  }

  handleTableAction(event: { action: string, row: Proposal }): void {
    switch (event.action) {
      case 'ver descripcion':
        this.descriptionModal = {
          show:    true,
          title:   'Descripción de la propuesta',
          content: event.row.description
        };
        break;
      case 'ver':
        this.router.navigate(['/proposal/details', event.row.id]);
        break;
      case 'editar':
        this.router.navigate(['/proposal/edit', event.row.id]);
        break;
      case 'eliminar':
        this.deleteState = { show: true, id: event.row.id!, title: event.row.title, loading: false };
        break;
    }
  }

  handleHeaderButton(button: TableButton): void {
    switch (button.label) {
      case 'Registrar propuesta':
        this.router.navigate(['/proposal/create']);
        break;
      case 'Formatos descargables':
        this.router.navigate(['/proposal/downloadable_formats']);
        break;
    }
  }

  confirmDelete(): void {
    const idToDelete= this.deleteState.id;
    if (!idToDelete || this.deleteState.loading) return;
    this.deleteState.loading = true;
    this.showDeleteProposalInfoNotification();
    this.proposalService.deleteProposalMock(idToDelete).subscribe({
      next: () => {
        this.showDeleteProposalSuccessNotification();
        this.resetDeleteState();
      },
      error: () => {
        this.showDeleteProposalErrorNotification();
        this.deleteState.loading = false;
      }
    });
  }

  private showDeleteProposalInfoNotification(){
    this.notificationService.show({
      title:   'Eliminando propuesta',
      message: 'Se está eliminando la propuesta...',
      type:    NotificationType.INFO
    });
  }

  private showDeleteProposalSuccessNotification(){
    this.notificationService.show({
      title:   'Propuesta eliminada',
      message: 'La propuesta fue eliminada correctamente.',
      type:    NotificationType.CONFIRMATION
    });
  }

  private showDeleteProposalErrorNotification(){
    this.notificationService.show({
      title:   'Error',
      message: 'No se pudo eliminar la propuesta.',
      type:    NotificationType.ERROR
    });
  }

  cancelDelete(): void {
    this.resetDeleteState();
  }

  private resetDeleteState(): void {
    this.deleteState = { show: false, id: null, title: '', loading: false };
  }
}
