import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { Router } from '@angular/router';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { DescriptionModalComponent } from "../../../../shared/components/modals/description-modal/description-modal.component";

const PRELIMINARY_DRAFT_COLUMNS : Column[] = [
  { field: 'title', header: 'Titulo', type: 'text', width: '30%' },
  { field: 'modality', header: 'Modalidad', type: 'text', width: '15%'},
  {
    field: 'description',
    header: 'Descripción',
    type: 'actions',
    actions: [
      {action:'ver descripción', label: 'Ver descripción', variant: 'primary', disabled: false }
    ],
    width: '20%'
  },
  { field: 'state', header: 'Estado', type: 'state', width: '15%' },
  {
  field: 'actions',
  header: 'Acciones',
  type: 'actions',
  actions: [
    { action: 'ver',     icon: 'visibility', variant: 'primary', disabled: false },
    { action: 'editar',  icon: 'edit', variant: 'primary', disabled: false },
    { action: 'eliminar',icon: 'delete', variant: 'primary', disabled: false }
  ],
  width: '20%'
  },
];

const HEADER_BUTTONS: TableButton[] = [
  { label: 'Formatos descargables', variant: 'primary' },
  { label: 'Registrar anteproyecto',   variant: 'primary' }
]

@Component({
  selector: 'app-preliminary-draft-page',
  imports: [TableComponent, ConfirmationActionModalComponent, DescriptionModalComponent],
  templateUrl: './preliminary-draft-page.component.html',
  styleUrl: './preliminary-draft-page.component.css',
})
export class PreliminaryDraftPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected columns: Column[] = PRELIMINARY_DRAFT_COLUMNS;
  protected headerButtons: TableButton[] = [];

  protected tableData = computed(() => {
    const currentUser = this.authService.currentUser();
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isJefe = this.authService.hasAnyRole([UserRoleType.JEFE_DEP]);
    const isEvaluador = this.authService.hasAnyRole([UserRoleType.EVALUADOR]);

    return this.preliminaryDraftService.preliminaryDrafts().map(draft => {
      const isOwner = draft.proposalData?.director.id === currentUser?.id;
      let allowed: string[] = ['ver descripción', 'ver'];
      if (isAdmin || isOwner) {
        allowed = ['ver descripción', 'ver', 'editar', 'eliminar'];
      } else if (isJefe || isEvaluador) {
        allowed = ['ver descripción', 'ver'];
      }
      return {
        id: draft.preliminaryDraftId,
        title: draft.proposalData?.title || 'Sin título',
        description: draft.proposalData?.description,
        modality: draft.proposalData?.modality || 'No definida',
        directorId: draft.proposalData?.director.id,
        state: draft.state,
        allowedActions: allowed
      };
    });
  });

  descriptionModal = signal({ show: false, title: '', content: '' });
  deleteState = signal({ show: false, id: null as string | null, title: '', loading: false });

  ngOnInit(): void {
    this.initHeaderButtons();
  }

  private initHeaderButtons(): void {
    const canRegister = this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.DIRECTOR
    ]);

    this.headerButtons = canRegister
      ? [...HEADER_BUTTONS]
      : HEADER_BUTTONS.filter(btn => btn.label !== 'Registrar anteproyecto');
  }

  handleTableAction(event: { action: string, row: any }): void {
    if (event.row.allowedActions && !event.row.allowedActions.includes(event.action)) {
      this.showRestrictedNotification();
      return;
    }

    switch (event.action) {
      case 'ver descripción':
        this.descriptionModal.set({
          show: true,
          title: 'Descripción del anteproyecto',
          content: event.row.description || 'Sin descripción disponible.'
        });
        break;
      case 'ver':
        this.router.navigate(['/preliminary-draft/details', event.row.id]);
        break;
      case 'editar':
        this.router.navigate(['/preliminary-draft/edit', event.row.id]);
        break;
      case 'eliminar':
        this.deleteState.set({
          show: true,
          id: event.row.id,
          title: event.row.title,
          loading: false
        });
        break;
    }
  }

  handleHeaderButton(button: TableButton): void {
    if (button.label === 'Registrar anteproyecto') {
      this.router.navigate(['/preliminary-draft/create']);
    } else {
      this.router.navigate(['/preliminary-draft/downloadable_formats']);
    }
  }

  confirmDelete(): void {
    const state = this.deleteState();
    if (!state.id || state.loading) return;

    this.deleteState.update(state => ({ ...state, loading: true }));
    this.showDeleteInfoNotification();

    this.preliminaryDraftService.deleteDraftMock(state.id).subscribe({
      next: () => {
        this.showDeleteSuccessNotification();
        this.cancelDelete();
      },
      error: () => {
        this.deleteState.update(state => ({ ...state, loading: false }));
        this.showDeleteErrorNotification();
      }
    });
  }

  cancelDelete(): void {
    this.deleteState.set({ show: false, id: null, title: '', loading: false });
  }

  private showDeleteInfoNotification(): void {
    this.notificationService.show({
      title: 'Eliminando anteproyecto',
      message: 'Se está eliminando el registro del sistema...',
      type: NotificationType.INFO
    });
  }

  private showDeleteSuccessNotification(): void {
    this.notificationService.show({
      title: 'Anteproyecto eliminado',
      message: 'El registro ha sido removido correctamente.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showDeleteErrorNotification(): void {
    this.notificationService.show({
      title: 'Error',
      message: 'No se pudo eliminar el anteproyecto.',
      type: NotificationType.ERROR
    });
  }

  private showRestrictedNotification(): void {
    this.notificationService.show({
      title: 'Acceso denegado',
      message: 'No tienes permisos para realizar esta acción.',
      type: NotificationType.ERROR
    });
  }
}
