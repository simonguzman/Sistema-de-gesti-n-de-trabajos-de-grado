import { Component, EventEmitter, Input, Output } from '@angular/core';
import { stateList } from '../../state/state.component';

@Component({
  selector: 'app-register-information-modal',
  imports: [],
  templateUrl: './register-information-modal.component.html',
  styleUrls: ['./register-information-modal.component.css']
})
export class RegisterInformationModalComponent  {
  protected stateList = stateList;

  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() modality: string = '';
  @Input() student: string = '';
  @Input() director: string = '';
  @Input() codirector?: string;
  @Input() adviser?: string;
  @Input() chargeDate: Date = new Date;
  @Input() state?:stateList;
  @Input() documents: string[] = [];

  @Output() onClose = new EventEmitter<void>()

  closeModal() {
    this.onClose.emit()
  }
}
