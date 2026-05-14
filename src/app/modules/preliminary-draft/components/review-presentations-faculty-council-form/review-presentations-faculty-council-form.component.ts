import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";

import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { Document } from '../../../../core/interfaces/Document.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
@Component({
  selector: 'app-review-presentations-faculty-council-form',
  imports: [ReactiveFormsModule, ButtonComponent, FileUploadModalComponent],
  templateUrl: './review-presentations-faculty-council-form.component.html',
  styleUrls: ['./review-presentations-faculty-council-form.component.css']
})
export class ReviewPresentationsFacultyCouncilFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  public readonly userService = inject(UserService);

  @Input({ required: true }) preliminaryDraft!: PreliminaryDraft;
  @Input() isSubmitting = false;

  @Output() onSaveEvaluation = new EventEmitter<{ formValues: any, file: File }>();
  @Output() onDownloadFile = new EventEmitter<Document>();

  // Estados gestionados con Signals para mayor reactividad
  uploadedSignedFile = signal<{ fileName: string; file: File } | null>(null);
  isUploadModalOpen = signal(false);

  readonly evaluationForm = this.fb.group({
    result: ['', Validators.required],
    comments: ['', Validators.required],
    document: [null]
  });

  // Evaluación de estado de solo lectura mediante computed
  readonly isReadOnly = computed(() => this.preliminaryDraft.state === stateList.APROBADO);

  /**
   * Obtiene el documento de propuesta firmado más reciente
   */
  get signedProposalDocument(): Document | undefined {
    const proposal = this.preliminaryDraft.proposalData;
    if (!proposal?.evaluations?.length) return undefined;

    const approvedEvaluation = [...proposal.evaluations]
      .reverse()
      .find(evaluation =>
        evaluation.veredict === stateList.APROBADO ||
        evaluation.veredict === stateList.APROBADO_CON_OBSERVACIONES
      );

    const fileName = approvedEvaluation?.signedDocuments?.[0];
    if (!fileName) return undefined;

    return {
      id: crypto.randomUUID(),
      name: fileName,
      url: '',
      uploadDate: new Date().toLocaleDateString(),
      type: 'Formato',
      status: stateList.APROBADO
    };
  }

  /**
   * Documentos específicos del flujo de anteproyecto
   */
  get approvedPreliminaryDraftDocument(): Document | undefined {
    return this.preliminaryDraft.documents.find(document =>
      document.type === 'Anteproyecto' || document.type === 'Correccion'
    );
  }

  get presentationDocument(): Document | undefined {
    return this.preliminaryDraft.documents.find(doc => doc.type === 'Formato');
  }

  /**
   * Lista de archivos de evaluación aprobados
   */
  get evaluationFiles() {
    return this.preliminaryDraft.evaluations
      .filter(evaluation => evaluation.veredict === stateList.APROBADO)
      .map(evaluation => ({
        name: evaluation.signedDocuments?.[0] || 'Evaluación firmada',
        evaluator: evaluation.evaluatorName
      }));
  }

  get documentUploadDate(): string {
    const firstDocument = this.preliminaryDraft.documents[0];
    return firstDocument?.uploadDate
      ? new Date(firstDocument.uploadDate).toLocaleDateString('es-ES')
      : 'No disponible';
  }

  /**
   * Helpers para visualización de nombres (Interacción con UserService)
   */
  getStudentNames(): string {
    return this.userService.getAuthorsNames(this.preliminaryDraft.proposalData.authors);
  }

  getDirectorName(): string {
    return this.userService.getUserFullName(this.preliminaryDraft.proposalData.director.id);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.evaluationForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.uploadedSignedFile.set(event);
    this.isUploadModalOpen.set(false);
  }

  /**
   * Procesa el envío de la evaluación con validaciones reforzadas
   */
  submit(): void {
    const fileData = this.uploadedSignedFile();
    if (this.evaluationForm.invalid || !fileData) {
      this.evaluationForm.markAllAsTouched();
      this.showValidationErrorNotification(!fileData);
      return;
    }
    this.onSaveEvaluation.emit({
      formValues: this.evaluationForm.value,
      file: fileData.file
    });
  }

  private showValidationErrorNotification(missingFile: boolean): void {
    this.notificationService.show({
      title: 'Formulario incompleto',
      message: missingFile
        ? 'Es obligatorio adjuntar el documento de evaluación firmado.'
        : 'Por favor, complete todos los campos requeridos antes de continuar.',
      type: NotificationType.ERROR
    });
  }
}
