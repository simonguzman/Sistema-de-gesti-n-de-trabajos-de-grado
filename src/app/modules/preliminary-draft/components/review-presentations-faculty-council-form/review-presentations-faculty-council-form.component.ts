import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../users/services/user.service';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { Document } from '../../../../core/interfaces/Document.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";

@Component({
  selector: 'app-review-presentations-faculty-council-form',
  imports: [ReactiveFormsModule, ButtonComponent, FileUploadModalComponent],
  templateUrl: './review-presentations-faculty-council-form.component.html',
  styleUrls: ['./review-presentations-faculty-council-form.component.css']
})
export class ReviewPresentationsFacultyCouncilFormComponent {
  private readonly fb = inject(FormBuilder);
  public userService = inject(UserService);

  @Input({ required: true }) preliminaryDraft!: PreliminaryDraft;
  @Input() isSubmitting = false;

  @Output() onSaveEvaluation = new EventEmitter<{formValues: any, file: File}>();
  @Output() onDownloadFile = new EventEmitter<Document>();

  signedFile = signal<{ fileName: string; file: File } | null>(null);
  isUploadModalOpen = signal(false);

  evaluationForm = this.fb.group({
    result: ['', Validators.required],
    comments: ['', Validators.required],
    document: [null]
  });

  isReadOnly = computed(() => this.preliminaryDraft.state === stateList.APROBADO);

  get signedProposalDocument(): Document | undefined {
    const proposal = this.preliminaryDraft.proposalData;
    if (!proposal?.evaluations?.length) return undefined;

    // Buscamos la evaluación de aprobación más reciente de la propuesta
    const approvedEvaluation = [...proposal.evaluations]
      .reverse()
      .find(ev =>
        ev.veredict === stateList.APROBADO ||
        ev.veredict === stateList.APROBADO_CON_OBSERVACIONES
      );

    const fileName = approvedEvaluation?.signedDocuments?.[0];

    if (!fileName) return undefined;

    // Retornamos un objeto Document mockeado para que el componente de descarga lo procese
    return {
      id: crypto.randomUUID(),
      name: fileName,
      url: '', // El servicio de descarga manejará la obtención por nombre o ID
      uploadDate: new Date().toLocaleDateString(),
      type: 'Formato',
      status: stateList.APROBADO
    };
  }

  get approvedPreliminaryDraftDocument(): Document | undefined {
    return this.preliminaryDraft.documents.find(document => document.type === 'Anteproyecto' || document.type === 'Correccion');
  }

  get presentationDocument(): Document | undefined {
    return this.preliminaryDraft.documents.find(document => document.type === 'Formato');
  }

  get evaluationFiles(){
    return this.preliminaryDraft.evaluations
      .filter(evaluation => evaluation.veredict === stateList.APROBADO)
      .map(evaluation => ({
        name: evaluation.signedDocuments?.[0] || 'Evaluacion firmada',
        evaluator: evaluation.evaluatorName
      }));
  }

  get documentUploadDate(): string {
    const date = this.preliminaryDraft.documents[0]?.uploadDate;
    return date ? new Date(date).toLocaleDateString('es-ES') : 'No disponible';
  }

  getStudentNames(): string {
    return this.userService.getAuthorsNames(this.preliminaryDraft.proposalData.authors);
  }

  getDirectorName(): string{
    return this.userService.getUserFullName(this.preliminaryDraft.proposalData.director.id)
  }

  isFieldInvalid(fieldName : string): boolean {
    const field = this.evaluationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  handleFileUploaded(event: { fileName: string; file: File }){
    this.signedFile.set(event);
    this.isUploadModalOpen.set(false);
  }

  submit() {
    const fileData = this.signedFile();
    if(this.evaluationForm.invalid || !fileData){
      this.evaluationForm.markAllAsTouched();
      return;
    }
    this.onSaveEvaluation.emit({
      formValues: this.evaluationForm.value,
      file: fileData.file
    });
  }

}
