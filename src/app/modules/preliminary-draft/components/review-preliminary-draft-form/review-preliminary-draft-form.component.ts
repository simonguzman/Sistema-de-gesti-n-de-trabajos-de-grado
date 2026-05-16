import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { FileUploadModalComponent } from '../../../../shared/components/modals/file-upload-modal/file-upload-modal.component';

import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

@Component({
  selector: 'app-review-preliminary-draft-form',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, FileUploadModalComponent],
  templateUrl: './review-preliminary-draft-form.component.html',
  styleUrls: ['./review-preliminary-draft-form.component.css']
})
export class ReviewPreliminaryDraftFormComponent {
 private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  public readonly userService = inject(UserService);

  @Input({ required: true }) preliminaryDraft!: PreliminaryDraft;
  @Input() isSubmitting = false;

  @Output() onSaveEvaluation = new EventEmitter<{ formValues: any, file: File, annotatedFile?: File }>();
  @Output() onDownloadPreliminaryDraft = new EventEmitter<void>();

  // Manejo de archivos (Obligatorio y Opcional)
  uploadedSignedFile = signal<{ fileName: string; file: File } | null>(null);
  uploadedAnnotatedFile = signal<{ fileName: string; file: File } | null>(null);

  // Estados de modales
  isUploadModalOpen = signal(false);
  isAnnotatedUploadModalOpen = signal(false);

  readonly evaluationForm = this.fb.group({
    result: ['', Validators.required],
    comments: ['', Validators.required],
    document: [null]
  });

  get isReadOnly(): boolean {
    return this.preliminaryDraft.state === stateList.APROBADO;
  }

  // --- Getters de Información ---

  get currentDocument() {
    const documents = this.preliminaryDraft.documents || [];
    if (documents.length === 0) return null;
    return [...documents].sort((a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    )[0];
  }

  get documentUploadDate(): string {
    const uploadDate = this.currentDocument?.uploadDate;
    return uploadDate ? new Date(uploadDate).toLocaleDateString('es-ES') : 'No disponible';
  }

  // --- Resolución de Nombres ---

  getStudentNames(): string {
    return this.userService.getAuthorsNames(this.preliminaryDraft.proposalData.authors);
  }

  getDirectorName(): string {
    return this.userService.getUserFullName(this.preliminaryDraft.proposalData.director.id);
  }

  // --- Handlers de Archivos ---

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.uploadedSignedFile.set(event);
    this.isUploadModalOpen.set(false);
  }

  handleAnnotatedFileUploaded(event: { fileName: string; file: File }): void {
    this.uploadedAnnotatedFile.set(event);
    this.isAnnotatedUploadModalOpen.set(false);
    this.notificationService.show({
      title: 'Feedback adjunto',
      message: 'El documento con anotaciones se ha cargado correctamente.',
      type: NotificationType.INFO
    });
  }

  submit(): void {
    const fileData = this.uploadedSignedFile();
    const annotatedData = this.uploadedAnnotatedFile();

    if (this.evaluationForm.invalid || !fileData) {
      this.evaluationForm.markAllAsTouched();
      this.showValidationErrorNotification(!fileData);
      return;
    }

    this.onSaveEvaluation.emit({
      formValues: this.evaluationForm.value,
      file: fileData.file,
      annotatedFile: annotatedData?.file
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.evaluationForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  private showValidationErrorNotification(missingFile: boolean): void {
    this.notificationService.show({
      title: 'Formulario incompleto',
      message: missingFile
        ? 'Debe adjuntar el Formato B firmado para guardar la evaluación.'
        : 'Por favor, complete el veredicto y las observaciones.',
      type: NotificationType.ERROR
    });
  }
}
