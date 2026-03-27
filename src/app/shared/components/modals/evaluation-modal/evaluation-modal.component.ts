import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { StateComponent, stateList } from '../../state/state.component';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button-component/button-component.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-evaluation-modal',
  imports: [DialogModule, CommonModule, StateComponent, ButtonComponent, TooltipModule],
  templateUrl: './evaluation-modal.component.html',
  styleUrls: ['./evaluation-modal.component.css']
})
export class EvaluationModalComponent{

  protected stateList = stateList;

  @Input() isOpen: boolean = false;
  @Input() name: string = '';
  @Input() role: string = '';
  @Input() evaluationDate: Date = new Date;
  @Input() state?:stateList;
  @Input() comments: string = '';
  @Input() documents: string[] = [];

  @Output() onClose = new EventEmitter<void>()
  @Output() onDownloadFile = new EventEmitter<string>()

  closeModal() {
    this.onClose.emit()
  }
  downloadFile (fileName: string){
    this.onDownloadFile.emit(fileName);
  }

}
