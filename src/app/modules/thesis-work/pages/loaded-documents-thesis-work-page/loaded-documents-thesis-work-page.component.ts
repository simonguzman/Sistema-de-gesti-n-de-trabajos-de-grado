// loaded-documents-thesis-work-page.component.ts
import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TabConfiguration, ThesisEvaluationContext } from './tabs-logic/tab-config.interface';
import { AdvancesTabConfig } from './tabs-logic/advaces.tab';
import { UserRoleType } from '../../../../core/models/user-role';
import { TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ThesisWorkService } from '../../services/thesis-work.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { BreadcrumbService } from '../../../../core/services/breadcrumb/Breadcrumb.service';
import { Title } from '@angular/platform-browser';
import { TabItem, TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Document } from '../../../../core/interfaces/Document.interface';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { stateList } from '../../../../core/enums/state.enum';
import { FinalDeliveryTabConfig } from './tabs-logic/final-delivery.tab';
import { PazYSalvoTabConfig } from './tabs-logic/paz_y_salvo.tab';

@Component({
  selector: 'app-loaded-documents-thesis-work-page',
  templateUrl: './loaded-documents-thesis-work-page.component.html',
  styleUrls: ['./loaded-documents-thesis-work-page.component.css'],
  imports: [FileUploadModalComponent, ConfirmationActionModalComponent, TableComponent, TabsComponent]
})
export class LoadedDocumentsThesisWorkPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly thesisWorkService = inject(ThesisWorkService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly titleService = inject(Title);

  readonly tabsConfig: TabItem[] = [
    { label: 'Avances', value: 'AVANCES' },
    { label: 'Entrega final', value: 'ENTREGA FINAL' },
    { label: 'Paz y salvo', value: 'PAZ Y SALVO' },
    { label: 'Sustentación', value: 'SUSTENTACION' },
    { label: 'Correspondencia', value: 'RESOLUCION' },
    { label: 'Solicitudes especiales', value: 'SOLICITUDES' },
    { label: 'Acta Final', value: 'DOC_FINAL' },
  ];

  private readonly tabStrategies: Record<string, TabConfiguration> = {
    'AVANCES': AdvancesTabConfig,
    'ENTREGA FINAL': FinalDeliveryTabConfig,
    'PAZ Y SALVO': PazYSalvoTabConfig,
    // 📌 Las futuras pestañas se conectarán aquí limpiamente sin alterar este archivo.
  };

  activeTab = signal<string>('AVANCES');
  thesisWorkId = signal<string | null>(null);

  isUploadModalOpen = signal(false);
  isConfirmModalOpen = signal(false);
  uploadContext = signal<{ fileName: string, file: File } | null>(null);

  constructor() {
    effect(() => {
      const matchTab = this.tabsConfig.find(t => t.value === this.activeTab());
      const tabLabel = matchTab ? matchTab.label : 'Documentos';
      setTimeout(() => {
        this.breadcrumbService.setDynamicBreadcrumb(tabLabel);
        this.breadcrumbService.setDynamicTitle(`Trabajo de Grado - ${tabLabel}`);
        this.titleService.setTitle(`Trabajo de Grado - ${tabLabel}`);
      });
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (id) this.thesisWorkId.set(id);
  }

  ngOnDestroy(): void {
    this.breadcrumbService.clearDynamicBreadcrumb();
    this.breadcrumbService.setDynamicTitle(null);
  }

  private readonly currentThesisWork = computed(() => {
    const id = this.thesisWorkId();
    return id ? this.thesisWorkService.thesisWorks().find(w => w.thesisWorkId === id) : null;
  });

  currentStrategy = computed<TabConfiguration>(() => {
    return this.tabStrategies[this.activeTab()] || AdvancesTabConfig;
  });

  // =========================================================================
  // ⚖️ CONTEXTO BASE GENÉRICO: Delegación absoluta de la lógica de negocio
  // =========================================================================
  evaluationContext = computed<ThesisEvaluationContext>(() => {
    const thesis = this.currentThesisWork();
    const user = this.authService.currentUser();
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);
    const isDecanatura = this.authService.hasAnyRole([UserRoleType.DECANATURA]);

    const baseContext: ThesisEvaluationContext = {
      thesisWork: thesis,
      currentUser: user,
      isAdmin,
      isDecanatura,
      isStudent: thesis?.preliminaryDraftData?.proposalData?.authors?.some((a: any) => (typeof a === 'string' ? a : a.id) === user?.id) ?? false,
      isDirector: thesis?.preliminaryDraftData?.proposalData?.director?.id === user?.id,
      isCodirector: thesis?.preliminaryDraftData?.proposalData?.codirector?.id === user?.id,
      isAdvisor: thesis?.preliminaryDraftData?.proposalData?.advisor?.id === user?.id,
      latestAdvanceId: null,
      isLatestAdvancePending: false
    };

    // 🔥 DELEGACIÓN: La estrategia activa inyecta sus propias reglas de negocio
    return this.currentStrategy().enrichEvaluationContext(baseContext);
  });

  currentColumns = computed(() => this.currentStrategy().columns);

  currentHeaderButtons = computed(() => this.currentStrategy().getHeaderButtons(this.evaluationContext()));

  currentTableData = computed(() => {
    const context = this.evaluationContext();
    const thesis = context.thesisWork;
    if (!thesis) return [];

    // Si la pestaña es AVANCES, se le pasa un array vacío ya que lee directamente de 'advances' desde su estrategia
    const docs = this.activeTab() === 'AVANCES' ? [] : (thesis.documents || []);
    return this.currentStrategy().getTableData(docs, context);
  });

  handleHeaderButton(button: TableButton): void {
    if (button.label?.toLowerCase().includes('cargar') || button.label?.toLowerCase().includes('registrar')) {
      if (this.activeTab() === 'AVANCES') {
        this.router.navigate(['upload_advance'], { relativeTo: this.route });
      } else if (this.activeTab() === 'ENTREGA FINAL') {
        this.router.navigate(['upload_final_delivery'], { relativeTo: this.route });
      } else if (this.activeTab() === 'PAZ Y SALVO') {
        // 🚀 Agregamos la ruta para el Paz y Salvo (asegúrate de registrarla en tu routing module)
        this.router.navigate(['register_paz_y_salvo'], { relativeTo: this.route });
      } else {
        this.isUploadModalOpen.set(true);
      }
    }
  }

  handleTableAction(event: { action: string; row: any }): void {
    if (event.row.allowedActions && !event.row.allowedActions.includes(event.action)) {
      this.showRestrictedActionNotification();
      return;
    }

    if (event.action === 'download') {
      this.handleDownload(event.row);
    } else if (event.action === 'evaluate-advance') {
      // 🚀 Apunta exactamente al segmento con guión bajo 'evaluate_advance' configurado en tus rutas
      this.router.navigate(['evaluate_advance', event.row.id], { relativeTo: this.route });
    } else {
      this.router.navigate([event.action], { relativeTo: this.route });
    }
  }

  onFileSelected(event: { fileName: string; file: File }): void {
    this.uploadContext.set(event);
    this.isUploadModalOpen.set(false);
    this.isConfirmModalOpen.set(true);
  }

  confirmUpload(): void {
    const selectedFileData = this.uploadContext();
    const thesisId = this.thesisWorkId();
    if (!selectedFileData || !thesisId) return;

    this.showProcessingNotification();

    const newDocumentRecord: Document = {
      id: crypto.randomUUID(),
      name: selectedFileData.fileName.replace('.pdf', ''),
      url: '',
      uploadDate: this.formatDate(new Date()),
      type: this.currentStrategy().modalConfig.uploadDocumentType,
      status: stateList.EN_REVISION
    };

    this.thesisWorkService.uploadDocumentMock(thesisId, newDocumentRecord).subscribe({
      next: () => {
        this.showSuccessNotification();
        this.cancelUpload();
      },
      error: (err) => {
        console.error('Error detectado en la carga de archivos:', err);
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

  private handleDownload(doc: Document): void {
    if (!doc.url) {
      this.notificationService.show({ title: 'Error de descarga', message: 'No existe una URL válida vinculada a este archivo.', type: NotificationType.ERROR });
      return;
    }
    this.downloadService.download(doc.url, `${doc.name}.pdf`);
  }

  private showProcessingNotification() {
    this.notificationService.show({ title: 'Subiendo documento', message: 'Procesando el archivo PDF y actualizando los registros...', type: NotificationType.INFO });
  }

  private showSuccessNotification() {
    this.notificationService.show({ title: '¡Carga exitosa!', message: 'El documento se cargó correctamente y el flujo de estados ha sido actualizado.', type: NotificationType.CONFIRMATION });
  }

  private showErrorNotification() {
    this.notificationService.show({ title: 'Error de carga', message: 'Hubo un problema al subir el archivo. Inténtelo de nuevo.', type: NotificationType.ERROR });
  }

  private showRestrictedActionNotification() {
    this.notificationService.show({ title: 'Acción no permitida', message: 'Su usuario no posee los privilegios necesarios para ejecutar esta evaluación.', type: NotificationType.ERROR });
  }
}
