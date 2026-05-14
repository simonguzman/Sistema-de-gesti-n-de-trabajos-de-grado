import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import { TabItem, TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

import { Document } from '../../../../core/interfaces/Document.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { preliminaryDraftRoutes } from '../../preliminary-draft.routes';

const DOCUMENT_TABS_CONFIG: TabItem[] = [
  { label: 'Anteproyectos', value: 'ANTEPROYECTOS' },
  { label: 'Presentaciones al consejo de facultad', value: 'PRESENTACIONES' }
];

const ANTEPROYECTOS_COLUMNS: Column[] = [
  { field: 'name', header: 'Nombre de archivo', type: 'text', width: '35%' },
  { field: 'uploadDate', header: 'Fecha de carga', type: 'text', width: '20%' },
  { field: 'status', header: 'Estado', type: 'state', width: '20%' },
  {
    field: 'acciones',
    header: 'Acciones',
    type: 'actions',
    width: '25%',
    actions: [
      { action: 'download', label: 'Descargar', icon: 'download', variant: 'primary', disabled: false },
      { action: 'evaluate', label: 'Evaluar anteproyecto', icon: 'assignment', variant: 'primary', disabled: false }
    ]
  }
];

const PRESENTACIONES_COLUMNS: Column[] = [
  { field: 'name', header: 'Nombre de archivo', type: 'text', width: '35%' },
  { field: 'uploadDate', header: 'Fecha de carga', type: 'text', width: '20%' },
  { field: 'status', header: 'Estado', type: 'state', width: '20%' },
  {
    field: 'acciones',
    header: 'Acciones',
    type: 'actions',
    width: '25%',
    actions: [
      { action: 'download', label: 'Descargar', icon: 'download', variant: 'primary', disabled: false },
      { action: 'evaluate-presentation', label: 'Evaluar presentación', icon: 'assignment', variant: 'primary', disabled: false }
    ]
  }
];

@Component({
  selector: 'app-loaded-documets-preliminary-draft-page',
  templateUrl: './loaded-documets-preliminary-draft-page.component.html',
  styleUrls: ['./loaded-documets-preliminary-draft-page.component.css'],
  imports: [FileUploadModalComponent, ConfirmationActionModalComponent, TableComponent, TabsComponent]
})
export class LoadedDocumetsPreliminaryDraftPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly tabs = DOCUMENT_TABS_CONFIG;
  activeTab = signal<string>('ANTEPROYECTOS');
  preliminaryDraftId = signal<string | null>(null);
  // Variables de estado renombradas para mayor claridad semántica
  uploadContext = signal<{ fileName: string, file: File } | null>(null);
  isUploadModalOpen = signal(false);
  isConfirmModalOpen = signal(false);

  private readonly currentPreliminaryDraft = computed(() => {
    const id = this.preliminaryDraftId();
    if (!id) return null;
    return this.preliminaryDraftService.preliminaryDrafts().find(draft => draft.preliminaryDraftId === id);
  });

  readonly areEvaluatorsAssigned = computed(() => {
    const draft = this.currentPreliminaryDraft();
    return !!(draft?.evaluators && draft.evaluators.length > 0);
  });

  currentColumns = computed(() => {
    return this.activeTab() === 'ANTEPROYECTOS' ? ANTEPROYECTOS_COLUMNS : PRESENTACIONES_COLUMNS;
  });

  currentTableData = computed(() => {
    const preliminaryDraft = this.currentPreliminaryDraft();
    const currentUser = this.authService.currentUser();
    const currentTab = this.activeTab();
    if (!preliminaryDraft?.documents || !currentUser) return [];
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isAssignedEvaluator = preliminaryDraft.evaluators?.some((ev: any) => ev.id === currentUser.id);
    const isConsejoMember = this.authService.hasAnyRole([UserRoleType.CONSEJO]);
    const totalEvaluatorsCount = preliminaryDraft.evaluators?.length || 0;
    const allDocuments = [...preliminaryDraft.documents];
    const latestAnteproyectoId = allDocuments.find(d => d.type === 'Anteproyecto' || d.type === 'Correccion')?.id;
    const latestPresentacionId = allDocuments.find(d => d.type === 'Formato')?.id;
    return allDocuments
      .filter((document: Document) => {
        if (currentTab === 'ANTEPROYECTOS') return document.type === 'Anteproyecto' || document.type === 'Correccion';
        return document.type === 'Formato';
      })
      .map((document: Document) => {
        let displayStatus: stateList;
        let isLatestDoc = false;
        if (currentTab === 'ANTEPROYECTOS') {
          isLatestDoc = document.id === latestAnteproyectoId;
          const technicalStatus = this.preliminaryDraftService.calculateDocumentStatus(
            document.id, preliminaryDraft.evaluations || [], totalEvaluatorsCount
          );
          if (isLatestDoc) {
            if (preliminaryDraft.state === stateList.APROBADO) displayStatus = stateList.APROBADO;
            else if (preliminaryDraft.state === stateList.NO_APROBADO) displayStatus = stateList.NO_APROBADO;
            else displayStatus = technicalStatus === stateList.APROBADO ? stateList.EVALUADO : technicalStatus;
          } else {
            displayStatus = technicalStatus === stateList.APROBADO ? stateList.NO_APROBADO : technicalStatus;
          }
        } else {
          isLatestDoc = document.id === latestPresentacionId;
          const presentationStatus = this.preliminaryDraftService.calculateDocumentStatus(
            document.id, preliminaryDraft.evaluations || [], 1
          );
          if (isLatestDoc) {
            if (preliminaryDraft.state === stateList.APROBADO) {
              displayStatus = stateList.APROBADO;
            } else {
              displayStatus = presentationStatus;
            }
          } else {
            displayStatus = presentationStatus;
          }
        }
        const allowed = ['download'];
        if (isLatestDoc) {
          const userFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
          const userAlreadyEvaluated = preliminaryDraft.evaluations?.some(
            (evalu) => evalu.documentId === document.id && evalu.evaluatorName.trim() === userFullName
          );
          if (currentTab === 'ANTEPROYECTOS') {
            const canEvaluate = (isAssignedEvaluator || isAdmin) && !userAlreadyEvaluated &&
                                ![stateList.APROBADO, stateList.NO_APROBADO].includes(preliminaryDraft.state as stateList);
            if (canEvaluate) allowed.push('evaluate');
          } else {
            const canCouncil = (isConsejoMember || isAdmin) && displayStatus === stateList.EN_REVISION;
            if (canCouncil) allowed.push('evaluate-presentation');
          }
        }
        return { ...document, status: displayStatus, allowedActions: allowed };
      });
  });

  currentHeaderButtons = computed<TableButton[]>(() => {
    const preliminaryDraft = this.currentPreliminaryDraft();
    const user = this.authService.currentUser();
    if (!preliminaryDraft || !user) return [];
    if (preliminaryDraft.state === stateList.APROBADO) {
      return [];
    }
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isJefe = this.authService.hasAnyRole([UserRoleType.JEFE_DEP]);
    const isDirector = preliminaryDraft.proposalData?.director?.id === user.id;
    const reviewersReady = this.areEvaluatorsAssigned();
    const actions: TableButton[] = [];
    if (this.activeTab() === 'ANTEPROYECTOS') {
      if (isJefe) {
        actions.push({
          label: reviewersReady ? 'Evaluadores ya asignados' : 'Asignar evaluadores',
          variant: 'primary',
          disabled: reviewersReady
        });
      }
      else if (isDirector || isAdmin) {
        actions.push({
          label: 'Cargar anteproyecto corregido',
          variant: 'primary'
        });
      }
    }
    if (this.activeTab() === 'PRESENTACIONES') {
      if (isJefe || isAdmin) {
        actions.push({
          label: 'Cargar formato de presentación',
          variant: 'primary'
        });
      }
    }
    return actions;
  });

  ngOnInit(): void {
    const draftId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (draftId) this.preliminaryDraftId.set(draftId);
  }

  handleHeaderButton(button: TableButton): void {
    const buttonLabel = button.label;
    if (buttonLabel?.includes('Cargar anteproyecto corregido') || buttonLabel?.includes('Cargar formato de presentación')) {
      this.isUploadModalOpen.set(true);
    }
    else if (buttonLabel?.includes('Asignar evaluadores')) {
      this.router.navigate(['assign_evaluators'], { relativeTo: this.route });
    }
  }

  handleTableAction(event: { action: string; row: any }): void {
    if (event.row.allowedActions && !event.row.allowedActions.includes(event.action)) {
      this.showRestrictedActionNotification();
      return;
    }
    switch (event.action) {
      case 'download':
        this.handleDownload(event.row);
        break;
      case 'evaluate':
        this.router.navigate(['review_preliminary_draft'], { relativeTo: this.route });
        break;
      case 'evaluate-presentation':
        this.router.navigate(['evaluate_presentation'], { relativeTo: this.route });
        break;
    }
  }

  onFileSelected(event: { fileName: string; file: File }): void {
    this.uploadContext.set(event);
    this.isUploadModalOpen.set(false);
    this.isConfirmModalOpen.set(true);
  }

  confirmUpload(): void {
    const selectedFileData = this.uploadContext();
    const preliminaryDraft = this.currentPreliminaryDraft();
    if (!selectedFileData || !preliminaryDraft?.preliminaryDraftId) return;
    this.showProcessingNotification();
    const newDocumentRecord: Document = {
      id: crypto.randomUUID(),
      name: selectedFileData.fileName.replace('.pdf', ''),
      url: '',
      uploadDate: this.formatDate(new Date()),
      type: this.activeTab() === 'ANTEPROYECTOS' ? 'Correccion' : 'Formato',
      status: stateList.EN_REVISION
    };
    this.preliminaryDraftService.uploadDocumentMock(preliminaryDraft.preliminaryDraftId, newDocumentRecord).subscribe({
      next: () => {
        this.showSuccessNotification();
        this.cancelUpload();
      },
      error: (err) => {
        console.error('Error en carga:', err);
        this.showErrorNotification();
      }
    });
  }

  cancelUpload(): void {
    this.isConfirmModalOpen.set(false);
    this.uploadContext.set(null);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' - ');
  }

  // MÉTODOS PRIVADOS DE CONSTRUCCIÓN DE ACCIONES (SIN CAMBIO DE LÓGICA)
  private buildPreliminaryDraftActions(doc: Document, draft: any) {
    const user = this.authService.currentUser();
    const actionList = [
      { action: 'download', label: 'Descargar anteproyecto', variant: 'primary', disabled: false }
    ];
    const isAssignedEvaluator = draft.reviewers?.some((rev: any) => rev.id === user?.id);
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);

    if (isAssignedEvaluator || isAdmin) {
      actionList.push({
        action: 'review_preliminary_draft',
        label: 'Evaluar anteproyecto',
        variant: 'primary',
        disabled: false
      });
    }
    return actionList;
  }

  private buildPresentationActions(doc: Document) {
    const actionList = [
      { action: 'download', label: 'Descargar presentación', variant: 'primary', disabled: false }
    ];
    const isConsejo = this.authService.hasAnyRole([UserRoleType.CONSEJO, UserRoleType.ADMINISTRADOR]);
    if (isConsejo) {
      actionList.push({
        action: 'evaluate_presentation',
        label: 'Evaluar presentación',
        variant: 'primary',
        disabled: false
      });
    }
    return actionList;
  }

  private handleDownload(doc: Document): void {
    if (!doc.url) {
      this.notificationService.show({
        title: 'Error de descarga',
        message: 'No existe una URL válida para este documento.',
        type: NotificationType.ERROR
      });
      return;
    }
    this.downloadService.download(doc.url, `${doc.name}.pdf`);
  }

  // --- MÉTODOS DE NOTIFICACIÓN ---

  private showProcessingNotification() {
    this.notificationService.show({
      title: 'Subiendo documento',
      message: 'Estamos procesando y registrando el archivo en el sistema...',
      type: NotificationType.INFO
    });
  }

  private showSuccessNotification() {
    this.notificationService.show({
      title: '¡Carga exitosa!',
      message: 'El nuevo documento ha sido registrado y está disponible para revisión.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showErrorNotification() {
    this.notificationService.show({
      title: 'Error de carga',
      message: 'No se pudo completar la subida del archivo. Por favor, intente de nuevo.',
      type: NotificationType.ERROR
    });
  }

  private showRestrictedActionNotification() {
    this.notificationService.show({
      title: 'Acción no permitida',
      message: 'No tiene los permisos requeridos o el estado actual del documento no permite esta acción.',
      type: NotificationType.ERROR
    });
  }
}
