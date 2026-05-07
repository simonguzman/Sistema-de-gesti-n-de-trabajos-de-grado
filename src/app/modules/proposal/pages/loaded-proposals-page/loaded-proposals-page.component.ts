import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Column, TableButton, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalDocument } from '../../interfaces/proposalDocument.inteface';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { stateList } from '../../../../shared/components/state/state.component';
import { ProposalService } from '../../services/proposal.service';
import { FileDownloadService } from '../../../../core/services/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

@Component({
  selector: 'app-loaded-proposals-page',
  imports: [CommonModule, TableComponent, FileUploadModalComponent, ConfirmationActionModalComponent],
  templateUrl: './loaded-proposals-page.component.html',
  styleUrls: ['./loaded-proposals-page.component.css']
})
export class LoadedProposalsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proposalService = inject(ProposalService);
  private downloadService = inject(FileDownloadService);
  private notificationService = inject(NotificationService);

  proposalId = signal<string | null>(null);
  isFileModalOpen = signal(false);
  isConfirmModalOpen = signal(false);
  tempFile= signal<{ fileName: string, file: File} | null>(null);
  columns: Column[] = [
    { field: 'name', header: 'Nombre de archivo', type: 'text', width: '35%' },
    { field: 'uploadDate', header: 'Fecha de carga', type: 'text', width: '20%' },
    { field: 'status', header: 'Estado', type: 'state', width: '20%' },
    { field: 'acciones', header: 'Acciones', type: 'actions', width: '25%' }
  ];

  documentsTableData = computed(() => {
    const id = this.proposalId();
    if(!id) return [];
    const proposal = this.proposalService.proposals().find(proposal => proposal.id === id);
    if(!proposal) return[];
    return proposal.documents.map(doc => ({
      ...doc,
      acciones: this.getTableActions(doc)
    }));
  });

  private getTableActions(doc: ProposalDocument) {
    return [
      { action: 'download', label: 'Descargar propuesta', variant: 'primary', disabled: false },
      {
        action: 'evaluate',
        label: 'Evaluar propuesta',
        variant: 'primary',
        // Solo editable si está en revisión
        disabled: doc.status !== stateList.EN_REVISION
      }
    ];
  }

  headerButtons = computed<TableButton[]>(() => {
    const docs = this.documentsTableData();
    let isApproved = false;

    if (docs.length > 0) {
      const latestStatus = docs[0].status;
      isApproved = latestStatus === stateList.APROBADO ||
                  latestStatus === stateList.APROBADO_CON_OBSERVACIONES;
    }

    // Usamos 'as const' para que TS entienda que 'primary' es el tipo literal exacto
    return [
      {
        label: 'Cargar propuesta corregida',
        variant: 'primary' as const,
        disabled: isApproved
      }
    ];
  });


  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if(id){
      this.proposalId.set(id);
    }
  }

  handleHeaderButton(button: TableButton) {
    // 1. Verificamos si según nuestra lógica debería estar bloqueado
    const isBlocked = this.headerButtons().find(b => b.label === button.label)?.disabled;

    if (isBlocked) return; // Si está bloqueado, ignoramos el clic

    // 2. Si no está bloqueado, procedemos
    if (button.label === 'Cargar propuesta corregida') {
      this.isFileModalOpen.set(true);
    }
  }

  handleTableAction(event: { action: string, row:any }){
    switch (event.action) {
      case 'download':
        const document = event.row; // El 'row' es nuestro ProposalDocument

        // Validación idéntica al componente anterior
        if (document && document.url && document.url.trim() !== "") {
          this.showFileDownloadInfoNotification();
          this.downloadService.download(document.url, `${document.name}.pdf`);
        } else {
          // En lugar de abrir un PDF raro, notificamos que no hay URL vinculada
          this.showFileDownloadProblemNotification();
          console.warn(`Intento de descarga fallido: La URL para "${document.name}" está vacía.`);
        }
        break;
      case 'evaluate':
        this.router.navigate(['evaluate_proposal'], { relativeTo: this.route });
        break;
    }
  }

   private showFileDownloadProblemNotification(){
    this.notificationService.show({
      title: 'Archivo no disponible',
      message: 'El documento no tiene una ruta de descarga configurada todavía.',
      type: NotificationType.INFO
    });
  }

  private showFileDownloadInfoNotification(){
    this.notificationService.show({
      title: 'Descarga Iniciada',
      message: `Descargando archivo...`,
      type: NotificationType.INFO
    });
  }

  onFileSelected(event: { fileName: string, file: File }){
    this.tempFile.set(event);
    this.isFileModalOpen.set(false);
    this.isConfirmModalOpen.set(true);
  }

  confirmUpload() {
    const fileData = this.tempFile();
    const id = this.proposalId();

    if (fileData && id) {
      // Creamos el formato: "06 - 05 - 2026"
      const formattedDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, ' - '); // Cambiamos las barras / por guiones con espacios -

      const newDoc: ProposalDocument = {
        id: Date.now().toString(),
        name: fileData.fileName.replace('.pdf', ''),
        url: '',
        uploadDate: formattedDate, // Guardamos la cadena ya formateada
        type: 'Correccion',
        status: stateList.EN_REVISION
      };

      this.proposalService.uploadCorrectionMock(id, newDoc).subscribe({
        next: () => {
          this.isConfirmModalOpen.set(false);
          this.tempFile.set(null);
        }
      });
    }
  }

  cancelUpload() {
    this.isConfirmModalOpen.set(false);
    this.tempFile.set(null);
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
