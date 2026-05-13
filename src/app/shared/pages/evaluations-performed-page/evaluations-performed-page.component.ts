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

  protected readonly columns = EVALUATIONS_COLUMNS;
  private readonly contextId = signal<string | null>(null);

  protected evaluationsWithPermissions = computed(() => {
    const id = this.contextId();
    if (!id) return [];
    const currentUrl = this.router.url;
    let rawEvaluations: Evaluation[] = [];
    let allDocuments: Document[] = [];
    let defaultTitle = 'Documento no identificado';

    if (currentUrl.includes('preliminary-draft')) {
      const preliminaryDraft = this.preliminaryDraftService.preliminaryDrafts().find(preliminaryDraft => preliminaryDraft.preliminaryDraftId === id);
      if (preliminaryDraft) {
        rawEvaluations = preliminaryDraft.evaluations || [];
        allDocuments = preliminaryDraft.documents || [];
        defaultTitle = preliminaryDraft.proposalData.title;
      }
    } else if (currentUrl.includes('proposal')) {
      const proposal = this.proposalService.proposals().find(proposal => proposal.id === id);
      if (proposal) {
        rawEvaluations = proposal.evaluations || [];
        allDocuments = proposal.documents || [];
        defaultTitle = proposal.title;
      }
    }
    const MAIN_DOC_TYPES = new Set(['Anteproyecto', 'Propuesta', 'Correccion']);
    return rawEvaluations.map(evaluation => {
      const targetDocument = allDocuments.find(document => document.id === evaluation.documentId);
      const fallbackDoc = targetDocument
        ? null
        : (allDocuments as any).findLast((doc: Document) => MAIN_DOC_TYPES.has(doc.type));
      return {
        ...evaluation,
        documentTargetName: targetDocument?.name || fallbackDoc?.name || defaultTitle,
        allowedActions: ['view_details']
      };
    });
  });

  modalState = signal<{ open: boolean; evaluation: Evaluation | null }>({
    open: false, evaluation: null
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ||
               this.route.snapshot.parent?.paramMap.get('id');

    if (id) {
      this.contextId.set(id);
    } else {
      this.handleError('No se pudo identificar el registro para cargar las evaluaciones.');
    }
  }

  handleTableAction(event: { action: string; row: any }): void {
    if (event.row.allowedActions && !event.row.allowedActions.includes(event.action)) {
      return;
    }
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
