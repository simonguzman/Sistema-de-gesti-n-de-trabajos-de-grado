import { Component } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-table-component',
  imports: [TreeTableModule, ButtonModule],
  templateUrl: './table-component.component.html',
  styleUrl: './table-component.component.css'
})
export class TableComponentComponent {
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
