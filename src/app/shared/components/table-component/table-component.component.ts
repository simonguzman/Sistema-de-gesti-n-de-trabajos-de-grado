import { Component, Input } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

interface Column{
  field: string;
  header: string;
  type?: 'text' | 'state' | 'actions';
}

@Component({
  selector: 'app-table-component',
  imports: [TreeTableModule, CommonModule, TableModule],
  templateUrl: './table-component.component.html',
  styleUrl: './table-component.component.css'
})
export class TableComponent {

  @Input() value: any[] = [];
  @Input() columns: Column[] = [];
  @Input() rows: number = 10;
  @Input() paginator : boolean = false;
  @Input() showButton ?: boolean = false;
  @Input() buttonLabel ?: string;
  @Input() buttonIcon ?: string;

  files: TreeNode[] = [];
  cols: any[] = [];

  constructor() {
    // Definir las columnas (debes tener al menos field y header)
    this.cols = [
      { field: 'name', header: 'Nombre' },
      { field: 'size', header: 'Tamaño' },
      { field: 'type', header: 'Tipo' },
      { field: 'actions', header: 'Acciones' } // 👈 opcional, para los botones
    ];

    // Datos de ejemplo del TreeTable
    this.files = [
      {
        data: {
          name: 'Documentos',
          size: '75kb',
          type: 'Carpeta'
        },
        children: [
          {
            data: {
              name: 'Informe.docx',
              size: '25kb',
              type: 'Documento'
            }
          },
          {
            data: {
              name: 'Carta.docx',
              size: '30kb',
              type: 'Documento'
            }
          }
        ]
      },
      {
        data: {
          name: 'Imágenes',
          size: '150kb',
          type: 'Carpeta'
        },
        children: [
          {
            data: {
              name: 'foto1.png',
              size: '50kb',
              type: 'Imagen'
            }
          },
          {
            data: {
              name: 'foto2.png',
              size: '60kb',
              type: 'Imagen'
            }
          }
        ]
      }
    ];
  }
}
