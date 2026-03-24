import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog'

@Component({
  selector: 'app-file-upload-modal',
  imports: [DialogModule],
  templateUrl: './file-upload-modal.component.html',
  styleUrls: ['./file-upload-modal.component.css']
})
export class FileUploadModalComponent {

  @Input() isOpen: boolean = false;
  @Input() description: string = '';
  @Input() uploadedBy: string = '';

  @Output() onFileUploaded = new EventEmitter<{ fileName: string, file: File }>();
  @Output() onClose = new EventEmitter<void>()

  uploadedFile: File | null = null;

  onFileSelected(event: Event){
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]
    if(file){
      this.uploadedFile = file
      this.onFileUploaded.emit({
        fileName: this.uploadedFile.name,
        file: this.uploadedFile

      })
    }
  }

  removeFile() {
    this.uploadedFile = null;
  }

  closeModal() {
    this.uploadedFile = null;
    this.onClose.emit()
  }
}
