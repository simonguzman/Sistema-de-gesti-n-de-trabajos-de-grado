import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TabItem, TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Column, TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { FileDownloadService } from '../../../../core/services/file-download.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

interface DownloadableFormat {
  id: string;
  title: string;
  url: string;
}

@Component({
  selector: 'app-downloadable-formats-page',
  imports: [CommonModule, TabsComponent, TableComponent],
  templateUrl: './downloadable-formats-page.component.html',
  styleUrls: ['./downloadable-formats-page.component.css']
})
export class DownloadableFormatsPageComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private downloadService = inject(FileDownloadService);
  private notificationService = inject(NotificationService);

  tabs: TabItem[] = [
    { label: 'Trabajo de investigación ', value: 'TI' },
    { label: 'Practica profesional', value: 'PP'}
  ];

  activeTab = signal<string>('TI');

  columns: Column[] = [
    { field: 'title', header: 'Título', type: 'text', width: '80%' },
    {
      field: 'acciones',
      header: '', // Lo dejamos vacío para que coincida con tu diseño
      type: 'actions',
      actions: [
        { action: 'descargar', label: 'Descargar formato', variant: 'primary', disabled: false }
      ],
      width: '20%'
    }
  ];

  private allFormats: Record<string, DownloadableFormat[]> = {
    'TI': [
      { id: 'ti-a', title: 'FORMATO TI-A: PRESENTACION DE LA PROPUESTA DE TRABAJO DE GRADO MODALIDAD TRABAJO DE INVESTIGACIÓN AL COMITÉ DE PROGRAMA...', url: '/assets/formatos/TI-A.pdf' },
      { id: 'ti-b', title: 'FORMATO TI-B: PRESENTACION DE LA PROPUESTA DE TRABAJO DE GRADO MODALIDAD TRABAJO DE INVESTIGACIÓN AL COMITÉ DE PROGRAMA...', url: '/assets/formatos/TI-B.pdf' },
      { id: 'ti-c', title: 'FORMATO TI-C: PRESENTACION DE LA PROPUESTA DE TRABAJO DE GRADO MODALIDAD TRABAJO DE INVESTIGACIÓN AL COMITÉ DE PROGRAMA...', url: '/assets/formatos/TI-C.pdf' },
      { id: 'ti-e', title: 'FORMATO TI-E: REMISIÓN DEL DOCUMENTO FINAL AL CONSEJO DE FACULTAD POR EL DIRECTOR RESPECTIVO...', url: '/assets/formatos/TI-E.pdf' },
      { id: 'ti-f', title: 'FORMATO TI-F: REMISIÓN DEL DOCUMENTO FINAL AL CONSEJO DE FACULTAD POR EL DIRECTOR RESPECTIVO...', url: '/assets/formatos/TI-F.pdf' },
      { id: 'ti-g', title: 'FORMATO TI-G: REMISIÓN DEL DOCUMENTO FINAL AL CONSEJO DE FACULTAD POR EL DIRECTOR RESPECTIVO...', url: '/assets/formatos/TI-G.pdf' },
      { id: 'ti-h', title: 'FORMATO TI-H: CONSTANCIA DEL DIRECTOR DEL TRABAJO Y JURADOS DE QUE EL MATERIAL ENTREGADO CORRESPONDE A LA VERSIÓN SUSTENTADA...', url: '/assets/formatos/TI-H.pdf' }
    ],
    'PP': [
      { id: 'pp-a', title: 'FORMATO PP-A: INSCRIPCIÓN DE LA PRÁCTICA PROFESIONAL...', url: '/assets/formatos/PP-A.pdf' },
      { id: 'pp-b', title: 'FORMATO PP-B: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-B.pdf' },
      { id: 'pp-c', title: 'FORMATO PP-C: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-C.pdf' },
      { id: 'pp-d', title: 'FORMATO PP-D: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-D.pdf' },
      { id: 'pp-e', title: 'FORMATO PP-E: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-E.pdf' },
      { id: 'pp-f', title: 'FORMATO PP-F: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-F.pdf' },
      { id: 'pp-g', title: 'FORMATO PP-G: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-G.pdf' },
      { id: 'pp-h', title: 'FORMATO PP-H: EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE EN PRÁCTICA...', url: '/assets/formatos/PP-H.pdf' },
    ]
  };

  currentFormats = computed(() => {
    return this.allFormats[this.activeTab()] || [];
  });

  onTabChange(newTabValue: string){
    this.activeTab.set(newTabValue);
  }

  handleTableAction(event: { action: string, row: DownloadableFormat }){
    if (event.action === 'descargar') {
      const format = event.row;
      this.showFileDownloadInfoNotification();
      // 2. Ejecutamos la descarga usando la URL definida en el objeto
      // Nota: Como son archivos locales en assets, esto funcionará de inmediato.
      this.downloadService.download(format.url, `${format.id.toUpperCase()}.pdf`);
    }
  }

  private showFileDownloadInfoNotification(){
    this.notificationService.show({
      title: 'Preparando descarga',
      message: `El archivo comenzará a descargarse en breve.`,
      type: NotificationType.INFO
    });
  }

  goBack(){
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
