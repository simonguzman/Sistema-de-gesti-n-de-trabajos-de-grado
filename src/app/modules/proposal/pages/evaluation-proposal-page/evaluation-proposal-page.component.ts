import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../shared/components/state/state.component';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { Evaluation } from '../../interfaces/evaluation.interface';
import { FileDownloadService } from '../../../../core/services/file-download.service';

@Component({
  selector: 'app-evaluation-proposal-page',
  imports: [CommonModule, ReactiveFormsModule, FileUploadModalComponent, ConfirmationActionModalComponent, ButtonComponent],
  templateUrl: './evaluation-proposal-page.component.html',
  styleUrls: ['./evaluation-proposal-page.component.css'],
})
export class EvaluationProposalPageComponent implements OnInit  {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private proposalService = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private downloadService = inject(FileDownloadService)

  proposal = signal<Proposal | null>(null);
  isLoading= signal(true);

  isUploadModalOpen = false;
  isConfirmModalOpen = false;
  hasSignedFile = false;
  signedFileName: string | null = null;

  evaluationForm = this.fb.group({
    result: ['', Validators.required],
    comments: ['', Validators.required]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if(!id){
      this.goBack();
      return;
    }
    this.proposalService.getProposalByIdMock(id).subscribe({
      next:(data) => {
        if(!data){
          this.goBack()
          return;
        }
        this.proposal.set(data);
        this.isLoading.set(false);
      },
      error: () =>{
        this.goBack()
      }
    });
  }

  get originalDocumentName(): string {
    const docs = this.proposal()?.documents;
    return docs && docs.length > 0 ? docs[0].name : 'Documento no disponible';
  }

  get documentUploadDate(): string {
    const docs = this.proposal()?.documents;
    const dateValue = docs && docs.length > 0 ? docs[0].uploadDate : null;

    // Si dateValue es un objeto Date, lo convertimos a string.
    // Si ya es string, lo dejamos pasar.
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('es-ES');
    }

    return dateValue || 'Fecha no disponible'
  }

  goBack(){
    this.location.back();
  }

  //--- Manejo de archivos ---
  handleFileUploaded(event: { fileName: string, file: File}){
    this.hasSignedFile = true;
    this.signedFileName = event.fileName;
    this.isUploadModalOpen= false;
    this.showUploadFileSuccessNotification();
  }

  removeSignedFile() {
    this.hasSignedFile = false;
    this.signedFileName = null;
    this.showDeleteFileUploadedInfoNotification();
  }

  private showDeleteFileUploadedInfoNotification(){
    this.notificationService.show({
      title: 'Archivo removido',
      message: 'El formato firmado ha sido quitado de la evaluación.',
      type: NotificationType.INFO
    })
  }

  private showUploadFileSuccessNotification(){
    this.notificationService.show({
      title: 'Formato A firmado cargado',
      message: 'El documento se ha adjuntado correctamente a la evaluación.',
      type: NotificationType.CONFIRMATION
    })
  }

  downloadOriginalDocument() {
    const currentProposal = this.proposal();

    // LOG 1: Ver qué tiene la propuesta completa
    console.log('Propuesta actual:', currentProposal);

    const document = currentProposal?.documents ? currentProposal.documents[0] : null;

    // LOG 2: Ver el objeto documento específico
    console.log('Documento encontrado:', document);

    if (document && document.url) {
      console.log('URL detectada, iniciando descarga:', document.url);
      this.showDownloadInfoNotification();
      this.downloadService.download(document.url, document.name);
    } else {
      // LOG 3: Detalles del fallo
      console.warn('Fallo en la descarga: ', {
        existeDocumento: !!document,
        url: document?.url
      });
      this.showDownloadErrorNotification();
    }
  }

  private showDownloadErrorNotification(){
    this.notificationService.show({
      title: 'Error',
      message: 'No se encontró la URL del documento para descargar.',
      type: NotificationType.ERROR
    })
  }

  private showDownloadInfoNotification(){
    this.notificationService.show({
      title: 'Descarga Iniciada',
      message: 'Descargando el documento...',
      type: NotificationType.INFO
    })
  }

  initiateEvaluationSubmit(){
    if(this.evaluationForm.invalid){
      this.evaluationForm.markAllAsTouched();
      this.showEvaluateIncompleteNotification();
      return;
    }
    if(!this.hasSignedFile){
      this.showFileUploadIncompleteNotification();
    }
    this.isConfirmModalOpen = true;
  }

  private showFileUploadIncompleteNotification(){
    this.notificationService.show({
      title: 'Archivo requerido',
      message: 'Debe cargar el formato de evaluación firmado antes de guardar.',
      type:NotificationType.ERROR
    })
  }

  private showEvaluateIncompleteNotification(){
    this.notificationService.show({
      title:'Formulario incompleto',
      message:'Por favor, seleccione un resultado y añada sus comentarios',
      type:NotificationType.ERROR
    })
  }

  cancelEvaluation(){
    this.isConfirmModalOpen = false;
  }

  confirmEvaluation(){
    this.isConfirmModalOpen = false;

    const currentProposal = this.proposal();
    if (!currentProposal || !currentProposal.id) return;

    const formValues = this.evaluationForm.value;

    let newState = currentProposal.state;

    if(formValues.result === 'Aprobado'){
      newState = stateList.APROBADO;
    } else if (formValues.result === 'Aprobado con observaciones'){
      newState = stateList.APROBADO_CON_OBSERVACIONES;
    } else if (formValues.result === 'No aprobado'){
      newState = stateList.NO_APROBADO;
    }

    const newEvaluation: Evaluation = {
      id: '',
      proposalId: currentProposal.id,
      evaluatorName: 'Evaluador Mock',
      evaluatorRole: 'Jurado',
      signedDocuments: this.signedFileName ? [this.signedFileName] : [],
      veredict: newState,
      observations: formValues.comments!,
      date: new Date()
    };

    this.proposalService.addEvaluationMock(currentProposal.id, newEvaluation)
      .subscribe({
        next: () => {
          this.showEvaluationSuccessNotification();

          // navegación correcta 👇
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: () => {
          this.showEvaluationErrorNotification();
        }
      });
  }

  private showEvaluationErrorNotification(){
    this.notificationService.show({
      title: 'Error de actualización',
      message: 'No se pudo guardar la evaluación. Intente nuevamente.',
      type: NotificationType.ERROR
    });
  }

  private showEvaluationSuccessNotification(){
    this.notificationService.show({
      title: 'Evaluación registrada',
      message: 'La evaluación se ha guardado y el estado se ha actualizado.',
      type: NotificationType.CONFIRMATION
    });
  }
}
