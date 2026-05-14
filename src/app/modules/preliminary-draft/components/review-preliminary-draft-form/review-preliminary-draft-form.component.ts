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

  @Output() onSaveEvaluation = new EventEmitter<{ formValues: any, file: File }>();
  @Output() onDownloadPreliminaryDraft = new EventEmitter<void>();

  // Manejo de estado con Signals para mayor claridad
  uploadedSignedFile = signal<{ fileName: string; file: File } | null>(null);
  isUploadModalOpen = signal(false);

  readonly evaluationForm = this.fb.group({
    result: ['', Validators.required],
    comments: ['', Validators.required],
    document: [null]
  });

  // Estado de solo lectura derivado del estado del anteproyecto
  readonly isReadOnly = computed(() => this.preliminaryDraft.state === stateList.APROBADO);

  // --- Lógica de Datos y Getters Semánticos ---

  /**
   * Identifica el documento más reciente cargado para evaluación
   */
  get currentDocument() {
    const documents = this.preliminaryDraft.documents || [];
    if (documents.length === 0) return null;
    // Retorna el documento con la fecha de carga más reciente
    return [...documents].sort((a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    )[0];
  }

  get documentUploadDate(): string {
    const uploadDate = this.currentDocument?.uploadDate;
    if (!uploadDate) return 'No disponible';
    return new Date(uploadDate).toLocaleDateString('es-ES');
  }

  // --- Métodos de resolución de nombres ---

  getStudentNames(): string {
    return this.userService.getAuthorsNames(this.preliminaryDraft.proposalData.authors);
  }

  getDirectorName(): string {
    return this.userService.getUserFullName(this.preliminaryDraft.proposalData.director.id);
  }

  getCodirectorName(): string {
    const id = this.preliminaryDraft.proposalData.codirector?.id;
    return id ? this.userService.getUserFullName(id) : '';
  }

  getAdvisorName(): string {
    const id = this.preliminaryDraft.proposalData.advisor?.id;
    return id ? this.userService.getUserFullName(id) : '';
  }

  // --- Acciones de Interfaz ---

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.uploadedSignedFile.set(event);
    this.isUploadModalOpen.set(false);
    this.notificationService.show({
      title: 'Archivo cargado',
      message: 'El documento firmado se ha adjuntado correctamente al formulario.',
      type: NotificationType.INFO
    });
  }

  /**
   * Ejecuta la validación y emisión del formulario de evaluación
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

  isFieldInvalid(fieldName: string): boolean {
    const control = this.evaluationForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  // --- Notificaciones de Feedback ---

  private showValidationErrorNotification(missingFile: boolean): void {
    this.notificationService.show({
      title: 'Formulario incompleto',
      message: missingFile
        ? 'Debe adjuntar el archivo de evaluación firmado para proceder.'
        : 'Por favor, diligencie el veredicto y los comentarios de la evaluación.',
      type: NotificationType.ERROR
    });
  }
}
