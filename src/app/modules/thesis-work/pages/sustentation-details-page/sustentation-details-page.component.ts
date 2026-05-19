import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThesisWorkService } from '../../services/thesis-work.service';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { JurorVerdict, ThesisWork } from '../../interfaces/thesis-work.interface';
import { Document, DocumentType } from '../../../../core/interfaces/Document.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";
import { DatePipe } from '@angular/common';
import { stateList } from '../../../../core/enums/state.enum';

@Component({
  selector: 'app-sustentation-details-page',
  templateUrl: './sustentation-details-page.component.html',
  styleUrls: ['./sustentation-details-page.component.css'],
  imports: [ButtonComponent, DatePipe]
})
export class SustentationDetailsPageComponent implements OnInit {
  protected route = inject(ActivatedRoute);
  public router = inject(Router);
  private readonly thesisWorkService = inject(ThesisWorkService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly downloadService = inject(FileDownloadService);

  thesisWorkDetails = signal<ThesisWork | null>(null);

  // Computado para obtener el último veredicto (Acta final)
  latestVerdict = computed<JurorVerdict | null>(() => {
    const work = this.thesisWorkDetails();
    if (!work || !work.sustentation || !work.sustentation.verdicts) return null;

    const verdicts = work.sustentation.verdicts;
    return verdicts.length > 0 ? verdicts[verdicts.length - 1] : null;
  });

  // 🧠 REGLA DE NEGOCIO: Mostrar botón solo si fue aprobado con observaciones
  showCorrectedDocumentsButton = computed<boolean>(() => {
    const verdict = this.latestVerdict();
    return verdict?.veredict === stateList.APROBADO_CON_OBSERVACIONES;
  });

  // Computado para obtener el archivo de sustentación (Formato G)
  actaDocument = computed<Document | null>(() => {
    const work = this.thesisWorkDetails();
    if (!work || !work.documents) return null;
    return work.documents.find(doc => doc.type === (DocumentType['FORMATO G'] || 'Formato G')) || null;
  });

  ngOnInit(): void {
    const thesisWorkId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (!thesisWorkId) {
      this.handleNavigationError();
      return;
    }

    this.thesisWorkService.getThesisWorkByIdMock(thesisWorkId).subscribe({
      next: (foundData) => {
        if (foundData) {
          this.thesisWorkDetails.set(foundData);
        } else {
          this.showNotFoundNotification();
          this.goBack();
        }
      },
      error: (error) => {
        this.showErrorNotification();
        this.goBack();
        console.error('Error al recuperar detalles:', error);
      }
    });
  }

  // --- Navegación a Documentos Corregidos ---
  navigateToCorrectedDocuments(): void {
    // Al ser una ruta hermana de "view_sustentation_details", subimos un nivel con '../'
    this.router.navigate(['../corrected_documents'], { relativeTo: this.route });
  }

  getMemberName(userId: string | undefined): string {
    return this.userService.getUserFullName(userId);
  }

  getAuthors(ids: string[] | undefined): string {
    return this.userService.getAuthorsNames(ids);
  }

  getAssignedJurors(): string {
    const work = this.thesisWorkDetails();
    const jurors = work?.sustentation?.assignedJurors || [];
    if (jurors.length === 0) return 'No asignados';
    return jurors.map((j: any) => this.userService.getUserFullName(j.id || j)).join(' y ');
  }

  downloadDocument(): void {
    const targetDocument = this.actaDocument();
    if (!targetDocument?.url) {
      this.showDownloadError();
      return;
    }
    this.downloadService.download(targetDocument.url, targetDocument.name);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // --- Notificaciones de Error ---
  private handleNavigationError(): void {
    this.notificationService.show({
      title: 'Identificador faltante',
      message: 'No se pudo procesar la solicitud debido a un ID inválido.',
      type: NotificationType.ERROR
    });
    this.goBack();
  }

  private showNotFoundNotification(): void {
    this.notificationService.show({
      title: 'Registro inexistente',
      message: 'El trabajo de grado solicitado no se encuentra registrado.',
      type: NotificationType.ERROR
    });
  }

  private showErrorNotification(): void {
    this.notificationService.show({
      title: 'Error de comunicación',
      message: 'Hubo un problema al intentar conectar con el repositorio.',
      type: NotificationType.ERROR
    });
  }

  private showDownloadError() {
    this.notificationService.show({
      title: 'Archivo no disponible',
      message: 'El acta de sustentación no se encuentra adjunta.',
      type: NotificationType.ERROR
    });
  }
}
