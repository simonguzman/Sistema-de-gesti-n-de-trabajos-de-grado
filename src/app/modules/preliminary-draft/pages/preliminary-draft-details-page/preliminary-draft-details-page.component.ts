import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { FileDownloadService } from '../../../../core/services/filedownload/file-download.service';
import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { ButtonComponent } from "../../../../shared/components/button-component/button-component.component";

@Component({
  selector: 'app-preliminary-draft-details-page',
  templateUrl: './preliminary-draft-details-page.component.html',
  styleUrls: ['./preliminary-draft-details-page.component.css'],
  imports: [ButtonComponent]
})
export class PreliminaryDraftDetailsPageComponent implements OnInit {
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly dowloadService = inject(FileDownloadService);

  preliminaryDraft = signal<PreliminaryDraft | null>(null);
  mainDocument = computed(() => {
    const draft = this.preliminaryDraft();
    if (!draft) return null;
    return draft.documents.find(doc => doc.type === 'Anteproyecto') || draft.documents[0] || null;
  });
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(!id){
      this.handleNavigationError();
      return;
    }
    this.preliminaryDraftService.getDraftByIdMock(id).subscribe({
      next: (data) => {
        if(data) {
          this.preliminaryDraft.set(data);
        } else {
          this.showNotFoundNotification();
          this.router.navigate(['preliminary-draft']);
        }
      },
      error: (err) => {
        this.showErrorNotification();
        this.router.navigate(['/preliminary-draft']);
        console.error(err);
      }
    })
  }

  getMemberName(userId: string | undefined): string{
    return this.userService.getUserFullName(userId);
  }

  getAuthors(ids: string[] | undefined ): string {
    return this.userService.getAuthorsNames(ids);
  }

  downloadDocument(): void {
    const document = this.mainDocument();
    if(!document?.url){
      this.showDownloadFileErrorNotification();
      return;
    }
    this.showDownloadFileInfoNotification();
    this.dowloadService.download(document.url, document.name);
    this.showDownloadFileSuccessNotification();

  }

  private showDownloadFileSuccessNotification(): void {
     this.notificationService.show({
        title: 'Descarga finalizada',
        message: 'El anteproyecto fue descargado exitosamente.',
        type: NotificationType.INFO
    });
  }

  private showDownloadFileInfoNotification(): void {
     this.notificationService.show({
        title: 'Descarga iniciada',
        message: 'El anteproyecto se está descargando...',
        type: NotificationType.INFO
    });
  }

  private showDownloadFileErrorNotification(): void {
     this.notificationService.show({
        title: 'Error',
        message: 'No hay un documento adjunto para descargar.',
        type: NotificationType.ERROR
    });
  }

  private handleNavigationError(): void {
     this.notificationService.show({
     title: 'Acceso inválido',
      message: 'No se proporcionó un ID válido.',
      type: NotificationType.ERROR
    });
    this.router.navigate(['/preliminary-draft'])
  }

  private showNotFoundNotification() {
    this.notificationService.show({
      title: 'No encontrado',
      message: 'No se pudo encontrar el anteproyecto solicitado.',
      type: NotificationType.ERROR
    });
  }

  private showErrorNotification() {
    this.notificationService.show({
      title: 'Error',
      message: 'Error al conectar con el servidor.',
      type: NotificationType.ERROR
    });
  }

}
