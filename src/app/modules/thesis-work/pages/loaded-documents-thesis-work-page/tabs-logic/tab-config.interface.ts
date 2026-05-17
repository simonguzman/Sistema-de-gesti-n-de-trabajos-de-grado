// tab-config.interface.ts
import { Column, TableButton } from '../../../../../shared/components/table-component/table-component.component';
import { Document, DocumentType } from '../../../../../core/interfaces/Document.interface';

export interface ThesisEvaluationContext {
  thesisWork: any;
  currentUser: any;
  isAdmin: boolean;
  isStudent: boolean;
  isDirector: boolean;
  isDecanatura: boolean;
  isCodirector: boolean;
  isAdvisor: boolean;
  latestAdvanceId: string | null;
  isLatestAdvancePending: boolean;
  [key: string]: any; // 📌 Permite añadir propiedades dinámicas de otras pestañas en el futuro
}

export interface TabConfiguration {
  tabValue: string;
  columns: Column[];

  // 📐 NUEVO: Cada pestaña procesa y enriquece el contexto con sus propias reglas de negocio
  enrichEvaluationContext: (baseContext: ThesisEvaluationContext) => ThesisEvaluationContext;

  getTableData: (documents: Document[], context: ThesisEvaluationContext) => any[];
  getHeaderButtons: (context: ThesisEvaluationContext) => TableButton[];
  modalConfig: {
    uploadDescription: string;
    uploadedByText: string;
    confirmDescription: string;
    uploadDocumentType: DocumentType;
  };
}
