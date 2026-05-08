import { Component, computed, DestroyRef, effect, EventEmitter, inject, input, Output, signal } from '@angular/core';
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
import { UserRoleType } from '../../../../core/models/user-role';
import { ProposalService } from '../../services/proposal.service';

@Component({
  selector: 'app-proposal-form',
  imports: [ReactiveFormsModule ,ButtonComponent, FileUploadModalComponent],
  templateUrl: './proposal-form.component.html',
  styleUrls: ['./proposal-form.component.css']
})
export class ProposalFormComponent {
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private proposalService = inject(ProposalService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  // Señal para rastrear al estudiante 1 seleccionado y disparar la reactividad en el select 2
  private selectedStudent1Id = signal<string>('');

  protected students = this.userService.students;
  protected teachers = this.userService.teachers;
  protected advisors = this.userService.advisors;

  proposal = input<Proposal | null>(null);
  @Output() onSubmit = new EventEmitter<Proposal>();

  proposalForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    modality: ['', Validators.required],
    student1: ['', Validators.required],
    student2: [''],
    codirector: [''],
    advisor: ['']
  });

  attachedFile = { hasFile: false, name: null as string | null };
  uploadModalOpen = false;

  // 1. Estudiantes que NO tienen propuestas (o son de la propuesta actual)
  protected availableStudents = computed(() => {
    const allStudents = this.userService.students();
    const allProposals = this.proposalService.proposals();
    const currentProposal = this.proposal();

    return allStudents.filter(student => {
      const proposalWithStudent = allProposals.find(p => p.authors.includes(student.id));
      if (!proposalWithStudent) return true;
      return currentProposal ? proposalWithStudent.id === currentProposal.id : false;
    });
  });

  // 2. Estudiantes para el select 2 (filtramos al que ya se eligió en el select 1)
  // Esta señal depende de 'availableStudents' y de 'selectedStudent1Id'
  protected filteredStudentsForS2 = computed(() => {
    const available = this.availableStudents();
    const s1Id = this.selectedStudent1Id();
    return available.filter(s => s.id !== s1Id);
  });

  constructor() {
    effect(() => this.syncFormWithProposal());
  }

  ngOnInit(): void {
    // Simulación de login para pruebas
    const pablo = this.userService.users().find(u => u.lastName === 'Mage');
    if (pablo) this.userService.login(pablo);

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
    // Lógica para modalidad y asesor
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

    // Lógica para filtrar al estudiante 2 en tiempo real
    this.proposalForm.get('student1')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        const studentId = id ?? '';
        this.selectedStudent1Id.set(studentId); // Actualizamos la Signal manual

        // Si el estudiante 2 es el mismo que el 1, lo reseteamos
        const s2Control = this.proposalForm.get('student2');
        if (s2Control?.value === studentId) {
          s2Control.setValue('');
        }
      });
  }

  submit(): void {
    if (this.proposalForm.invalid) {
      this.proposalForm.markAllAsTouched();
      this.notificationService.show({
        title: 'Formulario incorrecto',
        message: 'Por favor, diligencie correctamente todos los campos obligatorios.',
        type: NotificationType.ERROR
      });
      return;
    }

    if (!this.isEditMode && !this.attachedFile.hasFile) {
      this.notificationService.show({
        title: 'Archivo requerido',
        message: 'Debe adjuntar el formato de propuesta antes de guardar.',
        type: NotificationType.ERROR
      });
      return;
    }

    const raw = this.proposalForm.getRawValue();
    if (raw.codirector) {
      this.userService.addRoleToUser(raw.codirector, UserRoleType.CODIRECTOR);
    }

    const authorsArray = raw.student2
      ? [raw.student1 as string, raw.student2]
      : [raw.student1 as string];

    const updatedProposal: Proposal = {
      ...(this.proposal() ?? {}),
      title: raw.title as string,
      description: raw.description as string,
      modality: raw.modality as string,
      authors: authorsArray,
      directorId: this.userService.currentUser()?.id || 'Usuario no encontrado',
      codirector: raw.codirector || undefined,
      advisor: raw.advisor || undefined,
      state: this.proposal()?.state ?? stateList.EN_REVISION,
      createdAt: this.proposal()?.createdAt ?? new Date(),
      documents: this.buildInitialDocuments(),
      evaluations: this.proposal()?.evaluations ?? []
    } as Proposal;

    this.onSubmit.emit(updatedProposal);
  }

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.attachedFile = { hasFile: true, name: event.fileName };
    this.uploadModalOpen = false;
    this.notificationService.show({
      title: 'Archivo cargado',
      message: 'El documento se ha adjuntado correctamente.',
      type: NotificationType.CONFIRMATION
    });
  }

  removeFile(): void {
    this.attachedFile = { hasFile: false, name: null };
  }

  private syncFormWithProposal(): void {
    const p = this.proposal();
    if (p) {
      const s1 = p.authors[0] ?? '';
      this.selectedStudent1Id.set(s1); // Sincronizamos la señal al cargar edición

      this.proposalForm.patchValue({
        title: p.title,
        description: p.description,
        modality: p.modality,
        codirector: p.codirector ?? '',
        student1: s1,
        student2: p.authors[1] ?? '',
        advisor: (p as any).advisor ?? ''
      });

      this.attachedFile = {
        hasFile: p.documents.length > 0,
        name: p.documents[0]?.name ?? null
      };
    } else {
      this.proposalForm.reset({ modality: '', student1: '', student2: '', codirector: '', advisor: '' });
      this.selectedStudent1Id.set('');
      this.attachedFile = { hasFile: false, name: null };
    }
  }

  private buildInitialDocuments(): ProposalDocument[] {
    if (this.isEditMode) return this.proposal()?.documents ?? [];
    if (!this.attachedFile.hasFile || !this.attachedFile.name) return [];

    return [{
      id: crypto.randomUUID(),
      name: this.attachedFile.name,
      url: '',
      uploadDate: new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, ' - '),
      type: 'Propuesta',
      status: stateList.EN_REVISION
    }];
  }
}
