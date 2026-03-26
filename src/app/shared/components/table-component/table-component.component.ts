import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { StateComponent } from '../state/state.component';
import { ButtonComponent } from '../button-component/button-component.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
export interface TableButton{
  label?: string;
  icon?: string;
  variant: 'primary' | 'secondary';
}

export interface ActionButton{
  action: string;
  label?: string;
  icon?: string;
  variant: 'primary' | 'secondary'
}
export interface Column{
  field: string;
  header: string;
  type?: 'text' | 'state' | 'actions';
  actions?: ActionButton[];
  width ?: string;
}


@Component({
  selector: 'app-table-component',
  imports: [ CommonModule, TableModule, ButtonComponent, StateComponent, EmptyStateComponent, TooltipModule],
  templateUrl: './table-component.component.html',
  styleUrl: './table-component.component.css'
})
export class TableComponent {

  @Input() value: any[] = [];
  @Input() columns: Column[] = [];
  @Input() rows: number = 5;
  @Input() paginator : boolean = false;
  @Input() headerButtons?: TableButton[];
  @Input() emptyMessage: string = 'No hay datos registrados en el sistema';

  @Output() actionClick = new EventEmitter<{ action: string; row:any }>();
  @Output() headerButtonClick = new EventEmitter<TableButton>();

}
