import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { Document } from '../../../../core/interfaces/Document.interface';
import { ReviewPresentationsFacultyCouncilFormComponent } from "../../components/review-presentations-faculty-council-form/review-presentations-faculty-council-form.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserService } from '../../../users/services/user.service';

@Component({
  selector: 'app-review-presentations-faculty-council-page',
  templateUrl: './review-presentations-faculty-council-page.component.html',
  styleUrls: ['./review-presentations-faculty-council-page.component.css'],
  imports: [ReviewPresentationsFacultyCouncilFormComponent, ConfirmationActionModalComponent]
})
export class ReviewPresentationsFacultyCouncilPageComponent implements OnInit {
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService)
  private readonly notification = inject(NotificationService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  preliminaryDraft = signal<PreliminaryDraft | null>(null);
  isConfirmModalOpen = signal(false);
  pendingData = signal<{formValues: any, file: File} | null>(null);
  readonly filteredDraft = computed(() => {
    const draft = this.preliminaryDraft();
    if (!draft || !draft.documents) return null;

    // 1. Identificamos el Anteproyecto o Corrección más reciente
    const anteDocs = [...draft.documents]
      .filter(d => d.type === 'Anteproyecto' || d.type === 'Correccion')
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    const latestAnteId = anteDocs[0]?.id;

    // 2. Filtramos las evaluaciones vinculadas a ese documento específico
    const currentEvaluations = draft.evaluations?.filter(e => e.documentId === latestAnteId) || [];

    // 3. Extraemos todos los IDs o nombres de los documentos firmados en estas evaluaciones
    // Usamos flatMap para obtener una lista plana de todos los signedDocuments
    const evaluationFilesIds = currentEvaluations.flatMap(e => e.signedDocuments || []);

    // 4. Filtramos los ARCHIVOS finales para la vista del Consejo
    const currentDocuments = draft.documents.filter(doc => {
      // a. El anteproyecto/corrección actual
      if (doc.id === latestAnteId) return true;

      // b. VINCULACIÓN DINÁMICA: Si el nombre o ID del documento está en las evaluaciones
      // Se asume que signedDocuments guarda el 'name' o 'id' del Document
      const isSignedEvaluationFile = evaluationFilesIds.some(fileRef =>
        fileRef === doc.id || fileRef === doc.name
      );
      if (isSignedEvaluationFile) return true;

      // c. Documentos base: Propuesta original, Formatos y Anexos
      return doc.type === 'Propuesta' || doc.type === 'Formato' || doc.type === 'Anexo';
    });

    return {
      ...draft,
      documents: currentDocuments,
      evaluations: currentEvaluations
    };
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
            ?? this.route.parent?.parent?.snapshot.paramMap.get('id');

    if (id) {
      this.preliminaryDraftService.getDraftByIdMock(id).subscribe(data => {
        if (data) this.preliminaryDraft.set(data);
      });
    }
  }

  handleRequestConfirmation(data: {formValues: any, file: File}) {
    this.pendingData.set(data);
    this.isConfirmModalOpen.set(true);
  }

  processCouncilDecision() {
    const data = this.pendingData();
    const draft = this.preliminaryDraft();
    if (!data || !draft || !draft.preliminaryDraftId) return;

    const finalState = data.formValues.result === 'Aprobado'
      ? stateList.APROBADO
      : stateList.NO_APROBADO;

    // Identificamos el documento de presentación que se está evaluando
    const presentationDoc = draft.documents.find(d => d.type === 'Formato');

    const resolutionDoc: Document = {
      id: crypto.randomUUID(),
      name: data.file.name,
      url: '',
      uploadDate: new Date().toLocaleDateString(),
      type: 'Resolucion',
      status: finalState
    };

    // CORRECCIÓN 1: Obtener el nombre real del usuario logueado
    const currentUser = this.authService.currentUser();
    const currentUserName = currentUser
      ? this.userService.getUserFullName(currentUser.id)
      : 'Consejo de Facultad';

    // CORRECCIÓN 2: Usar 'observations' en lugar de 'comments' para que el modal lo reconozca
    const councilEvaluation = {
      id: crypto.randomUUID(),
      documentId: presentationDoc?.id || '',
      veredict: finalState,
      evaluatorName: currentUserName,
      observations: data.formValues.comments,
      date: new Date().toISOString(),
      signedDocuments: [resolutionDoc.name]
    };

    this.preliminaryDraftService.uploadCouncilResolutionMock(
      draft.preliminaryDraftId,
      resolutionDoc,
      finalState,
      councilEvaluation
    ).subscribe({
      next: () => {
        this.notification.show({
          title: 'Decisión Guardada',
          message: 'Se ha registrado la resolución del consejo de facultad.',
          type: NotificationType.CONFIRMATION
        });
        this.isConfirmModalOpen.set(false);
        this.router.navigate(['../../'], { relativeTo: this.route });
      }
    });
  }

  downloadFile(doc: Document) {
    if (doc?.url) this.downloadService.download(doc.url, doc.name);
  }

  goBack() { this.router.navigate(['../../'], { relativeTo: this.route }); }
}


