import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../users/services/user.service';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { FileUploadModalComponent } from '../../../../shared/components/modals/file-upload-modal/file-upload-modal.component';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-preliminary-draft-form',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, FileUploadModalComponent],
  templateUrl: './review-preliminary-draft-form.component.html',
  styleUrls: ['./review-preliminary-draft-form.component.css']
})
export class ReviewPreliminaryDraftFormComponent {
  private readonly fb = inject(FormBuilder);
  public userService = inject(UserService); // Servicio para nombres

  @Input({ required: true }) preliminaryDraft!: PreliminaryDraft;
  @Input() isSubmitting = false;

  @Output() onSaveEvaluation = new EventEmitter<{formValues: any, file: File}>();
  @Output() onDownloadPreliminaryDraft = new EventEmitter<void>();

  signedFile = signal<{ fileName: string; file: File } | null>(null);
  isUploadModalOpen = signal(false);

  evaluationForm = this.fb.group({
    result: ['', Validators.required],
    comments: ['', Validators.required],
    document: [null]
  });

  isReadOnly = computed(() => this.preliminaryDraft.state === stateList.APROBADO);

  // --- Lógica de Datos ---

  get currentDocument() {
    const docs = this.preliminaryDraft.documents || [];
    if (docs.length === 0) return null;
    return [...docs].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];
  }

  get documentUploadDate(): string {
    const date = this.currentDocument?.uploadDate;
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES');
  }

  // --- Métodos de resolución de nombres (Igual que en Propuesta) ---

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

  // --- Acciones ---

  handleFileUploaded(event: { fileName: string; file: File }) {
    this.signedFile.set(event);
    this.isUploadModalOpen.set(false);
  }

  submit() {
    const fileData = this.signedFile();
    if (this.evaluationForm.invalid || !fileData) {
      this.evaluationForm.markAllAsTouched();
      return;
    }
    this.onSaveEvaluation.emit({
      formValues: this.evaluationForm.value,
      file: fileData.file
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.evaluationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
