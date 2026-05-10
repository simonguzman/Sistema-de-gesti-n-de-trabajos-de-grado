import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Evaluation } from '../../interfaces/evaluation.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ProposalService } from '../../services/proposal.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { EvaluationModalComponent } from '../../../../shared/components/modals/evaluation-modal/evaluation-modal.component';

const EVALUATIONS_COLUMNS: Column[] = [
  { field: 'evaluatorName',    header: 'Nombre',                     type: 'text',    width: '20%' },
  { field: 'evaluatorRole',    header: 'Rol',                        type: 'text',    width: '20%' },
  { field: 'signedDocuments',  header: 'Documento evaluado',         type: 'text',    width: '25%' },
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
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private proposalService     = inject(ProposalService);
  private downloadService     = inject(FileDownloadService);
  private notificationService = inject(NotificationService);

  readonly columns = EVALUATIONS_COLUMNS;

  proposalId = signal<string | null>(null);

  modalState = signal<{ open: boolean; evaluation: Evaluation | null }>({
    open: false, evaluation: null
  });

  evaluations = computed<Evaluation[]>(() => {
    const id = this.proposalId();
    if (!id) return [];
    const proposal = this.proposalService.proposals().find(p => p.id === id);
    return proposal?.evaluations ?? [];
  });

  ngOnInit(): void {
    const id = this.route.pathFromRoot
      .map(route => route.snapshot.paramMap.get('id'))
      .find(id => id !== null);

    if (id) {
      this.proposalId.set(id);
      if (this.evaluations().length === 0) {
        this.showNoDataNotification();
      }
    }
  }

  handleTableAction(event: { action: string; row: Evaluation }): void {
    if (event.action === 'view_details') {
      this.modalState.set({ open: true, evaluation: event.row });
    }
  }

  closeModal(): void {
    this.modalState.set({ open: false, evaluation: null });
  }

  handleDownload(fileName: string): void {
    if (!fileName) {
      this.showDownloadErrorNotification();
      return;
    }
    this.showDownloadStartedNotification();
    this.downloadService.download(`assets/evaluaciones/${fileName}`, fileName);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private showDownloadStartedNotification() {
    this.notificationService.show({
      title: 'Descarga iniciada',
      message: 'El documento de la evaluación se está descargando en su dispositivo.',
      type: NotificationType.INFO
    });
  }

  private showDownloadErrorNotification() {
    this.notificationService.show({
      title: 'Archivo no encontrado',
      message: 'No se pudo localizar el documento firmado de esta evaluación.',
      type: NotificationType.ERROR
    });
  }

  private showNoDataNotification() {
    this.notificationService.show({
      title: 'Sin evaluaciones',
      message: 'Esta propuesta aún no cuenta con registros de evaluación por parte del comité.',
      type: NotificationType.INFO
    });
  }

}
