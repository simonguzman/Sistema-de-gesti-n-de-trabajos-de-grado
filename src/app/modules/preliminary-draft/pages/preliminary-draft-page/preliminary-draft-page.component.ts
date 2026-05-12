import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../core/enums/state.enum';
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
  private router = inject(Router);
  private preliminaryDraftService = inject(PreliminaryDraftService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  protected columns: Column[] = [];
  protected headerButtons: TableButton[] = [];
  protected stateList = stateList;
  protected tableData = computed(() => {
    return this.preliminaryDraftService.preliminaryDrafts().map(preliminaryDraft => ({
      id: preliminaryDraft.preliminaryDraftId,
      title: preliminaryDraft.proposalData?.title || 'Sin título',
      description: preliminaryDraft.proposalData?.description,
      modality: preliminaryDraft.proposalData?.modality || 'No definida',
      director: this.userService.getUserFullName(preliminaryDraft.proposalData?.director.id),
      directorId: preliminaryDraft.proposalData?.director.id,
      authors: this.userService.getAuthorsNames(preliminaryDraft.proposalData?.authors),
      state: preliminaryDraft.state,
      raw: preliminaryDraft,
    }));
  });

  descriptionModal = signal({
    show: false,
    title: '',
    content: ''
  });

  deleteState = signal({
    show: false,
    id: null as string | null,
    title: '',
    loading: false
  });

  ngOnInit(): void {
    this.configurePremissions();
  }

  private configurePremissions(): void {
    const isDirector = this.authService.hasAnyRole([UserRoleType.DIRECTOR]);
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR, UserRoleType.JEFE_DEP]);
    if(isDirector || isAdmin){
      this.headerButtons = [
        { label: 'Formatos descargables', variant:'primary' },
        { label: 'Registrar anteproyecto', variant:'primary' }
      ]
    } else {
      this.headerButtons = [
        { label: 'Formatos descargables', variant:'primary' },
      ]
    }
    this.columns = PRELIMINARY_DRAFT_COLUMNS.map(column => {
      if(column.field === 'acciones'){
        return{
          ...column,
          actions: column.actions?.filter(columnAction => {
            if(isAdmin) return true;
            if(this.authService.hasAnyRole([UserRoleType.EVALUADOR])) return columnAction.action === 'ver';
            return true;
          })
        };
      }
      return column;
    });
  }

  handleTableAction(event: { action: string, row: any }): void {
    const currentUser = this.authService.currentUser();
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR, UserRoleType.JEFE_DEP]);
    if((event.action === 'editar' || event.action === 'eliminar') && !isAdmin){
      if(event.row.directorId !== currentUser?.id){
        this.showRestrictedNotification()
        return;
      }
    }
    switch (event.action){
      case 'ver descripción':
        this.descriptionModal.set({
          show: true,
          title: 'Descripción del anteproyecto',
          content: event.row.description || 'Sin descripción disponible.'
        })
        break;
      case 'ver':
        this.router.navigate(['/preliminary-draft/details', event.row.id]);
        break;
      case 'editar':
        this.router.navigate(['/preliminary-draft/edit', event.row.id])
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
    if(button.label === 'Registrar anteproyecto'){
      this.router.navigate(['/preliminary-draft/create']);
    }
  }

  confirmDelete(): void {
    const state = this.deleteState();
    if (!state.id || state.loading) return;

    this.deleteState.update(s => ({ ...s, loading: true }));

    // Notificación de inicio (Igual que en propuestas)
    this.showDeleteInfoNotification();

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
    this.deleteState.set({ show: false, id: null, title: '', loading: false});
  }

  closeDescriptionModal(): void {
    this.descriptionModal.update(state => ({
      ...state,
      show: false
    }))
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
      message: 'No se pudo eliminar el anteproyecto. Intente de nuevo.',
      type: NotificationType.ERROR
    });
  }

  private showRestrictedNotification(): void {
    this.notificationService.show({
      title: 'Acceso denegado',
      message: 'Solo el director asignado puede realizar esta acción.',
      type: NotificationType.ERROR
    });
  }

}
