// tabs-logic/final-delivery.tab.ts
import { TableButton } from '../../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../../core/enums/state.enum';
import { Document, DocumentType } from '../../../../../core/interfaces/Document.interface';
import { TabConfiguration, ThesisEvaluationContext } from './tab-config.interface';

export const FinalDeliveryTabConfig: TabConfiguration = {
  tabValue: 'FORMATO_E',
  columns: [
    { field: 'name', header: 'Nombre del Documento', type: 'text', width: '40%' },
    { field: 'uploadDate', header: 'Fecha de Carga', type: 'text', width: '20%' },
    { field: 'status', header: 'Estado', type: 'state', width: '20%' },
    {
      field: 'acciones', header: 'Acciones', type: 'actions', width: '20%',
      actions: [
        { action: 'download', label: 'Descargar', icon: 'download', variant: 'primary', disabled: false }
      ]
    }
  ],

  enrichEvaluationContext: (baseContext: ThesisEvaluationContext): ThesisEvaluationContext => {
    const thesis = baseContext.thesisWork;
    if (!thesis) return baseContext;

    // 🔍 REGLA DE NEGOCIO: Validamos si ya existe el Formato E cargado en los documentos globales
    const hasFinalDelivery = thesis.documents?.some(
      (doc: any) => doc.type === DocumentType.FORMATO && doc.status !== stateList.NO_APROBADO
    ) ?? false;

    return {
      ...baseContext,
      hasFinalDelivery // 🏷️ Exportamos el estado al contexto interno de la pestaña
    };
  },

  getTableData: (documents: Document[], context: ThesisEvaluationContext) => {
    // 🔍 Filtramos los documentos usando estrictamente tu enum de dominio
    const finalDocs = documents.filter(doc => doc.type === DocumentType.FORMATO);

    return finalDocs.map((doc: Document) => {
      const formattedDate = typeof doc.uploadDate === 'string'
        ? doc.uploadDate
        : doc.uploadDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' - ');

      return {
        id: doc.id,
        name: doc.name,
        uploadDate: formattedDate,
        status: doc.status || stateList.EN_REVISION,
        url: doc.url || '',
        allowedActions: ['download']
      };
    });
  },

  getHeaderButtons: (context: ThesisEvaluationContext) => {
    const buttons: TableButton[] = [];
    const hasFinalDelivery = context['hasFinalDelivery'] || false;

    // 🔒 Regla de negocio intacta: Solo Director o Administrador
    if (context.isDirector || context.isAdmin) {
      let buttonLabel = 'Cargar entrega final';
      let buttonDisabled = false;

      // 🛑 Bloqueo Reactivo: Si ya existe una entrega registrada, congelamos el botón
      if (hasFinalDelivery) {
        buttonLabel = 'Entrega final registrada';
        buttonDisabled = true;
      }

      buttons.push({
        label: buttonLabel,
        variant: 'primary',
        disabled: buttonDisabled
      });
    }

    return buttons;
  },

  modalConfig: {
    uploadDescription: 'Seleccione el archivo PDF oficial de la entrega final (Formato E)',
    uploadedByText: 'Director de Trabajo de Grado',
    confirmDescription: '¿Está seguro de registrar este documento como la entrega final? Se actualizará el flujo del proyecto.',
    uploadDocumentType: DocumentType.FORMATO
  }
};
