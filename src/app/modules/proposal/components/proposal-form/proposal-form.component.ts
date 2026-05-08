import { Component, DestroyRef, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../shared/components/state/state.component';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ProposalDocument } from '../../interfaces/proposalDocument.inteface';
import { UserService } from '../../../users/services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-proposal-form',
  imports: [ReactiveFormsModule ,ButtonComponent, FileUploadModalComponent],
  templateUrl: './proposal-form.component.html',
  styleUrls: ['./proposal-form.component.css']
})
export class ProposalFormComponent {
  private fb                  = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private userService         = inject(UserService);
  private destroyRef          = inject(DestroyRef); // Evita fugas de memoria en suscripciones

  protected students = this.userService.students;
  protected teachers = this.userService.teachers;
  protected advisors = this.userService.advisors;

  proposal = input<Proposal | null>(null);
  @Output() onSubmit = new EventEmitter<Proposal>();

  proposalForm = this.fb.group({
    title:       ['', Validators.required],
    description: ['', Validators.required],
    modality:    ['', Validators.required],
    student1:    ['', Validators.required],
    student2:    [''],
    codirector:  [''],
    advisor:     ['']
  });

  attachedFile = { hasFile: false, name: null as string | null };
  uploadModalOpen = false;

  constructor() {
    // Sincroniza el formulario cuando el input 'proposal' cambia (Este sí reacciona al Signal)
    effect(() => this.syncFormWithProposal());
  }

  ngOnInit(): void {
    const pablo = this.userService.users().find(u => u.lastName === 'Mage');
    if (pablo) {
      this.userService.login(pablo);
    }
    this.setupDynamicValidation();
  }

  get showAdvisorField(): boolean {
    return this.proposalForm.get('modality')?.value === 'Practica profesional';
  }

  get isEditMode(): boolean {
    return !!this.proposal();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.proposalForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  private setupDynamicValidation(): void {
    // Solución al problema del 'effect': Usar el observable nativo del formulario
    this.proposalForm.get('modality')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(modality => {
        const advisorControl = this.proposalForm.get('advisor');
        if (modality === 'Practica profesional') {
          advisorControl?.setValidators(Validators.required);
        } else {
          advisorControl?.clearValidators();
          advisorControl?.setValue('');
        }
        advisorControl?.updateValueAndValidity();
      });
  }

  submit(): void {
    // 1. Validar campos del formulario
    if (this.proposalForm.invalid) {
      this.proposalForm.markAllAsTouched();
      this.notificationService.show({
        title:   'Formulario incorrecto',
        message: 'Por favor, diligencie correctamente todos los campos obligatorios.',
        type:    NotificationType.ERROR
      });
      return;
    }

    // 2. Validar que el archivo exista si es una propuesta nueva
    if (!this.isEditMode && !this.attachedFile.hasFile) {
      this.notificationService.show({
        title:   'Archivo requerido',
        message: 'Debe adjuntar el formato de propuesta antes de guardar.',
        type:    NotificationType.ERROR
      });
      return;
    }

    const raw = this.proposalForm.getRawValue();
    const authorsArray = raw.student2
      ? [raw.student1 as string, raw.student2]
      : [raw.student1 as string];

    const initialDocuments: ProposalDocument[] = this.buildInitialDocuments();

    // 3. Resolución del TODO del Director
    // Si tu userService tiene un método para el usuario actual, úsalo aquí.
    // De lo contrario, tomamos el ID del primer profesor simulado como fallback.
    const currentDirectorId = this.userService.currentUser()?.id || 'Usuario no encontrado';
    // Idealmente sería algo como: this.userService.getCurrentUser()?.id || 'director_mock_001';

    const updatedProposal: Proposal = {
      ...(this.proposal() ?? {}),
      title:       raw.title       as string,
      description: raw.description as string,
      modality:    raw.modality    as string,
      authors:     authorsArray,
      directorId:  currentDirectorId,
      codirector:  raw.codirector  || undefined,
      advisor:     raw.advisor     || undefined,
      state:       this.proposal()?.state     ?? stateList.EN_REVISION,
      createdAt:   this.proposal()?.createdAt ?? new Date(),
      documents:   initialDocuments,
      evaluations: this.proposal()?.evaluations ?? []
    } as Proposal;

    this.onSubmit.emit(updatedProposal);
  }

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.attachedFile = { hasFile: true, name: event.fileName };
    this.uploadModalOpen = false;
    this.notificationService.show({
      title:   'Archivo cargado',
      message: 'El documento se ha adjuntado correctamente.',
      type:    NotificationType.CONFIRMATION
    });
  }

  removeFile(): void {
    this.attachedFile = { hasFile: false, name: null };
  }

  private syncFormWithProposal(): void {
    const p = this.proposal();
    if (p) {
      this.proposalForm.patchValue({
        title:       p.title,
        description: p.description,
        modality:    p.modality,
        codirector:  p.codirector  ?? '',
        student1:    p.authors[0]  ?? '',
        student2:    p.authors[1]  ?? '',
        advisor:     (p as any).advisor ?? ''
      });
      const firstDoc = p.documents[0] ?? null;
      this.attachedFile = {
        hasFile: p.documents.length > 0,
        name:    firstDoc?.name ?? null
      };
    } else {
      this.proposalForm.reset({ modality: '', student1: '', student2: '', codirector: '', advisor: '' });
      this.attachedFile = { hasFile: false, name: null };
    }
  }

  private buildInitialDocuments(): ProposalDocument[] {
    if (this.isEditMode) return this.proposal()?.documents ?? [];
    if (!this.attachedFile.hasFile || !this.attachedFile.name) return [];

    return [{
      id:         crypto.randomUUID(),
      name:       this.attachedFile.name,
      url:        '',
      uploadDate: new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, ' - '),
      type:       'Propuesta',
      status:     stateList.EN_REVISION
    }];
  }
}
