import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';

import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { Evaluation } from '../../../../core/interfaces/evaluation.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

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
  private readonly notification = inject(NotificationService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Signals para gestión de estado
  preliminaryDraftState = signal<PreliminaryDraft | null>(null);
  isConfirmModalOpen = signal(false);
  pendingReviewData = signal<{ formValues: any, file: File } | null>(null);

  /**
   * Identifica la revisión activa (Anteproyecto o Corrección más reciente).
   * Esto garantiza que el evaluador siempre califique el último documento cargado.
   */
  readonly activeRevision = computed(() => {
    const preliminaryDraft = this.preliminaryDraftState();
    if (!preliminaryDraft?.documents || preliminaryDraft.documents.length === 0) return null;
    return [...preliminaryDraft.documents]
      .filter(document => document.type === 'Anteproyecto' || document.type === 'Correccion')
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];
  });

  ngOnInit() {
    const contextId = this.route.snapshot.paramMap.get('id')
      ?? this.route.parent?.snapshot.paramMap.get('id')
      ?? this.route.parent?.parent?.snapshot.paramMap.get('id');

    if (!contextId) {
      this.showNavigationContextErrorNotification();
      this.router.navigate(['/notifications']);
      return;
    }
    this.loadPreliminaryDraftData(contextId);
  }

  private loadPreliminaryDraftData(id: string) {
    this.preliminaryDraftService.getPreliminaryDraftByIdMock(id).subscribe({
      next: (data) => {
        if (!data) {
          this.showNotFoundInformationNotification();
          return;
        }
        const isUserAssignedAsEvaluator = data.evaluators?.some(
          evaluator => evaluator.id === this.authService.currentUser()?.id
        );
        if (!isUserAssignedAsEvaluator) {
          this.showAccessDeniedNotification();
          this.router.navigate(['/dashboard']);
          return;
        }
        this.preliminaryDraftState.set(data);
      },
      error: () => this.showChargeServerErrorNotification()
    });
  }

  handleRequestConfirmation(data: { formValues: any, file: File }) {
    this.pendingReviewData.set(data);
    this.isConfirmModalOpen.set(true);
  }

  processEvaluation() {
    const assessmentData = this.pendingReviewData();
    const preliminaryDraft = this.preliminaryDraftState();
    const currentUser = this.authService.currentUser();
    const currentRevision = this.activeRevision();
    if (!assessmentData || !preliminaryDraft?.preliminaryDraftId || !currentUser || !currentRevision) {
      this.showValidationReviewErrorNotification();
      return;
    }
    const isVeredictNegative = assessmentData.formValues.result !== 'Aprobado';
    const peerReviewEvaluation: Evaluation = {
      id: crypto.randomUUID(),
      proposalId: preliminaryDraft.proposalId,
      documentId: currentRevision.id, // Evaluación anclada a la revisión activa
      evaluatorName: `${currentUser.firstName} ${currentUser.lastName}`,
      evaluatorRole: 'Evaluador',
      veredict: isVeredictNegative ? stateList.NO_APROBADO : stateList.APROBADO,
      observations: assessmentData.formValues.comments,
      signedDocuments: [assessmentData.file.name],
      date: new Date()
    };
    this.preliminaryDraftService.addEvaluationMock(preliminaryDraft.preliminaryDraftId, peerReviewEvaluation).subscribe({
      next: () => {
        this.showEvaluationSuccessNotification(isVeredictNegative);
        this.isConfirmModalOpen.set(false);
        this.router.navigate(['../../'], { relativeTo: this.route });
      },
      error: () => this.showProcessEvaluationErrorNotification()
    });
  }

  downloadCurrentDocument() {
    const revision = this.activeRevision();
    if (revision?.url) {
      this.downloadService.download(revision.url, revision.name);
    } else {
      this.showDownloadUnavailableNotification();
    }
  }

  // --- MÉTODOS PRIVADOS DE NOTIFICACIÓN ---

  private showNavigationContextErrorNotification() {
    this.notification.show({
      title: 'Error de Contexto',
      message: 'No se pudo identificar el anteproyecto en la ruta actual. Contacte a soporte.',
      type: NotificationType.ERROR
    });
  }

  private showNotFoundInformationNotification() {
    this.notification.show({
      title: 'No Encontrado',
      message: 'El anteproyecto solicitado no existe o no se encuentra disponible.',
      type: NotificationType.INFO
    });
  }

  private showAccessDeniedNotification() {
    this.notification.show({
      title: 'Acceso Denegado',
      message: 'Usted no tiene permisos de evaluación asignados para este proyecto académico.',
      type: NotificationType.ERROR
    });
  }

  private showChargeServerErrorNotification() {
    this.notification.show({
      title: 'Error de Conexión',
      message: 'Hubo un fallo al intentar obtener la información del servidor.',
      type: NotificationType.ERROR
    });
  }

  private showValidationReviewErrorNotification() {
    this.notification.show({
      title: 'Validación Fallida',
      message: 'Faltan datos del evaluador o del documento para registrar la calificación.',
      type: NotificationType.ERROR
    });
  }

  private showEvaluationSuccessNotification(isReject: boolean) {
    this.notification.show({
      title: isReject ? 'Revisión con Observaciones' : 'Evaluación Exitosa',
      message: isReject
        ? 'Se ha registrado el veredicto negativo. El sistema solicitará correcciones al autor.'
        : 'Su evaluación positiva ha sido guardada. El proceso continuará hacia el Consejo de Facultad.',
      type: isReject ? NotificationType.INFO : NotificationType.CONFIRMATION
    });
  }

  private showProcessEvaluationErrorNotification() {
    this.notification.show({
      title: 'Error al Registrar',
      message: 'Ocurrió un problema técnico al intentar guardar su evaluación en la base de datos.',
      type: NotificationType.ERROR
    });
  }

  private showDownloadUnavailableNotification() {
    this.notification.show({
      title: 'Archivo no Encontrado',
      message: 'La revisión actual no cuenta con un enlace de descarga válido.',
      type: NotificationType.INFO
    });
  }
}
