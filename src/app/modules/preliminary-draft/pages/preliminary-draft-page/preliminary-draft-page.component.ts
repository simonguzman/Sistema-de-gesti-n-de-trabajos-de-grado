import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { Router } from '@angular/router';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { DescriptionModalComponent } from "../../../../shared/components/modals/description-modal/description-modal.component";
import { stateList } from '../../../../core/enums/state.enum';

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
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected columns: Column[] = PRELIMINARY_DRAFT_COLUMNS;
  protected headerButtons: TableButton[] = [];

  descriptionModal = signal({ show: false, title: '', content: '' });
  deleteState = signal({ show: false, id: null as string | null, title: '', loading: false });

  protected tableData = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.id ? String(currentUser.id) : null;

    // 1. Definición de roles de acceso total
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isJefe = this.authService.hasAnyRole([UserRoleType.JEFE_DEP]);
    const isConsejo = this.authService.hasAnyRole([UserRoleType.CONSEJO]);
    const canSeeAll = isAdmin || isJefe || isConsejo;

    const isUser = (entity: any) => entity?.id != null && String(entity.id) === userId;
    const isUserInArray = (arr?: any[]) => Array.isArray(arr) && arr.some(isUser);

    // Los borradores ya vienen filtrados (o no) desde el servicio
    let drafts = this.preliminaryDraftService.preliminaryDrafts();

    // 2. Mapeo y permisos de acciones por fila
    return drafts.map(draft => {
      const proposal = draft.proposalData;

      const isDirector = isUser(proposal?.director);
      const isCodirector = isUser(proposal?.codirector);
      const isAsesor = isUser(proposal?.advisor);
      const isStudent = (userId != null && Array.isArray(proposal?.authors))
        ? proposal.authors.includes(userId)
        : false;
      const isAssignedEvaluator = isUserInArray(draft.evaluators);

      // El Consejo tiene permiso de 'ver' todas las filas que reciba
      const hasViewPermission =
        canSeeAll ||
        isDirector ||
        isCodirector ||
        isAsesor ||
        isStudent ||
        isAssignedEvaluator;

      const isOwnerOrAdmin = isAdmin || isDirector;

      let allowed: string[] = ['ver descripción'];

      if (hasViewPermission) {
        allowed.push('ver');
      }

      // --- CAMBIO AQUÍ: Regla de negocio para ocultar edición y borrado ---
      // Solo permitimos editar y eliminar si el usuario tiene permisos Y el proyecto NO está aprobado
      if (isOwnerOrAdmin && draft.state !== stateList.APROBADO) {
        allowed.push('editar', 'eliminar');
      }

      return {
        id: draft.preliminaryDraftId,
        title: proposal?.title || 'Sin título',
        description: proposal?.description,
        modality: proposal?.modality || 'No definida',
        state: draft.state,
        allowedActions: allowed
      };
    });
  });

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
    this.deleteState.update(s => ({ ...s, loading: true }));
    this.preliminaryDraftService.deleteDraftMock(state.id).subscribe({
      next: () => {
        this.showDeleteSuccessNotification();
        this.cancelDelete();
      },
      error: () => {
        this.deleteState.update(s => ({ ...s, loading: false }));
        this.showDeleteErrorNotification();
      }
    });
  }

  cancelDelete(): void {
    this.deleteState.set({ show: false, id: null, title: '', loading: false });
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
