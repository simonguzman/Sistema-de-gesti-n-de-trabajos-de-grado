import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonComponent } from '../../button-component/button-component.component';

@Component({
  selector: 'app-confirmation-action-modal',
  imports: [DialogModule, ButtonComponent],
  templateUrl: './confirmation-action-modal.component.html',
  styleUrls: ['./confirmation-action-modal.component.css']
})
export class ConfirmationActionModalComponent {

  @Input() isOpen: boolean = false;
  @Input() description: string = '';

  @Output() onClose = new EventEmitter<void>()
  @Output() onConfirm = new EventEmitter<void>()

  closeModal() {
    this.onClose.emit()
  }

  confirmAction(){
    this.onConfirm.emit();
    this.closeModal();
  }
}
