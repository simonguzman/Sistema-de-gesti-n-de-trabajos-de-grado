import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { AssignEvaluatorsFormComponent } from "../../components/assign-evaluators-form/assign-evaluators-form.component";
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';

@Component({
  selector: 'app-assing-evaluators-page',
  templateUrl: './assing-evaluators-page.component.html',
  styleUrls: ['./assing-evaluators-page.component.css'],
  imports: [AssignEvaluatorsFormComponent]
})
export class AssingEvaluatorsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly draftService = inject(PreliminaryDraftService);
  private readonly notificationService = inject(NotificationService);

  preliminaryDraftId = signal<string | null>(null);
  draft = signal<PreliminaryDraft | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ??
             this.route.parent?.snapshot.paramMap.get('id') ??
             this.route.parent?.parent?.snapshot.paramMap.get('id');
    if (!id) {
      this.showNavigationErrorNotification();
      this.goBack();
      return;
    }

    this.preliminaryDraftId.set(id);
    this.loadDraft(id);
  }

  private loadDraft(id: string): void {
    this.draftService.getDraftByIdMock(id).subscribe({
      next: (data) => {
        if (data) {
          this.draft.set(data);
        } else {
          this.goBack();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  handleAssign(evaluators: { ev1: string; ev2: string }): void {
    const currentDraft = this.draft();
    if (!currentDraft?.preliminaryDraftId) return;
    this.draftService.assignReviewersMock(
      currentDraft.preliminaryDraftId,
      [evaluators.ev1, evaluators.ev2]
    ).subscribe({
      next: () => {
        this.showAssingEvaluatorsSuccessNotification();
        this.goBack();
      },
      error: () => {
        this.showConnectionErrorNotification();
      }
    });
  }
  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

   private showNavigationErrorNotification(): void {
    this.notificationService.show({
      title: 'Error de navegación',
      message: 'No se pudo encontrar el identificador del anteproyecto.',
      type: NotificationType.ERROR
    });
  }

  private showAssingEvaluatorsSuccessNotification(): void {
    this.notificationService.show({
      title: 'Asignación exitosa',
      message: 'Los jurados evaluadores han sido guardados correctamente.',
      type: NotificationType.CONFIRMATION
    });
  }

  private showConnectionErrorNotification(): void {
    this.notificationService.show({
      title: 'Error de conexión',
      message: 'Ocurrió un error al intentar asignar los evaluadores.',
      type: NotificationType.ERROR
    });
  }

}
