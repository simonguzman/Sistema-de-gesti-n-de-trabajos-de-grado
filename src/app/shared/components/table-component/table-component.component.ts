import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { StateComponent } from '../state/state.component';
import { ButtonComponent } from '../button-component/button-component.component';
interface TableButton{
  label?: string;
  icon?: string;
  variant: 'primary' | 'secondary'
}

interface ActionButton{
  action: string;
  label?: string;
  icon?: string;
}
interface Column{
  field: string;
  header: string;
  type?: 'text' | 'state' | 'actions';
  actions?: ActionButton[];
}


@Component({
  selector: 'app-table-component',
  imports: [ CommonModule, TableModule, ButtonComponent, StateComponent],
  templateUrl: './table-component.component.html',
  styleUrl: './table-component.component.css'
})
export class TableComponent {

  @Input() value: any[] = [];
  @Input() columns: Column[] = [];
  @Input() rows: number = 10;
  @Input() paginator : boolean = false;
  @Input() headerButtons?: TableButton[];

  @Output() actionClick = new EventEmitter<{ action: string; row:any }>();
  @Output() headerButtonClick = new EventEmitter<TableButton>();

}
