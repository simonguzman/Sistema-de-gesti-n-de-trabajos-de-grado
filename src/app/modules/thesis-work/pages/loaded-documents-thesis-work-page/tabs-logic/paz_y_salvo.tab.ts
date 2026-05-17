import { TableButton } from '../../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../../core/enums/state.enum';
import { Document, DocumentType } from '../../../../../core/interfaces/Document.interface';
import { TabConfiguration, ThesisEvaluationContext } from './tab-config.interface';

export const PazYSalvoTabConfig: TabConfiguration = {
  tabValue: 'PAZ_Y_SALVO',
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

    // 🔍 1. ¿Hay una Entrega Final ACTIVA? (Usa el tipo de la Entrega Final)
    const hasActiveFinalDelivery = thesis.documents?.some(
      (doc: any) => doc.type === DocumentType['FORMATO E'] && doc.status !== stateList.NO_APROBADO
    ) ?? false;

    // 🔍 2. ¿Ya se registró un Paz y Salvo (aprobado)?
    // 🛑 CORREGIDO: Debe buscar por el tipo de documento de Paz y Salvo, no el de la entrega final
    const hasApprovedPazYSalvo = thesis.documents?.some(
      (doc: any) => doc.type === DocumentType['PAZ Y SALVO'] && doc.status === stateList.APROBADO // 👈 Usa tu enum correspondiente (ej. PAZ_Y_SALVO o FORMATO_F)
    ) ?? false;

    return {
      ...baseContext,
      hasActiveFinalDelivery,
      hasApprovedPazYSalvo
    };
  },

  getTableData: (documents: Document[], context: ThesisEvaluationContext) => {
    // 🛑 CORREGIDO: Filtramos únicamente por los documentos de tipo Paz y Salvo.
    // Al hacer esto, si no se ha registrado ninguno, la tabla aparecerá completamente vacía.
    const pySDocs = documents.filter(doc => doc.type === DocumentType['PAZ Y SALVO']); // 👈 Cambiado aquí

    return pySDocs.map((doc: Document) => {
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

    if (context.isDecanatura || context.isAdmin) {
      const { hasActiveFinalDelivery, hasApprovedPazYSalvo } = context as any;

      let buttonLabel = 'Registrar Paz y Salvo';
      let buttonDisabled = false;

      if (hasApprovedPazYSalvo) {
        buttonLabel = 'Paz y Salvo Registrado';
        buttonDisabled = true;
      } else if (!hasActiveFinalDelivery) {
        buttonLabel = 'Requiere Entrega Final';
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
    uploadDescription: '',
    uploadedByText: '',
    confirmDescription: '',
    uploadDocumentType: DocumentType['PAZ Y SALVO'] // 👈 Asegúrate de actualizarlo aquí también si se llega a usar
  }
};
