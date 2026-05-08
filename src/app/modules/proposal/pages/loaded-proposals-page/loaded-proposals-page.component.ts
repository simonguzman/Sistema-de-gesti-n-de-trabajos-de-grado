import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalDocument } from '../../interfaces/proposalDocument.inteface';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { stateList } from '../../../../shared/components/state/state.component';
import { ProposalService } from '../../services/proposal.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserRoleType } from '../../../../core/models/user-role';

const DOCUMENTS_COLUMNS: Column[] = [
  { field: 'name',       header: 'Nombre de archivo', type: 'text',    width: '35%' },
  { field: 'uploadDate', header: 'Fecha de carga',    type: 'text',    width: '20%' },
  { field: 'status',     header: 'Estado',            type: 'state',   width: '20%' },
  { field: 'acciones',   header: 'Acciones',          type: 'actions', width: '25%' }
];

@Component({
  selector: 'app-loaded-proposals-page',
  imports: [ TableComponent, FileUploadModalComponent, ConfirmationActionModalComponent],
  templateUrl: './loaded-proposals-page.component.html',
  styleUrls: ['./loaded-proposals-page.component.css']
})
export class LoadedProposalsPageComponent implements OnInit {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private proposalService     = inject(ProposalService);
  private downloadService     = inject(FileDownloadService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  readonly columns = DOCUMENTS_COLUMNS;

  proposalId = signal<string | null>(null);

  // Estado del flujo de carga agrupado
  uploadState = signal<{ fileName: string; file: File } | null>(null);
  fileModalOpen    = signal(false);
  confirmModalOpen = signal(false);

  private currentProposal = computed(() => {
    const id = this.proposalId();
    return this.proposalService.proposals().find(proposal => proposal.id === id);
  })

  documentsTableData = computed(() => {
    const id = this.proposalId();
    if (!id) return [];
    const proposal = this.proposalService.proposals().find(p => p.id === id);
    if (!proposal) return [];
    return proposal.documents.map(doc => ({
      ...doc,
      acciones: this.buildDocumentActions(doc)
    }));
  });

  headerButtons = computed<TableButton[]>(() => {
    const proposal = this.currentProposal();
    const user = this.authService.currentUser();
    if (!proposal || !user) return [];

    // Validar si es Autor, Director o Admin
    const isDirector = proposal.directorId === user.id;
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);

    if ( !isDirector && !isAdmin) return [];

    const latest = this.documentsTableData()[0];
    const isApproved = latest?.status === stateList.APROBADO ||
                      latest?.status === stateList.APROBADO_CON_OBSERVACIONES;

    return [{
      label: 'Cargar propuesta corregida',
      variant: 'primary' as const,
      disabled: isApproved
    }];
  });

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) this.proposalId.set(id);
  }

  handleHeaderButton(): void {
    const proposal = this.currentProposal();
    const user = this.authService.currentUser();

    const isDirector = proposal?.directorId === user?.id;
    const isAdmin = this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR]);

    if ( isDirector || isAdmin) {
      this.fileModalOpen.set(true);
    } else {
      this.notificationService.show({
        title: 'Acceso denegado',
        message: 'No tienes permisos para cargar documentos en esta propuesta.',
        type: NotificationType.INFO
      });
    }
  }

  handleTableAction(event: { action: string; row: ProposalDocument }): void {
    switch (event.action) {
      case 'download':
        this.handleDownload(event.row);
        break;
      case 'evaluate':
        this.router.navigate(['evaluate_proposal'], { relativeTo: this.route });
        break;
    }
  }

  onFileSelected(event: { fileName: string; file: File }): void {
    this.uploadState.set(event);
    this.fileModalOpen.set(false);
    this.confirmModalOpen.set(true);
  }

  confirmUpload(): void {
    const fileData  = this.uploadState();
    const id        = this.proposalId();
    if (!fileData || !id) return;

    const newDoc: ProposalDocument = {
      id:         crypto.randomUUID(),
      name:       fileData.fileName.replace('.pdf', ''),
      url:        '',
      uploadDate: this.formatDate(new Date()),
      type:       'Correccion',
      status:     stateList.EN_REVISION
    };

    this.proposalService.uploadCorrectionMock(id, newDoc).subscribe({
      next: () => {
        this.confirmModalOpen.set(false);
        this.uploadState.set(null);
      }
    });
  }

  cancelUpload(): void {
    this.confirmModalOpen.set(false);
    this.uploadState.set(null);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private buildDocumentActions(doc: ProposalDocument) {
    const actions = [
      { action: 'download', label: 'Descargar propuesta', variant: 'primary', disabled: false }
    ];

    // Solo agregar la acción de evaluar si tiene el rol permitido
    if (this.authService.hasAnyRole([UserRoleType.COMITE, UserRoleType.ADMINISTRADOR])) {
      actions.push({
        action: 'evaluate',
        label: 'Evaluar propuesta',
        variant: 'primary',
        disabled: doc.status !== stateList.EN_REVISION
      });
    }

    return actions;
  }

  private handleDownload(doc: ProposalDocument): void {
    if (!doc.url?.trim()) {
      this.notificationService.show({
        title:   'Archivo no disponible',
        message: 'El documento no tiene una ruta de descarga configurada.',
        type:    NotificationType.INFO
      });
      return;
    }
    this.notificationService.show({
      title:   'Descarga iniciada',
      message: 'Descargando archivo...',
      type:    NotificationType.INFO
    });
    this.downloadService.download(doc.url, `${doc.name}.pdf`);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, ' - ');
  }
}
