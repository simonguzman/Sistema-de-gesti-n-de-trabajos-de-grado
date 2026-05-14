import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Evaluation } from '../../../core/interfaces/evaluation.interface';
import { NotificationType } from '../../components/notifications/models/notification.model';
import { ProposalService } from '../../../modules/proposal/services/proposal.service';
import { FileDownloadService } from '../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../components/notifications/services/notification.service';
import { Column, TableComponent } from '../../components/table-component/table-component.component';
import { EvaluationModalComponent } from '../../components/modals/evaluation-modal/evaluation-modal.component';
import { PreliminaryDraftService } from '../../../modules/preliminary-draft/services/preliminary-draft.service';
import { Document } from '../../../core/interfaces/Document.interface';
import { toSignal } from '@angular/core/rxjs-interop';

const EVALUATIONS_COLUMNS: Column[] = [
  { field: 'evaluatorName',    header: 'Nombre',                     type: 'text',    width: '20%' },
  { field: 'evaluatorRole',    header: 'Rol',                        type: 'text',    width: '20%' },
  { field: 'documentTargetName',  header: 'Documento evaluado',         type: 'text',    width: '25%' },
  { field: 'veredict',         header: 'Resultado de la evaluación', type: 'state',   width: '20%' },
  {
    field: 'acciones',
    header: 'Detalles de la evaluación',
    type: 'actions',
    width: '15%',
    actions: [
      { action: 'view_details', label: 'Ver detalles', variant: 'primary', disabled: false }
    ]
  }
];

@Component({
  selector: 'app-evaluations-performed-page',
  imports: [TableComponent, EvaluationModalComponent],
  templateUrl: './evaluations-performed-page.component.html',
  styleUrls: ['./evaluations-performed-page.component.css']
})
export class EvaluationsPerformedPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly proposalService = inject(ProposalService);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly notificationService = inject(NotificationService);

  private readonly params = toSignal(this.route.paramMap);
  private readonly parentParams = toSignal(this.route.parent?.paramMap || this.route.paramMap);

  private readonly contextId = computed(() =>
    this.params()?.get('id') || this.parentParams()?.get('id')
  );

  protected readonly columns = EVALUATIONS_COLUMNS;

  protected evaluationsWithPermissions = computed(() => {
    const id = this.contextId();
    if (!id) return [];

    const currentUrl = this.router.url;
    let rawEvaluations: Evaluation[] = [];
    let allDocuments: Document[] = [];
    let defaultTitle = 'Documento no identificado';

    if (currentUrl.includes('preliminary-draft')) {
      const draft = this.preliminaryDraftService.preliminaryDrafts()
        .find(d => d.preliminaryDraftId === id);

      if (draft) {
        // Usamos únicamente las evaluaciones reales del historial
        rawEvaluations = [...(draft.evaluations || [])];
        allDocuments = draft.documents || [];
        defaultTitle = draft.proposalData.title;
      }
    } else if (currentUrl.includes('proposal')) {
      const proposal = this.proposalService.proposals().find(p => p.id === id);
      if (proposal) {
        rawEvaluations = [...(proposal.evaluations || [])];
        allDocuments = proposal.documents || [];
        defaultTitle = proposal.title;
      }
    }

    const MAIN_DOC_TYPES = new Set(['Anteproyecto', 'Propuesta', 'Correccion', 'Formato']);

    // Invertimos el arreglo para mostrar la última evaluación al principio
    return [...rawEvaluations].reverse().map(evaluation => {
      const targetDocument = allDocuments.find(doc => doc.id === evaluation.documentId);

      // NORMALIZACIÓN: Detectar si es el Consejo para rellenar campos vacíos si es necesario
      const isCouncil = evaluation.evaluatorName?.toLowerCase().includes('consejo') ||
                        evaluation.evaluatorRole === 'Consejo';

      const evaluatorName = evaluation.evaluatorName || (isCouncil ? 'Consejo de Facultad' : 'Evaluador');
      const evaluatorRole = evaluation.evaluatorRole || (isCouncil ? 'Consejo' : 'Evaluador');

      let docName = targetDocument?.name;
      if (!docName && isCouncil) {
        docName = allDocuments.find(d => d.type === 'Formato')?.name || 'Presentación al consejo de facultad';
      }

      const fallbackDoc = targetDocument ? null :
        [...allDocuments].reverse().find(doc => MAIN_DOC_TYPES.has(doc.type));

      return {
        ...evaluation,
        evaluatorName,
        evaluatorRole,
        // CORRECCIÓN: Compatibilidad con 'observations' (nuevo) y 'comments' (viejo en LocalStorage)
        observations: evaluation.observations || (evaluation as any).comments || 'Sin observaciones registradas.',
        documentTargetName: docName || fallbackDoc?.name || defaultTitle,
        allowedActions: ['view_details']
      };
    });
  });

  modalState = signal<{ open: boolean; evaluation: Evaluation | null }>({
    open: false, evaluation: null
  });

  ngOnInit(): void {
    if (!this.contextId()) {
      this.handleError('No se pudo identificar el registro.');
    }
  }

  handleTableAction(event: { action: string; row: any }): void {
    if (event.action === 'view_details') {
      this.modalState.set({ open: true, evaluation: event.row });
    }
  }

  closeModal(): void {
    this.modalState.set({ open: false, evaluation: null });
  }

  handleDownload(fileName: string): void {
    if (!fileName) {
      this.showNotification('Error', 'No se pudo localizar el documento de evaluación.', NotificationType.ERROR);
      return;
    }
    this.showNotification('Descarga', 'Iniciando la descarga del documento...', NotificationType.INFO);
    this.downloadService.download(`assets/evaluaciones/${fileName}`, fileName);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private showNotification(title: string, message: string, type: NotificationType): void {
    this.notificationService.show({ title, message, type });
  }

  private handleError(message: string): void {
    this.showNotification('Atención', message, NotificationType.ERROR);
    this.router.navigate(['/']);
  }
}
