import { Component } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { FileUploadModalComponent } from "../../../../shared/components/file-upload-modal/file-upload-modal.component";

@Component({
  selector: 'app-statistics-page',
  imports: [FileUploadModule, FileUploadModalComponent],
  templateUrl: './statistics-page.component.html',
  styleUrl: './statistics-page.component.css',
})
export class StatisticsPageComponent {

  isModalOpen = false;

  handleFileUploaded(event: { fileName: string, file: File }) {
    console.log('Archivo recibido:', event.fileName);
  }

}
