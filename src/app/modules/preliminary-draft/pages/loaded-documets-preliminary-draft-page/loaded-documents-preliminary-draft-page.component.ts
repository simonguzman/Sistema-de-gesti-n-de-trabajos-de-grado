import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import { TabItem, TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

import { Document, DocumentType } from '../../../../core/interfaces/Document.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { BreadcrumbService } from '../../../../core/services/breadcrumb/Breadcrumb.service';
import { Title } from '@angular/platform-browser';

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

interface DocumentEvaluationContext {
  preliminaryDraft: any;
  currentUser: any;
  currentTab: string;
  isAdmin: boolean;
  isAssignedEvaluator: boolean;
  isConsejoMember: boolean;
  totalEvaluatorsCount: number;
  latestAnteproyectoId?: string;
  latestPresentacionId?: string;
}

@Component({
  selector: 'app-loaded-documets-preliminary-draft-page',
  templateUrl: './loaded-documents-preliminary-draft-page.component.html',
  styleUrls: ['./loaded-documents-preliminary-draft-page.component.css'],
  imports: [FileUploadModalComponent, ConfirmationActionModalComponent, TableComponent, TabsComponent]
})
export class LoadedDocumentsPreliminaryDraftPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly titleService = inject(Title);

  readonly tabs = DOCUMENT_TABS_CONFIG;
  activeTab = signal<string>('ANTEPROYECTOS');
  preliminaryDraftId = signal<string | null>(null);
  // Variables de estado renombradas para mayor claridad semántica
  uploadContext = signal<{ fileName: string, file: File } | null>(null);
  isUploadModalOpen = signal(false);
  isConfirmModalOpen = signal(false);

  constructor() {
    effect(() => {
      const tab = this.activeTab();
      const tabLabel = tab === 'ANTEPROYECTOS'
        ? 'Anteproyectos'
        : 'Presentaciones al consejo de facultad';
      this.breadcrumbService.setDynamicBreadcrumb(tabLabel);
      this.breadcrumbService.setDynamicTitle(`Documentos cargados - ${tabLabel}`);
      this.titleService.setTitle(`Documentos cargados - ${tabLabel}`);
    });
  }

  ngOnInit(): void {
    const preliminaryDraftId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (preliminaryDraftId) this.preliminaryDraftId.set(preliminaryDraftId);
  }

  ngOnDestroy(): void {
    this.breadcrumbService.clearDynamicBreadcrumb();
    this.breadcrumbService.setDynamicTitle(null);
  }

  private readonly currentPreliminaryDraft = computed(() => {
    const id = this.preliminaryDraftId();
    if (!id) return null;
    return this.preliminaryDraftService.preliminaryDrafts().find(draft => draft.preliminaryDraftId === id);
  });

  readonly areEvaluatorsAssigned = computed(() => {
    const preliminaryDraft = this.currentPreliminaryDraft();
    return !!(preliminaryDraft?.evaluators && preliminaryDraft.evaluators.length > 0);
  });


  currentColumns = computed(() => {
    return this.activeTab() === 'ANTEPROYECTOS' ? ANTEPROYECTOS_COLUMNS : PRESENTACIONES_COLUMNS;
  });

  currentTableData = computed(() => {
    const preliminaryDraft = this.currentPreliminaryDraft();
    const currentUser = this.authService.currentUser();
    const currentTab = this.activeTab();
    if (!preliminaryDraft?.documents || !currentUser) return [];
    const allDocuments = [...preliminaryDraft.documents];
    const filteredDocuments = this.filterDocumentsByTab(allDocuments, currentTab);
    const { latestAnteproyectoId, latestPresentacionId } = this.getLatestDocumentIds(allDocuments);
    // Agrupamos el contexto para no saturar los métodos con parámetros
    const context: DocumentEvaluationContext = {
      preliminaryDraft,
      currentUser,
      currentTab,
      isAdmin: this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]),
      isAssignedEvaluator: preliminaryDraft.evaluators?.some((ev: any) => ev.id === currentUser.id) ?? false,
      isConsejoMember: this.authService.hasAnyRole([UserRoleType.CONSEJO]),
      totalEvaluatorsCount: preliminaryDraft.evaluators?.length || 0,
      latestAnteproyectoId,
      latestPresentacionId
    };
    return filteredDocuments.map((document: Document) => {
      const status = this.determineDocumentStatus(document, context);
      const allowedActions = this.determineAllowedActions(document, status, context);
      return { ...document, status, allowedActions };
    });
  });

  private filterDocumentsByTab(documents: Document[], tab: string): Document[] {
    return documents.filter(document =>
      tab === 'ANTEPROYECTOS'
        ? (document.type === 'Anteproyecto' || document.type === 'Correccion')
        : document.type === 'Formato'
    );
  }

  private getLatestDocumentIds(documents: Document[]): { latestAnteproyectoId?: string, latestPresentacionId?: string } {
    return {
      latestAnteproyectoId: documents.find(document => document.type === 'Anteproyecto' || document.type === 'Correccion')?.id,
      latestPresentacionId: documents.find(document => document.type === 'Formato')?.id
    };
  }

  private determineDocumentStatus(document: Document, context: DocumentEvaluationContext): stateList {
    const { currentTab } = context;
    if (currentTab === 'ANTEPROYECTOS') {
      return this.calculateAnteproyectoStatus(document, context);
    }
    return this.calculatePresentationStatus(document, context);
  }

  private calculateAnteproyectoStatus(document: Document, context: DocumentEvaluationContext): stateList {
    const { preliminaryDraft, totalEvaluatorsCount, latestAnteproyectoId } = context;
    const isLatestDoc = document.id === latestAnteproyectoId;
    const technicalStatus = this.preliminaryDraftService.calculateDocumentStatus(
      document.id, preliminaryDraft.evaluations || [], totalEvaluatorsCount
    );
    // Lógica para documentos antiguos
    if (!isLatestDoc) {
      return technicalStatus === stateList.APROBADO ? stateList.NO_APROBADO : technicalStatus;
    }
    // Lógica para el documento más reciente (Estados finales del anteproyecto)
    if (preliminaryDraft.state === stateList.APROBADO) return stateList.APROBADO;
    if (preliminaryDraft.state === stateList.NO_APROBADO) return stateList.NO_APROBADO;
    // Si está aprobado técnicamente pero el anteproyecto sigue en curso
    return technicalStatus === stateList.APROBADO ? stateList.EVALUADO : technicalStatus;
  }

  private calculatePresentationStatus(document: Document, context: DocumentEvaluationContext): stateList {
    const { preliminaryDraft, latestPresentacionId } = context;
    const isLatestDoc = document.id === latestPresentacionId;
    const presentationStatus = this.preliminaryDraftService.calculateDocumentStatus(
      document.id, preliminaryDraft.evaluations || [], 1
    );
    // Si es el último formato y el anteproyecto general ya fue aprobado
    if (isLatestDoc && preliminaryDraft.state === stateList.APROBADO) {
      return stateList.APROBADO;
    }
    return presentationStatus;
  }

  private determineAllowedActions(document: Document, displayStatus: stateList, context: DocumentEvaluationContext): string[] {
    const { preliminaryDraft, currentUser, currentTab, isAdmin, isAssignedEvaluator, isConsejoMember, latestAnteproyectoId, latestPresentacionId } = context;
    const allowed = ['download'];
    const isLatestDoc = currentTab === 'ANTEPROYECTOS'
      ? document.id === latestAnteproyectoId
      : document.id === latestPresentacionId;
    if (!isLatestDoc) return allowed;
    if (currentTab === 'ANTEPROYECTOS') {
      const userFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
      const userAlreadyEvaluated = preliminaryDraft.evaluations?.some(
        (evaluation: any) => evaluation.documentId === document.id && evaluation.evaluatorName.trim() === userFullName
      );
      const draftHasFinalState = [stateList.APROBADO, stateList.NO_APROBADO].includes(preliminaryDraft.state as stateList);
      const canEvaluate = (isAssignedEvaluator || isAdmin) && !userAlreadyEvaluated && !draftHasFinalState;
      if (canEvaluate) allowed.push('evaluate');
    } else {
      // Pestaña PRESENTACIONES
      const canCouncil = (isConsejoMember || isAdmin) && displayStatus === stateList.EN_REVISION;
      if (canCouncil) allowed.push('evaluate-presentation');
    }
    return allowed;
  }

  currentHeaderButtons = computed<TableButton[]>(() => {
    const preliminaryDraft = this.currentPreliminaryDraft();
    const user = this.authService.currentUser();
    if (!preliminaryDraft || !user) return [];
    const roleContext = this.getUserRoleContext(preliminaryDraft, user);
    return this.activeTab() === 'ANTEPROYECTOS'
      ? this.getAnteproyectoHeaderActions(preliminaryDraft, roleContext)
      : this.getPresentationHeaderActions(preliminaryDraft, roleContext);
  });

/**
 * Determina los roles del usuario actual respecto al borrador
 */
  private getUserRoleContext(draft: any, user: any) {
    return {
      isAdmin: this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]),
      isJefe: this.authService.hasAnyRole([UserRoleType.JEFE_DEP]),
      isDirector: draft.proposalData?.director?.id === user.id
    };
  }

  /**
   * Lógica de botones para la pestaña de Anteproyectos
   */
  private getAnteproyectoHeaderActions(draft: any, roles: any): TableButton[] {
    const actions: TableButton[] = [];
    const reviewersReady = this.areEvaluatorsAssigned();
    if (roles.isJefe) {
      actions.push({
        label: reviewersReady ? 'Evaluadores ya asignados' : 'Asignar evaluadores',
        variant: 'primary',
        disabled: reviewersReady
      });
      return actions;
    }
    if (roles.isDirector || roles.isAdmin) {
      const technicalStatus = this.getLatestAnteproyectoStatus(draft);
      const isGlobalApproved = draft.state === stateList.APROBADO;
      actions.push({
        label: 'Cargar anteproyecto corregido',
        variant: 'primary',
        disabled: technicalStatus === stateList.EN_REVISION || isGlobalApproved
      });
    }
    return actions;
  }

  /**
   * Lógica de botones para la pestaña de Presentaciones
   */
  private getPresentationHeaderActions(draft: any, roles: any): TableButton[] {
    if (!roles.isJefe && !roles.isAdmin) return [];
    const isFlowReady = this.checkIfFlowIsReadyForPresentation(draft);
    return [{
      label: 'Cargar formato de presentación',
      variant: 'primary',
      disabled: !isFlowReady
    }];
  }

  /**
   * Verifica si el estado técnico del último anteproyecto/corrección permite pasar a presentación
   */
  private checkIfFlowIsReadyForPresentation(preliminaryDraft: any): boolean {
    const documents = preliminaryDraft.documents || [];
    const latestDoc = documents.length > 0 ? documents[0] : null;
    if (!latestDoc || (latestDoc.type !== 'Anteproyecto' && latestDoc.type !== 'Correccion')) {
      return false;
    }
    const status = this.preliminaryDraftService.calculateDocumentStatus(
      latestDoc.id,
      preliminaryDraft.evaluations || [],
      preliminaryDraft.evaluators?.length || 0
    );
    return status === stateList.APROBADO;
  }

  /**
   * Obtiene el estado técnico del último anteproyecto cargado
   */
  private getLatestAnteproyectoStatus(preliminaryDraft: any): stateList {
    const latest = preliminaryDraft.documents?.find((document: any) => document.type === 'Anteproyecto' || document.type === 'Correccion');
    if (!latest) return stateList.EN_REVISION;
    return this.preliminaryDraftService.calculateDocumentStatus(
      latest.id,
      preliminaryDraft.evaluations || [],
      preliminaryDraft.evaluators?.length || 0
    );
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
      type: this.activeTab() === DocumentType.ANTEPROYECTO ? DocumentType.CORRECCION : DocumentType.FORMATO,
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
