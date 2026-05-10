import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

const RESULT_TO_STATE: Record<string, stateList> = {
  'Aprobado':                    stateList.APROBADO,
  'Aprobado con observaciones':  stateList.APROBADO_CON_OBSERVACIONES,
  'No aprobado':                 stateList.NO_APROBADO
};
@Component({
  selector: 'app-evaluation-proposal-page',
  imports: [CommonModule, ReactiveFormsModule, FileUploadModalComponent, ConfirmationActionModalComponent, ButtonComponent],
  templateUrl: './evaluation-proposal-page.component.html',
  styleUrls: ['./evaluation-proposal-page.component.css'],
})
export class EvaluationProposalPageComponent implements OnInit  {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private location            = inject(Location);
  private proposalService     = inject(ProposalService);
  private downloadService     = inject(FileDownloadService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb                  = inject(FormBuilder);

  proposal = signal<Proposal | null>(null);

  // Estado del archivo firmado agrupado
  signedFile = signal<{ name: string } | null>(null);

  // Estado de modales agrupado
  modalState = {
    upload:  false,
    confirm: false
  };

  evaluationForm = this.fb.group({
    result:   ['', Validators.required],
    comments: ['', Validators.required]
  });

  displayFields = computed(() => {
    const proposal = this.proposal();
    if (!proposal) return [];

    return [
      { label: 'Título', value: proposal.title },
      { label: 'Fecha de carga', value: this.documentUploadDate },
      { label: 'Modalidad', value: proposal.modality },
      { label: 'Estudiante(s)', value: this.userService.getAuthorsNames(proposal.authors) },
      { label: 'Director', value: this.userService.getUserFullName(proposal.directorId) },
      { label: 'Estado Actual', value: proposal.state }
    ];
  });

  getStudentNames(authors: string[] | undefined): string {
    return this.userService.getAuthorsNames(authors);
  }

  getDirectorName(directorId: string | undefined): string {
    return this.userService.getUserFullName(directorId);
  }

  getCodirectorName(codirectorId: string | undefined): string {
    if (!codirectorId) return '';
    return this.userService.getUserFullName(codirectorId);
  }


  getAdvisorName(advisorId: string | undefined): string {
    if (!advisorId) return '';
    return this.userService.getUserFullName(advisorId);
  }

  get originalDocument() {
    return this.proposal()?.documents?.[0] ?? null;
  }

  get documentUploadDate(): string {
    const date = this.originalDocument?.uploadDate;
    if (!date) return 'Fecha no disponible';
    return date instanceof Date
      ? date.toLocaleDateString('es-ES')
      : date;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
            ?? this.route.parent?.snapshot.paramMap.get('id');

    if (!id) { this.location.back(); return; }

    this.proposalService.getProposalByIdMock(id).subscribe({
      next:  (data) => data ? this.proposal.set(data) : this.location.back(),
      error: ()     => this.location.back()
    });
  }

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.signedFile.set({ name: event.fileName });
    this.modalState.upload = false;
    this.showFileUploadSuccessNotification();
  }

  removeSignedFile(): void {
    this.signedFile.set(null);
    this.showFileRemovedNotification();
  }

  downloadOriginalDocument(): void {
    const doc = this.originalDocument;
    if (!doc?.url?.trim()) {
      this.showDownloadErrorNotification();
      return;
    }
    this.showDownloadStartedNotification();
    this.downloadService.download(doc.url, doc.name);
  }

  initiateEvaluationSubmit(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      this.showInvalidFormNotification();
      return;
    }
    if (!this.signedFile()) {
      this.showMissingFileNotification();
      return; // ← faltaba este return
    }
    this.modalState.confirm = true;
  }

  confirmEvaluation(): void {
    this.modalState.confirm = false;
    const currentProposal = this.proposal();
    const currentUser = this.authService.currentUser();
    if (!currentProposal?.id || !currentUser) return;
    // --- NUEVA VALIDACIÓN DE NEGOCIO ---
    // Antes de guardar, verificamos que el estado de la propuesta no rompa reglas
    // (útil si la evaluación implica cambios en la estructura de la propuesta)
    const validationError = this.proposalService.validateProposalRules(currentProposal);
    if (validationError) {
      this.showBusinessRuleNotification(validationError);
      return;
    }

    const { result, comments } = this.evaluationForm.value;
    const newState = RESULT_TO_STATE[result!] ?? currentProposal.state;


    const newEvaluation: Evaluation = {
      id: crypto.randomUUID(),
      proposalId: currentProposal.id,
      evaluatorName: this.userService.getUserFullName(currentUser?.id), // Aquí podrías usar authService.currentUser()
      evaluatorRole: currentUser.roles[0],
      signedDocuments: this.signedFile() ? [this.signedFile()!.name] : [],
      veredict: newState,
      observations: comments!,
      date: new Date()
    };

    this.proposalService.addEvaluationMock(currentProposal.id, newEvaluation).subscribe({
      next: () => {
        this.showEvaluationSuccessNotification();
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => this.showUpdateErrorNotification()
    });
  }

  cancelEvaluation(): void {
    this.modalState.confirm = false;
  }

  goBack(): void {
    this.location.back();
  }

  private showFileUploadSuccessNotification() {
    this.notificationService.show({
      title: 'Formato A adjuntado',
      message: 'El documento firmado se ha vinculado correctamente a esta evaluación.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showFileRemovedNotification() {
    this.notificationService.show({
      title: 'Documento removido',
      message: 'Se ha quitado el formato firmado. Recuerde que es obligatorio para finalizar.',
      type: NotificationType.INFO
    });
  }

  private showInvalidFormNotification() {
    this.notificationService.show({
      title: 'Formulario incompleto',
      message: 'Por favor, asegúrese de seleccionar un veredicto y escribir sus observaciones.',
      type: NotificationType.ERROR
    });
  }

  private showMissingFileNotification() {
    this.notificationService.show({
      title: 'Documento requerido',
      message: 'Debe cargar el Formato A firmado para poder registrar la evaluación.',
      type: NotificationType.ERROR
    });
  }

  private showEvaluationSuccessNotification() {
    this.notificationService.show({
      title: 'Evaluación registrada',
      message: 'La decisión del comité ha sido guardada y el estado de la propuesta actualizado.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showBusinessRuleNotification(message: string) {
    this.notificationService.show({
      title: 'Restricción de proceso',
      message: message,
      type: NotificationType.ERROR
    });
  }

  private showDownloadStartedNotification() {
    this.notificationService.show({
      title: 'Descarga iniciada',
      message: 'Descargando la propuesta original para su revisión...',
      type: NotificationType.INFO
    });
  }

  private showDownloadErrorNotification() {
    this.notificationService.show({
      title: 'Error de descarga',
      message: 'No se pudo obtener el documento original. Contacte a soporte técnico.',
      type: NotificationType.ERROR
    });
  }

  private showUpdateErrorNotification() {
    this.notificationService.show({
      title: 'Error de servidor',
      message: 'Hubo un problema al guardar la evaluación. Intente nuevamente en unos minutos.',
      type: NotificationType.ERROR
    });
  }
}
