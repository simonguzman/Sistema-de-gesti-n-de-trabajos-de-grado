import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Proposal } from '../../interfaces/proposal.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { stateList } from '../../../../shared/components/state/state.component';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModalComponent } from "../../../../shared/components/modals/file-upload-modal/file-upload-modal.component";
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { Evaluation } from '../../interfaces/evaluation.interface';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { UserService } from '../../../users/services/user.service';

const RESULT_TO_STATE: Record<string, stateList> = {
  'Aprobado':                    stateList.APROBADO,
  'Aprobado con observaciones':  stateList.APROBADO_CON_OBSERVACIONES,
  'No aprobado':                 stateList.NO_APROBADO
};
@Component({
  selector: 'app-evaluation-proposal-page',
  imports: [CommonModule, ReactiveFormsModule, FileUploadModalComponent, ConfirmationActionModalComponent, ButtonComponent],
  templateUrl: './evaluation-proposal-page.component.html',
  styleUrls: ['./evaluation-proposal-page.component.css'],
})
export class EvaluationProposalPageComponent implements OnInit  {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private location            = inject(Location);
  private proposalService     = inject(ProposalService);
  private downloadService     = inject(FileDownloadService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private fb                  = inject(FormBuilder);

  proposal = signal<Proposal | null>(null);

  // Estado del archivo firmado agrupado
  signedFile = signal<{ name: string } | null>(null);

  // Estado de modales agrupado
  modalState = {
    upload:  false,
    confirm: false
  };

  evaluationForm = this.fb.group({
    result:   ['', Validators.required],
    comments: ['', Validators.required]
  });

  displayFields = computed(() => {
    const p = this.proposal();
    if (!p) return [];

    return [
      { label: 'Título', value: p.title },
      { label: 'Fecha de carga', value: this.documentUploadDate },
      { label: 'Modalidad', value: p.modality },
      { label: 'Estudiante(s)', value: this.userService.getAuthorsNames(p.authors) },
      { label: 'Director', value: this.userService.getUserFullName(p.directorId) },
      { label: 'Estado Actual', value: p.state }
    ];
  });

  getStudentNames(authors: string[] | undefined): string {
    return this.userService.getAuthorsNames(authors);
  }

  getDirectorName(directorId: string | undefined): string {
    return this.userService.getUserFullName(directorId);
  }

  getCodirectorName(codirectorId: string | undefined): string {
    if (!codirectorId) return '';
    return this.userService.getUserFullName(codirectorId);
  }


  getAdvisorName(advisorId: string | undefined): string {
    if (!advisorId) return '';
    return this.userService.getUserFullName(advisorId);
  }

  get originalDocument() {
    return this.proposal()?.documents?.[0] ?? null;
  }

  get documentUploadDate(): string {
    const date = this.originalDocument?.uploadDate;
    if (!date) return 'Fecha no disponible';
    return date instanceof Date
      ? date.toLocaleDateString('es-ES')
      : date;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
            ?? this.route.parent?.snapshot.paramMap.get('id');

    if (!id) { this.location.back(); return; }

    this.proposalService.getProposalByIdMock(id).subscribe({
      next:  (data) => data ? this.proposal.set(data) : this.location.back(),
      error: ()     => this.location.back()
    });
  }

  handleFileUploaded(event: { fileName: string; file: File }): void {
    this.signedFile.set({ name: event.fileName });
    this.modalState.upload = false;
    this.notificationService.show({
      title:   'Formato A firmado cargado',
      message: 'El documento se ha adjuntado correctamente a la evaluación.',
      type:    NotificationType.CONFIRMATION
    });
  }

  removeSignedFile(): void {
    this.signedFile.set(null);
    this.notificationService.show({
      title:   'Archivo removido',
      message: 'El formato firmado ha sido quitado de la evaluación.',
      type:    NotificationType.INFO
    });
  }

  downloadOriginalDocument(): void {
    const doc = this.originalDocument;
    if (!doc?.url?.trim()) {
      this.notificationService.show({
        title:   'Error',
        message: 'No se encontró la URL del documento para descargar.',
        type:    NotificationType.ERROR
      });
      return;
    }
    this.notificationService.show({
      title:   'Descarga iniciada',
      message: 'Descargando el documento...',
      type:    NotificationType.INFO
    });
    this.downloadService.download(doc.url, doc.name);
  }

  initiateEvaluationSubmit(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      this.notificationService.show({
        title:   'Formulario incompleto',
        message: 'Por favor, seleccione un resultado y añada sus comentarios.',
        type:    NotificationType.ERROR
      });
      return;
    }
    if (!this.signedFile()) {
      this.notificationService.show({
        title:   'Archivo requerido',
        message: 'Debe cargar el formato de evaluación firmado antes de guardar.',
        type:    NotificationType.ERROR
      });
      return; // ← faltaba este return
    }
    this.modalState.confirm = true;
  }

  confirmEvaluation(): void {
    this.modalState.confirm = false;
    const currentProposal = this.proposal();
    if (!currentProposal?.id) return;

    const { result, comments } = this.evaluationForm.value;
    const newState = RESULT_TO_STATE[result!] ?? currentProposal.state;

    const newEvaluation: Evaluation = {
      id: crypto.randomUUID(),
      proposalId: currentProposal.id,
      evaluatorName: 'Usuario Autenticado', // Aquí podrías usar authService.currentUser()
      evaluatorRole: 'Jurado',
      signedDocuments: this.signedFile() ? [this.signedFile()!.name] : [],
      veredict: newState,
      observations: comments!,
      date: new Date()
    };

    this.proposalService.addEvaluationMock(currentProposal.id, newEvaluation).subscribe({
      next: () => {
        this.notificationService.show({
          title:   'Evaluación registrada',
          message: 'La evaluación se ha guardado y el estado se ha actualizado.',
          type:    NotificationType.CONFIRMATION
        });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {
        this.notificationService.show({
          title:   'Error de actualización',
          message: 'No se pudo guardar la evaluación. Intente nuevamente.',
          type:    NotificationType.ERROR
        });
      }
    });
  }

  cancelEvaluation(): void {
    this.modalState.confirm = false;
  }

  goBack(): void {
    this.location.back();
  }
}
