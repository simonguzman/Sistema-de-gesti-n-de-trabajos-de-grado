import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

export enum stateList{
  APROBADO = 'Aprobado',
  APROBADO_CON_OBSERVACIONES = 'Aprobado con observaciones',
  NO_APROBADO = 'No aprobado',
  APLAZADO = 'Aplazado',
  EN_DESARROLLO = 'En desarrollo',
  EVALUADO = 'Evaluado',
  EN_REVISION = 'En revision'
}

@Component({
  selector: 'app-state',
  imports: [NgClass],
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.css']
})
export class StateComponent {

  protected stateList = stateList

  @Input() label?: string;
  @Input() state?: stateList;

  getState(): string {
    switch(this.state){
      case this.stateList.APROBADO: return 'state-aprobado'
      case this.stateList.APROBADO_CON_OBSERVACIONES: return 'state-aprobado-con-observaciones'
      case this.stateList.NO_APROBADO: return 'state-no-aprobado'
      case this.stateList.APLAZADO: return 'state-aplazado'
      case this.stateList.EN_DESARROLLO: return 'state-en-desarrollo'
      case this.stateList.EN_REVISION: return 'state-en-revision'
      case this.stateList.EVALUADO: return 'state-evaluado'
      default: return ''
    }
  }

}

