import { Component, computed, DestroyRef, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../users/interfaces/user.interface';
import { UserService } from '../../../users/services/user.service';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { UserRoleType } from '../../../../core/models/user-role';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-assign-evaluators-form',
  imports: [ReactiveFormsModule, ButtonComponent, NgTemplateOutlet, DatePipe],
  providers: [DatePipe],
  templateUrl: './assign-evaluators-form.component.html',
  styleUrls: ['./assign-evaluators-form.component.css']
})
export class AssignEvaluatorsFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly draftService = inject(PreliminaryDraftService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  draft = input.required<PreliminaryDraft>();

  private readonly selectedEvaluator1Id = signal<string>('');

  @Output() onSave = new EventEmitter<{ ev1: string, ev2: string }>();

  form = this.fb.group({
    evaluator1: ['', Validators.required],
    evaluator2: ['', Validators.required]
  });

  availableEvaluators = computed(() => {
    const allUsers = this.userService.users();
    const currentDraft = this.draft();
    if (!currentDraft.proposalData) return [];

    const data = currentDraft.proposalData;
    const forbiddenIds = new Set<string>();

    // 1. Excluir participantes directos (Director, Codirector, Asesor, Autores)
    if (data.director?.id) forbiddenIds.add(data.director.id);
    if (data.codirector?.id) forbiddenIds.add(data.codirector.id);
    if (data.advisor?.id) forbiddenIds.add(data.advisor.id);
    data.authors?.forEach(auth => {
      if (typeof auth === 'string') {
        forbiddenIds.add(auth);
      } else if (auth && (auth as any).id) {
        forbiddenIds.add((auth as any).id);
      }
    });

    return allUsers.filter(user => {
      // 2. Debe ser DOCENTE
      const isDocente = user.roles?.includes(UserRoleType.DOCENTE);

      // 3. No debe ser participante directo
      const isNotParticipant = !forbiddenIds.has(user.id);

      // 4. NUEVA REGLA: No debe tener roles administrativos que generen conflicto de interés
      const hasConflictRole = user.roles?.some(role =>
        role === UserRoleType.JEFE_DEP || role === UserRoleType.CONSEJO
      );

      return isDocente && isNotParticipant && !hasConflictRole;
    });
  });


  protected filteredEvaluatorsForE2 = computed(() => {
    const available = this.availableEvaluators();
    const firstId = this.selectedEvaluator1Id();
    return available.filter(user => user.id !== firstId);
  });

  ngOnInit(): void {
    this.setupDynamicLogic();
  }

  private setupDynamicLogic(): void {
    this.form.get('evaluator1')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: string | null) => {
        this.selectedEvaluator1Id.set(id || '');

        if (this.form.get('evaluator2')?.value === (id || '')) {
          this.form.get('evaluator2')?.setValue('');
        }
      });
  }

  getMemberName(user: User | undefined): string {
    if (!user) return 'No asignado';
    return [user.firstName, user.secondName, user.lastName, user.secondLastName]
      .filter(n => !!n)
      .join(' ');
  }

  getAuthorsNames(ids: string[] | undefined): string {
    return this.userService.getAuthorsNames(ids) || 'No asignado';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notificationService.show({
        title: 'Formulario incompleto',
        message: 'Debe seleccionar ambos evaluadores.',
        type: NotificationType.ERROR
      });
      return;
    }
    const { evaluator1, evaluator2 } = this.form.value;
    const validationError = this.draftService.validateReviewersRules(
      this.draft().proposalData,
      evaluator1!,
      evaluator2!
    );
    if (validationError) {
      this.notificationService.show({
        title: 'Error en la asignación',
        message: validationError,
        type: NotificationType.ERROR
      });
      return;
    }
    this.onSave.emit({ ev1: evaluator1!, ev2: evaluator2! });
  }
}
