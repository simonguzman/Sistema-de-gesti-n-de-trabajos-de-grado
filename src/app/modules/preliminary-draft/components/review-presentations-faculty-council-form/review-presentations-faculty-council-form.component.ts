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
  get isReadOnly(): boolean {
    return this.preliminaryDraft.state === stateList.APROBADO;
  }

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
    const rawDate = firstDocument?.uploadDate;

    if (!rawDate) return 'No disponible';

    // 1. Si ya es un objeto Date, lo formateamos directamente
    if (rawDate instanceof Date) {
      return rawDate.toLocaleDateString('es-ES');
    }

    // 2. Limpiamos espacios en blanco ("15 - 05 - 2026" -> "15-05-2026")
    const cleanDateStr = rawDate.replace(/\s+/g, '');

    // 3. Intentamos un parseo estándar (por si es ISO o compatible)
    const standardDate = new Date(cleanDateStr);
    if (!isNaN(standardDate.getTime())) {
      return standardDate.toLocaleDateString('es-ES');
    }

    // 4. Fallback manual: Si el formato es DD-MM-YYYY (común en tu LocalStorage)
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const day = +parts[0];
      const month = +parts[1] - 1; // Los meses en JS van de 0 a 11
      const year = +parts[2];

      const manualDate = new Date(year, month, day);
      if (!isNaN(manualDate.getTime())) {
        return manualDate.toLocaleDateString('es-ES');
      }
    }

    return 'Fecha inválida';
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

  getCodirectorName(): string {
    const codirector = this.preliminaryDraft.proposalData.codirector;
    return codirector && codirector.id ? this.userService.getUserFullName(codirector.id) : '';
  }

  getAdvisorName(): string {
    const advisor = this.preliminaryDraft.proposalData.advisor;
    return advisor && advisor.id ? this.userService.getUserFullName(advisor.id) : '';
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
