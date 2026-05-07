import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { EvaluationModalComponent } from '../../../../shared/components/modals/evaluation-modal/evaluation-modal.component';
import { Evaluation } from '../../interfaces/evaluation.interface';
import { stateList } from '../../../../shared/components/state/state.component';
import { ProposalService } from '../../services/proposal.service';
import { FileDownloadService } from '../../../../core/services/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

@Component({
  selector: 'app-evaluations-performed-page',
  imports: [TableComponent, EvaluationModalComponent],
  templateUrl: './evaluations-performed-page.component.html',
  styleUrls: ['./evaluations-performed-page.component.css']
})
export class EvaluationsPerformedPageComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proposalService = inject(ProposalService);
  private downloadService = inject(FileDownloadService);
  private notificationService = inject(NotificationService);

  proposalId = signal<string | null>(null);
  isModalOpen= signal(false);
  selectedEvaluation = signal<Evaluation | null>(null);

  columns: Column[] = [
    { field: 'evaluatorName', header: 'Nombre', type: 'text', width: '20%' },
    { field: 'evaluatorRole', header: 'Rol', type: 'text', width: '20%' },
    { field: 'signedDocuments', header: 'Documento evaluado', type: 'text', width: '25%' },
    { field: 'veredict', header: 'Resultado de la evaluación', type: 'state', width: '20%' },
    {
      field: 'acciones',
      header: 'Detalles de la evaluación',
      type: 'actions',
      actions: [
        { action: 'view_details', label: 'ver detalles', variant: 'primary', disabled: false }
      ],
      width: '15%'
    }
  ];

  evaluations = computed<Evaluation[]>(() => {
    const id = this.proposalId();
    if(!id) return [];
    const proposal = this.proposalService.proposals().find(proposal => proposal.id === id);
    return proposal ? proposal.evaluations : []
  });

  ngOnInit(): void {
    const proposalId = this.route.pathFromRoot
      .map(route => route.snapshot.paramMap.get('id'))
      .find(id => id !== null);

    if (proposalId) {
      this.proposalId.set(proposalId);

      const proposal = this.proposalService.proposals()
        .find(p => p.id === proposalId);

      console.log('PROPUESTA:', proposal);
      console.log('EVALUACIONES:', proposal?.evaluations);
    }
  }

  handleTableAction(event: { action: string, row: Evaluation }){
    if(event.action === 'view_details'){
      this.selectedEvaluation.set(event.row);
      this.isModalOpen.set(true);
    }
  }

  closeModal(){
    this.isModalOpen.set(false);
    this.selectedEvaluation.set(null);
  }

  handleDownload(fileName: string) {
    console.log('Iniciando descarga de:', fileName);

    // NOTA: Como en localstorage solo guardamos el nombre por ahora,
    // usamos una URL de prueba o el mismo nombre como ruta.
    const mockUrl = `assets/evaluaciones/${fileName}`;

    this.showDownloadFileInfoNotification();
    // Intentamos la descarga
    this.downloadService.download(mockUrl, fileName);
  }

  private showDownloadFileInfoNotification(){
    this.notificationService.show({
      title: 'Descarga Iniciada',
      message: `Descargando el archivo...`,
      type: NotificationType.INFO
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

}
