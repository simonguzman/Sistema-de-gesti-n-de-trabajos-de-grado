import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FileDownloadService } from '../../../core/services/filedownload/file-download.service';
import { NotificationService } from '../../components/notifications/services/notification.service';
import { NotificationType } from '../../components/notifications/models/notification.model';
import { TabItem, TabsComponent } from '../../components/tabs/tabs.component';
import { Column, TableComponent } from '../../components/table-component/table-component.component';

interface DownloadableFormat {
  id: string;
  title: string;
  url: string;
}

const TABS: TabItem[] = [
  { label: 'Trabajo de investigación', value: 'TI' },
  { label: 'Práctica profesional',     value: 'PP' }
];

const COLUMNS: Column[] = [
  { field: 'title',    header: 'Título',  type: 'text',    width: '80%' },
  { field: 'acciones', header: '',        type: 'actions', width: '20%',
    actions: [{ action: 'descargar', label: 'Descargar formato', variant: 'primary', disabled: false }]
  }
];

const FORMATS: Record<string, DownloadableFormat[]> = {
  TI: [
    { id: 'ti-a', title: 'FORMATO TI-A: PRESENTACION DE LA PROPUESTA DE TRABAJO DE GRADO MODALIDAD TRABAJO DE INVESTIGACIÓN AL COMITÉ DE PROGRAMA...', url: '/assets/formatos/TI-A.pdf' },
    { id: 'ti-b', title: 'FORMATO TI-B: PRESENTACION DE LA PROPUESTA DE TRABAJO DE GRADO MODALIDAD TRABAJO DE INVESTIGACIÓN AL COMITÉ DE PROGRAMA...', url: '/assets/formatos/TI-B.pdf' },
    { id: 'ti-c', title: 'FORMATO TI-C: PRESENTACION DE LA PROPUESTA DE TRABAJO DE GRADO MODALIDAD TRABAJO DE INVESTIGACIÓN AL COMITÉ DE PROGRAMA...', url: '/assets/formatos/TI-C.pdf' },
    { id: 'ti-e', title: 'FORMATO TI-E: REMISIÓN DEL DOCUMENTO FINAL AL CONSEJO DE FACULTAD POR EL DIRECTOR RESPECTIVO...',                           url: '/assets/formatos/TI-E.pdf' },
    { id: 'ti-f', title: 'FORMATO TI-F: REMISIÓN DEL DOCUMENTO FINAL AL CONSEJO DE FACULTAD POR EL DIRECTOR RESPECTIVO...',                           url: '/assets/formatos/TI-F.pdf' },
    { id: 'ti-g', title: 'FORMATO TI-G: REMISIÓN DEL DOCUMENTO FINAL AL CONSEJO DE FACULTAD POR EL DIRECTOR RESPECTIVO...',                           url: '/assets/formatos/TI-G.pdf' },
    { id: 'ti-h', title: 'FORMATO TI-H: CONSTANCIA DEL DIRECTOR DEL TRABAJO Y JURADOS DE QUE EL MATERIAL ENTREGADO CORRESPONDE A LA VERSIÓN SUSTENTADA...', url: '/assets/formatos/TI-H.pdf' }
  ],
  PP: [
    { id: 'pp-a', title: 'FORMATO PP-A: INSCRIPCIÓN DE LA PRÁCTICA PROFESIONAL...',                    url: '/assets/formatos/PP-A.pdf' },
    { id: 'pp-b', title: 'FORMATO PP-B: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-B.pdf' },
    { id: 'pp-c', title: 'FORMATO PP-C: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-C.pdf' },
    { id: 'pp-d', title: 'FORMATO PP-D: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-D.pdf' },
    { id: 'pp-e', title: 'FORMATO PP-E: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-E.pdf' },
    { id: 'pp-f', title: 'FORMATO PP-F: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-F.pdf' },
    { id: 'pp-g', title: 'FORMATO PP-G: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-G.pdf' },
    { id: 'pp-h', title: 'FORMATO PP-H: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...',       url: '/assets/formatos/PP-H.pdf' }
  ]
};

@Component({
  selector: 'app-downloadable-formats-page',
  imports: [TabsComponent, TableComponent],
  templateUrl: './downloadable-formats-page.component.html',
  styleUrls: ['./downloadable-formats-page.component.css']
})
export class DownloadableFormatsPageComponent {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private downloadService     = inject(FileDownloadService);
  private notificationService = inject(NotificationService);

  readonly tabs    = TABS;
  readonly columns = COLUMNS;

  activeTab      = signal<string>('TI');
  currentFormats = computed(() => FORMATS[this.activeTab()] ?? []);

  async handleTableAction(event: { action: string; row: DownloadableFormat }): Promise<void> {
    if (event.action !== 'descargar') return;
    const { url, id } = event.row;
    const formatCode = id.toUpperCase();
    if (!url?.trim()) {
      this.showDownloadError('La ruta del archivo no es válida o está vacía.');
    return;
    }
    const fileName = `${formatCode}.pdf`;
    this.showDownloadStarted(formatCode);
    try {
      await this.downloadService.download(url, fileName);
      this.showDownloadSuccess(formatCode);
    } catch (err) {
      this.showDownloadError(`No se pudo descargar el ${formatCode}. Intente más tarde.`);
      console.log(err);
    }
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private showDownloadStarted(formatCode: string) {
    this.notificationService.show({
      title: 'Descarga en curso',
      message: `Iniciando la descarga del ${formatCode}. Revise su carpeta de descargas.`,
      type: NotificationType.INFO
    });
  }

  private showDownloadError(message: string) {
    this.notificationService.show({
      title: 'Error de descarga',
      message: message,
      type: NotificationType.ERROR
    });
  }

  // Opcional: Si implementas un callback de éxito en el servicio
  private showDownloadSuccess(formatCode: string) {
    this.notificationService.show({
      title: 'Archivo descargado',
      message: `El ${formatCode} se ha guardado exitosamente.`,
      type: NotificationType.CONFIRMATION
    });
  }
}
