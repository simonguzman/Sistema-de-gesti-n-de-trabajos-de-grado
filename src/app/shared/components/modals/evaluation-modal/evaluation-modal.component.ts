import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { stateList } from '../../state/state.component';

@Component({
  selector: 'app-evaluation-modal',
  imports: [DialogModule],
  templateUrl: './evaluation-modal.component.html',
  styleUrls: ['./evaluation-modal.component.css']
})
export class EvaluationModalComponent{

  protected stateList = stateList;

  @Input() isOpen: boolean = false;
  @Input() name: string = '';
  @Input() evaluationDate: Date = new Date;
  @Input() state?:stateList;
  @Input() comments: string = '';
  @Input() documents: string[] = [];

  @Output() onClose = new EventEmitter<void>()

  closeModal() {
    this.onClose.emit()
  }

}
