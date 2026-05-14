import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TabItem, TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { Document } from '../../../../core/interfaces/Document.interface';
import { stateList } from '../../../../core/enums/state.enum';

const TABS: TabItem[] = [
  { label: 'Anteproyectos', value: 'ANTEPROYECTOS' },
  { label: 'Presentaciones al consejo de facultad', value: 'PRESENTACIONES' }
];

const ANTEPROYECTOS_COLUMNS: Column[] = [
  { field: 'name',       header: 'Nombre de archivo', type: 'text',    width: '35%' },
  { field: 'uploadDate', header: 'Fecha de carga',    type: 'text',    width: '20%' },
  { field: 'status',     header: 'Estado',            type: 'state',   width: '20%' },
  {
    field: 'acciones',
    header: 'Acciones',
    type: 'actions',
    width: '25%',
    // AGREGA ESTO:
    actions: [
      { action: 'download', label: 'Descargar', icon: 'download', variant: 'primary', disabled: false },
      { action: 'evaluate', label: 'Evaluar anteproyecto', icon: 'assignment', variant: 'primary', disabled: false }
    ]
  }
];

const PRESENTACIONES_COLUMNS: Column[] = [
  { field: 'name',       header: 'Nombre de archivo', type: 'text',    width: '35%' },
  { field: 'uploadDate', header: 'Fecha de carga',    type: 'text',    width: '20%' },
  { field: 'status',     header: 'Estado',            type: 'state',   width: '20%' },
  {
    field: 'acciones',
    header: 'Acciones',
    type: 'actions',
    width: '25%',
    // AGREGA ESTO:
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

  readonly tabs = TABS;

  activeTab = signal<string>('ANTEPROYECTOS');
  preliminaryDraftId = signal<string | null>(null);
  uploadState = signal<{ fileName: string, file: File } | null>(null);
  fileModalOpen = signal(false);
  confirmModalOpen = signal(false);

  private readonly currentPreliminaryDraft = computed(() => {
    const id = this.preliminaryDraftId();
    if (!id) return null;
    return this.preliminaryDraftService.preliminaryDrafts().find(preliminaryDraft => preliminaryDraft.preliminaryDraftId === id);
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
    const user = this.authService.currentUser();
    const tab = this.activeTab();

    if (!preliminaryDraft?.documents || !user) return [];

    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isAssignedEvaluator = preliminaryDraft.evaluators?.some((ev: any) => ev.id === user.id);
    const isConsejo = this.authService.hasAnyRole([UserRoleType.CONSEJO]);
    const totalEvaluators = preliminaryDraft.evaluators?.length || 0;

    const sortedDocs = [...preliminaryDraft.documents];
    const latestAnteproyectoId = sortedDocs.find(d => d.type === 'Anteproyecto' || d.type === 'Correccion')?.id;
    const latestPresentacionId = sortedDocs.find(d => d.type === 'Formato')?.id;

    return sortedDocs
      .filter((doc: Document) => {
        if (tab === 'ANTEPROYECTOS') return doc.type === 'Anteproyecto' || doc.type === 'Correccion';
        return doc.type === 'Formato';
      })
      .map((doc: Document) => {
        let displayStatus: stateList;
        let isLatestDoc = false;

        // --- LÓGICA PARA PESTAÑA ANTEPROYECTOS ---
        if (tab === 'ANTEPROYECTOS') {
          isLatestDoc = doc.id === latestAnteproyectoId;
          const technicalStatus = this.preliminaryDraftService.calculateDocumentStatus(
            doc.id, preliminaryDraft.evaluations || [], totalEvaluators
          );

          if (isLatestDoc) {
            if (preliminaryDraft.state === stateList.APROBADO) displayStatus = stateList.APROBADO;
            else if (preliminaryDraft.state === stateList.NO_APROBADO) displayStatus = stateList.NO_APROBADO;
            else displayStatus = technicalStatus === stateList.APROBADO ? stateList.EVALUADO : technicalStatus;
          } else {
            displayStatus = technicalStatus === stateList.APROBADO ? stateList.NO_APROBADO : technicalStatus;
          }

        // --- LÓGICA PARA PESTAÑA PRESENTACIONES (Independencia Total) ---
        } else {
          isLatestDoc = doc.id === latestPresentacionId;

          // Buscamos si ESTE documento específico ya tiene una decisión del consejo
          const presentationStatus = this.preliminaryDraftService.calculateDocumentStatus(
            doc.id, preliminaryDraft.evaluations || [], 1
          );

          if (isLatestDoc) {
            // Si el flujo general terminó en éxito, mostramos Aprobado
            if (preliminaryDraft.state === stateList.APROBADO) {
              displayStatus = stateList.APROBADO;
            } else {
              // Si no, mostramos el estado real del documento (No Aprobado o En Revisión)
              // Esto persiste aunque el estado global cambie por nuevas correcciones de anteproyectos
              displayStatus = presentationStatus;
            }
          } else {
            displayStatus = presentationStatus;
          }
        }

        // --- LÓGICA DE ACCIONES ---
        const allowed = ['download'];
        if (isLatestDoc) {
          const userFullName = `${user.firstName} ${user.lastName}`.trim();
          const userAlreadyEvaluated = preliminaryDraft.evaluations?.some(
            (evalu) => evalu.documentId === doc.id && evalu.evaluatorName.trim() === userFullName
          );

          if (tab === 'ANTEPROYECTOS') {
            const canEvaluate = (isAssignedEvaluator || isAdmin) && !userAlreadyEvaluated &&
                              ![stateList.APROBADO, stateList.NO_APROBADO].includes(preliminaryDraft.state as stateList);
            if (canEvaluate) allowed.push('evaluate');
          } else {
            const canCouncil = (isConsejo || isAdmin) && displayStatus === stateList.EN_REVISION;
            if (canCouncil) allowed.push('evaluate-presentation');
          }
        }

        return { ...doc, status: displayStatus, allowedActions: allowed };
      });
  });

  currentHeaderButtons = computed<TableButton[]>(() => {
    const draft = this.currentPreliminaryDraft();
    const user = this.authService.currentUser();
    if (!draft || !user) return [];

    // REGLA DE CIERRE: Si el proyecto fue Aprobado, desaparecen las acciones de carga superior
    if (draft.state === stateList.APROBADO) {
      return [];
    }

    const isAdmin    = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isJefe     = this.authService.hasAnyRole([UserRoleType.JEFE_DEP]);
    const isDirector = draft.proposalData?.director?.id === user.id;
    const hasReviewers = this.areEvaluatorsAssigned();
    const buttons: TableButton[] = [];

    if (this.activeTab() === 'ANTEPROYECTOS') {
      if (isJefe) {
        buttons.push({
          label: hasReviewers ? 'Evaluadores ya asignados' : 'Asignar evaluadores',
          variant: 'primary',
          disabled: hasReviewers
        });
      }
      else if (isDirector || isAdmin) {
        // Este botón seguirá activo si está EN_REVISION o si fue NO_APROBADO (para el reinicio)
        buttons.push({
          label: 'Cargar anteproyecto corregido',
          variant: 'primary'
        });
      }
    }

    if (this.activeTab() === 'PRESENTACIONES') {
      if (isJefe || isAdmin) {
        buttons.push({
          label: 'Cargar formato de presentación',
          variant: 'primary'
        });
      }
    }
    return buttons;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (id) this.preliminaryDraftId.set(id);
  }

  handleHeaderButton(button: TableButton): void {
    const label = button.label;

    if (label?.includes('Cargar anteproyecto corregido') || label?.includes('Cargar formato de presentación')) {
      this.fileModalOpen.set(true);
    }
    else if (label?.includes('Asignar evaluadores')) {
      this.router.navigate(['assign_evaluators'], { relativeTo: this.route });
    }
  }

  handleTableAction(event: { action: string; row: any }): void {
    if (event.row.allowedActions && !event.row.allowedActions.includes(event.action)) {
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
    this.uploadState.set(event);
    this.fileModalOpen.set(false);
    this.confirmModalOpen.set(true);
  }

  confirmUpload(): void {
    const fileData = this.uploadState();
    const preliminaryDraft = this.currentPreliminaryDraft();
    if (!fileData || !preliminaryDraft?.preliminaryDraftId) return;

    this.showProcessingNotification();

    const newDoc: Document = {
      id: crypto.randomUUID(),
      name: fileData.fileName.replace('.pdf', ''),
      url: '',
      uploadDate: this.formatDate(new Date()),
      type: this.activeTab() === 'ANTEPROYECTOS' ? 'Correccion' : 'Formato',
      status: stateList.EN_REVISION
    };

    this.preliminaryDraftService.uploadDocumentMock(preliminaryDraft.preliminaryDraftId, newDoc).subscribe({
      next: () => {
        this.showSuccessNotification();
        this.cancelUpload();
      },
      error: () => this.showErrorNotification()
    });
  }

  cancelUpload(): void {
    this.confirmModalOpen.set(false);
    this.uploadState.set(null);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' - ');
  }

  private buildPreliminaryDraftActions(doc: Document, draft: any) {
    const user = this.authService.currentUser();
    const actions = [
      { action: 'download', label: 'Descargar anteproyecto', variant: 'primary', disabled: false }
    ];
    const isAssignedEvaluator = draft.reviewers?.some((rev: any) => rev.id === user?.id);
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);

    if (isAssignedEvaluator || isAdmin) {
      actions.push({
        action: 'review_preliminary_draft',
        label: 'Evaluar anteproyecto',
        variant: 'primary',
        disabled: false
      });
    }
    return actions;
  }

  private buildPresentationActions(doc: Document) {
    const actions = [
      { action: 'download', label: 'Descargar presentación', variant: 'primary', disabled: false }
    ];
    const isConsejo = this.authService.hasAnyRole([UserRoleType.CONSEJO, UserRoleType.ADMINISTRADOR]);
    if (isConsejo) {
      actions.push({
        action: 'evaluate_presentation',
        label: 'Evaluar presentación',
        variant: 'primary',
        disabled: false
      });
    }
    return actions;
  }

  private handleDownload(doc: Document): void {
    if (!doc.url) return;
    this.downloadService.download(doc.url, `${doc.name}.pdf`);
  }

  private showProcessingNotification() {
    this.notificationService.show({
      title: 'Subiendo documento',
      message: 'Procesando el archivo en el sistema...',
      type: NotificationType.INFO
    });
  }

  private showSuccessNotification() {
    this.notificationService.show({
      title: '¡Éxito!',
      message: 'El documento se ha cargado correctamente.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showErrorNotification() {
    this.notificationService.show({
      title: 'Error',
      message: 'No se pudo cargar el archivo.',
      type: NotificationType.ERROR
    });
  }

}
