import { Component, computed, DestroyRef, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ProposalService } from '../../../proposal/services/proposal.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { stateList } from '../../../../core/enums/state.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../../users/interfaces/user.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { NgTemplateOutlet } from '@angular/common';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { Document } from '../../../../core/interfaces/Document.interface';

@Component({
  selector: 'app-preliminary-draft-form',
  templateUrl: './preliminary-draft-form.component.html',
  styleUrls: ['./preliminary-draft-form.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, FileUploadModalComponent, NgTemplateOutlet]
})
export class PreliminaryDraftFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly proposalService = inject(ProposalService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly destroyRef = inject(DestroyRef);

  preliminaryDraft = input<PreliminaryDraft | null>(null);
  @Output() onSave = new EventEmitter<PreliminaryDraft>();

  form = this.fb.group({
    proposalId: ['', Validators.required],
    title: ['', Validators.required],
    description: ['', Validators.required],
    document: [null as any, Validators.required]
  });

  attachedFile = { hasFile: false, name: null as string | null };
  uploadModalOpen = false;
  selectedProposalId = signal<string>('');

  protected availableProposals = computed(() => {
    const allProposals = this.proposalService.proposals();
    const currentUser = this.authService.currentUser();
    const currentPreliminaryDrafts = this.preliminaryDraftService.preliminaryDrafts();
    const editingPreliminaryDraft = this.preliminaryDraft();
    return allProposals.filter(proposal => {
      if (editingPreliminaryDraft && proposal.id === editingPreliminaryDraft.proposalId) return true;
      const isApproved =
        proposal.state === stateList.APROBADO ||
        proposal.state === stateList.APROBADO_CON_OBSERVACIONES;
      const isDirector = proposal.director?.id === currentUser?.id;
      const isRegistered = currentPreliminaryDrafts.some(preliminaryDraft => preliminaryDraft.proposalId === proposal.id);
      return isApproved && isDirector && !isRegistered;
    });
  });

  protected selectedProposal = computed(() => {
    const id = this.selectedProposalId();
    return this.availableProposals().find(p => p.id === id) || null;
  });

  protected proposalEvaluationDocument = computed(() => {
    const proposal = this.selectedProposal();
    if (!proposal?.evaluations?.length) return null;
    const approvedEvaluation = [...proposal.evaluations]
      .reverse()
      .find(ev =>
        ev.veredict === stateList.APROBADO ||
        ev.veredict === stateList.APROBADO_CON_OBSERVACIONES
      );
    if (!approvedEvaluation?.signedDocuments?.length) return null;
    return approvedEvaluation.signedDocuments[0];
  });

  ngOnInit(): void {
    const draft = this.preliminaryDraft();
    if (draft) {
      this.initEditMode(draft);
    } else {
      this.initCreateMode();
    }
    this.form.get('proposalId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => this.selectedProposalId.set(id ?? ''));
  }

  private initEditMode(draft: PreliminaryDraft): void {
    this.selectedProposalId.set(draft.proposalId);
    this.form.patchValue({
      proposalId: draft.proposalId,
      title: draft.proposalData.title,
      description: draft.proposalData.description
    });
    this.form.get('document')?.clearValidators();
    const mainDoc = draft.documents.find(d => d.type === 'Anteproyecto');
    if (mainDoc) {
      this.attachedFile = {
        hasFile: true,
        name: mainDoc.name
      };
      this.form.get('document')?.setValue(mainDoc);
    }
    this.form.updateValueAndValidity();
  }

  private initCreateMode(): void {
    this.form.get('title')?.disable();
    this.form.get('description')?.disable();
  }

  get isEditMode(): boolean {
    return !!this.preliminaryDraft();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getMemberName(user: User | undefined): string {
    if (!user) return 'No asignado';
    return [
      user.firstName,
      user.secondName,
      user.lastName,
      user.secondLastName
    ]
      .filter(n => !!n)
      .join(' ');
  }

  getAuthorsNames(ids: string[] | undefined): string {
    return this.userService.getAuthorsNames(ids);
  }

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.attachedFile = {
      hasFile: true,
      name: event.fileName
    };
    this.form.get('document')?.setValue(event.file);
    this.form.get('document')?.markAsTouched();
    this.uploadModalOpen = false;
    this.showNotification(
      'Archivo cargado',
      'El documento se ha adjuntado correctamente.',
      NotificationType.CONFIRMATION
    );
  }

  removeFile(): void {
    this.attachedFile = {
      hasFile: false,
      name: null
    };
    this.form.get('document')?.setValue(null);
    this.form.get('document')?.markAsTouched();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.showNotification('Información incompleta', 'Revise los campos.', NotificationType.ERROR);
      return;
    }
    const proposal = this.selectedProposal();
    if (!proposal) return;
    const mappedDoc = this.mapDocumentObject();
    const preliminaryDraftResult: PreliminaryDraft = {
      ...this.preliminaryDraft(),
      proposalId: proposal.id!,
      proposalData: {
        ...proposal,
        title: (this.isEditMode ? this.form.get('title')?.value : proposal.title) ?? '',
        description: (this.isEditMode ? this.form.get('description')?.value : proposal.description) ?? ''
      },
      documents: mappedDoc ? [mappedDoc] : (this.preliminaryDraft()?.documents || []),
      state: this.preliminaryDraft()?.state || stateList.EN_REVISION,
      createdData: this.preliminaryDraft()?.createdData || new Date(),
      evaluations: this.preliminaryDraft()?.evaluations || []
    };
    this.onSave.emit(preliminaryDraftResult);
  }

  private mapDocumentObject(): Document | null {
    const existingDoc = this.preliminaryDraft()?.documents.find(d => d.type === 'Anteproyecto');

    if (this.attachedFile.hasFile && this.attachedFile.name === existingDoc?.name) {
      return existingDoc;
    }

    if (this.attachedFile.hasFile) {
      return {
        id: crypto.randomUUID(),
        name: this.attachedFile.name!,
        url: '',
        uploadDate: new Date().toLocaleDateString('es-ES').replaceAll('/', ' - '),
        type: 'Anteproyecto',
        status: stateList.EN_REVISION
      };
    }

    return null;
  }

  private showNotification( title: string, message: string, type: NotificationType ): void {
    this.notificationService.show({ title, message, type });
  }
}
