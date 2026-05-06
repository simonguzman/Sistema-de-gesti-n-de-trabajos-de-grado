import { Component, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../shared/components/state/state.component';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";

@Component({
  selector: 'app-proposal-form',
  imports: [ReactiveFormsModule ,ButtonComponent, FileUploadModalComponent],
  templateUrl: './proposal-form.component.html',
  styleUrls: ['./proposal-form.component.css']
})
export class ProposalFormComponent {
  fb = inject(FormBuilder);
  protected notificationService = inject(NotificationService);

  proposal = input<Proposal | null>(null);
  @Output() onSubmit = new EventEmitter<Proposal>();

  proposalForm = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    modality: ['', [Validators.required]],
    student1: ['', [Validators.required]],
    student2: [''],
    codirector: [''],
    advisor: [''],
  });

  isModalOpen = false;
  hasAttachedFile = false;
  uploadedFileName: string | null = null;

  constructor(){
    effect(() => {
      this.syncFormWithProposal();
    })
    this.proposalForm.get('modality')?.valueChanges.subscribe(value => {
      const advisorControl = this.proposalForm.get('advisor');
      if (value === 'Practica profesional') {
        advisorControl?.setValidators([Validators.required]);
      } else {
        advisorControl?.clearValidators();
        advisorControl?.setValue(''); // Limpiamos el valor si se oculta
      }
      advisorControl?.updateValueAndValidity();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.proposalForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private syncFormWithProposal() {
    const proposalData = this.proposal();
    if(proposalData){
      this.proposalForm.patchValue({
        title: proposalData.title,
        description: proposalData.description,
        modality: proposalData.modality,
        codirector: proposalData.codirector || '',
        student1: proposalData.authors[0] || '',
        student2: proposalData.authors[1] || '',
        advisor: (proposalData as any).advisor || ''
      });
      this.hasAttachedFile = proposalData.documents.length > 0
      if(this.hasAttachedFile){
        this.uploadedFileName = proposalData.documents[0].name;
      }
    } else {
      this.proposalForm.reset({ modality: '', student1: '', student2: '', codirector: '', advisor: '' });
      this.hasAttachedFile = false;
      this.uploadedFileName = null;
    }
  }

  get showAdvisorField(): boolean{
    return this.proposalForm.get('modality')?.value === 'Practica profesional';
  }

  get isEditMode(): boolean {
    return !!this.proposal();
  }

  submit() {
    if(this.proposalForm.invalid){
      this.handleInvalidForm();
      return;
    }
    const rawValue = this.proposalForm.getRawValue();
    const authorsArray = rawValue.student2
      ? [rawValue.student1 as string, rawValue.student2 as string]
      : [rawValue.student1 as string]
    const updatedProposal: Proposal = {
      ...(this.proposal() || {}),
      title: rawValue.title as string,
      description: rawValue.description as string,
      modality: rawValue.modality as string,
      authors: authorsArray,
      directorId: 'director_mock_001',
      codirector: rawValue.codirector || undefined,
      state: this.proposal()?.state || stateList.EN_REVISION,
      createdAt: this.proposal()?.createdAt || new Date(),
      documents: this.proposal()?.documents || [],
      evaluations: this.proposal()?.evaluations || []
    }as Proposal;
    this.onSubmit.emit(updatedProposal);
  }

  private handleInvalidForm(){
    this.proposalForm.markAllAsTouched();
    this.showErrorNotification();
  }

  private showErrorNotification() {
    return this.notificationService.show({
      title: 'Formulario incorrecto',
      message: 'Por favor, diligencie correctamente todos los campos obligatorios.',
      type: NotificationType.ERROR
    })
  }

  handleFileUploaded(event: { fileName: string, file: File }) {
    this.hasAttachedFile = true;
    this.uploadedFileName = event.fileName;
    this.isModalOpen = false;
    this.showLoadFileConfirmationNotification();
  }

  removeFile(){
    this.hasAttachedFile = false;
    this.uploadedFileName = null;
  }

  private showLoadFileConfirmationNotification(){
    return this.notificationService.show({
      title: 'Archivo cargado',
      message: 'El documento se ha adjuntado correctamente.',
      type: NotificationType.CONFIRMATION
    })
  }
}
