import { Component, inject, OnInit, signal } from '@angular/core';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Evaluation } from '../../../../core/interfaces/evaluation.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { ReviewPreliminaryDraftFormComponent } from "../../components/review-preliminary-draft-form/review-preliminary-draft-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";

@Component({
  selector: 'app-review-preliminary-draft-page',
  templateUrl: './review-preliminary-draft-page.component.html',
  styleUrls: ['./review-preliminary-draft-page.component.css'],
  imports: [ReviewPreliminaryDraftFormComponent, ConfirmationActionModalComponent]
})
export class ReviewPreliminaryDraftPageComponent implements OnInit {
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  preliminaryDraft = signal<PreliminaryDraft | null>(null);
  isConfirmModalOpen = signal(false);
  pendingEvaluationData = signal<{formValues: any, file: File} | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') // Nivel actual
          ?? this.route.parent?.snapshot.paramMap.get('id') // Nivel loaded_documents
          ?? this.route.parent?.parent?.snapshot.paramMap.get('id'); // Nivel details/:id (Aquí está el ID)
    if (!id) {
      console.error('ID no encontrado en la jerarquía de rutas');
      this.notificationService.show({
        title: 'Error',
        message: 'No se pudo encontrar el identificador del anteproyecto.',
        type: NotificationType.ERROR
      });
      this.router.navigate(['/notifications']);
      return;
    }
    this.preliminaryDraftService.getDraftByIdMock(id).subscribe(data => {
      if (!data) return;

      const isEvaluator = data.evaluators?.some(
        evaluator => evaluator.id === this.authService.currentUser()?.id
      );
      if (!isEvaluator) {
        this.notificationService.show({
          title: 'Acceso denegado',
          message: 'No eres evaluador de este proyecto.',
          type: NotificationType.ERROR
        });
        this.router.navigate(['/dashboard']);
        return;
      }
      this.preliminaryDraft.set(data);
    });
  }

  handleRequestConfirmation(data: {formValues: any, file: File}){
    this.pendingEvaluationData.set(data);
    this.isConfirmModalOpen.set(true);
  }

  processEvaluation() {
    const data = this.pendingEvaluationData();
    const currentPreliminaryDraft = this.preliminaryDraft();
    const user = this.authService.currentUser();

    if (!data || !currentPreliminaryDraft || !user || !currentPreliminaryDraft.preliminaryDraftId) {
      return;
    }

    const evaluation: Evaluation = {
      id: crypto.randomUUID(),
      proposalId: currentPreliminaryDraft.proposalId,
      // Cambiar de [length - 1] a [0] para asegurar que se evalúa la versión más reciente
      documentId: currentPreliminaryDraft.documents[0].id,
      evaluatorName: `${user.firstName} ${user.lastName}`,
      evaluatorRole: 'Evaluador',
      veredict: data.formValues.result === 'Aprobado' ? stateList.APROBADO : stateList.NO_APROBADO,
      observations: data.formValues.comments,
      signedDocuments: [data.file.name],
      date: new Date()
    };

    this.preliminaryDraftService.addEvaluationMock(currentPreliminaryDraft.preliminaryDraftId, evaluation).subscribe({
      next: () => {
        const isReject = evaluation.veredict === stateList.NO_APROBADO;

        this.notificationService.show({
          title: isReject ? 'Anteproyecto No Aprobado' : 'Evaluación Registrada',
          message: isReject
            ? 'Has marcado el proyecto como No Aprobado. El estudiante deberá cargar correcciones.'
            // CORRECCIÓN: El mensaje ahora indica que el proceso sigue en revisión para el Consejo
            : 'Tu evaluación positiva ha sido guardada. El anteproyecto continuará en revisión hasta la decisión final del consejo de facultad.',
          type: isReject ? NotificationType.INFO : NotificationType.CONFIRMATION
        });

        this.isConfirmModalOpen.set(false);
        // Navegamos hacia atrás en la jerarquía
        this.router.navigate(['../../'], { relativeTo: this.route });
      }
    });
  }

  downloadCurrentDocument() {
    const preliminaryDraft = this.preliminaryDraft();
    if (!preliminaryDraft || preliminaryDraft.documents.length === 0) return;
    const document = preliminaryDraft.documents[0];
    this.downloadService.download(document.url, document.name);
  }

}
