import { TableButton } from '../../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../../core/enums/state.enum';
import { Document, DocumentType } from '../../../../../core/interfaces/Document.interface';
import { TabConfiguration, ThesisEvaluationContext } from './tab-config.interface';

export const SustentationTabConfig: TabConfiguration = {
  tabValue: 'SUSTENTACION',
  columns: [
    { field: 'name', header: 'Detalle', type: 'text', width: '40%' },
    { field: 'date', header: 'Fecha Programada', type: 'text', width: '20%' },
    { field: 'status', header: 'Estado', type: 'state', width: '20%' },
    {
      field: 'acciones', header: 'Acciones', type: 'actions', width: '20%',
      actions: [
        { action: 'view_details', label: 'Ver Detalles', variant: 'primary', disabled: false }
      ]
    }
  ],

  enrichEvaluationContext: (baseContext: ThesisEvaluationContext): ThesisEvaluationContext => {
    const thesis = baseContext.thesisWork;
    if (!thesis) return baseContext;

    // 🔍 1. ¿Hay un Paz y Salvo APROBADO?
    const hasApprovedPazYSalvo = thesis.documents?.some(
      (doc: any) => doc.type === DocumentType['PAZ Y SALVO'] && doc.status === stateList.APROBADO
    ) ?? false;

    // 🔍 2. ¿Ya se registró la sustentación?
    const hasSustentationRegistered = !!thesis.sustentation;

    // 🔍 3. ¿Ya fue evaluada la sustentación?
    // Ahora lo verificamos analizando si el arreglo de veredictos tiene elementos
    const isSustentationEvaluated = (thesis.sustentation?.verdicts?.length ?? 0) > 0;

    return {
      ...baseContext,
      hasApprovedPazYSalvo,
      hasSustentationRegistered,
      isSustentationEvaluated
    };
  },

  getTableData: (documents: Document[], context: ThesisEvaluationContext) => {
    const thesis = context.thesisWork;

    // Si no hay sustentación registrada, la tabla se muestra vacía
    if (!thesis || !thesis.sustentation) return [];

    // Formateamos la fecha correctamente accediendo a 'sustentationDate'
    const dateRaw = thesis.sustentation.sustentationDate;
    const dateStr = dateRaw
      ? new Date(dateRaw).toLocaleDateString('es-ES')
      : 'Fecha pendiente';

    // Como SustentationRegistry no tiene un campo 'status', lo derivamos:
    // Si ya tiene veredictos lo marcamos como Aprobado/No Aprobado (aquí asumo APROBADO para el UI),
    // si no, está "En Revisión" (o "Programado").
    const isEvaluated = (thesis.sustentation.verdicts?.length ?? 0) > 0;
    const currentStatus = isEvaluated ? stateList.APROBADO : stateList.EN_REVISION;

    return [{
      id: thesis.thesisWorkId,
      name: 'Programación oficial de Sustentación',
      date: dateStr,
      status: currentStatus,
      allowedActions: ['view_details']
    }];
  },

  getHeaderButtons: (context: ThesisEvaluationContext) => {
    const buttons: TableButton[] = [];
    const { isConsejo, hasApprovedPazYSalvo, hasSustentationRegistered, isSustentationEvaluated } = context as any;

    // 🛑 REGLA ESTRICTA: El botón SÓLO existe para el Consejo de Facultad
    if (isConsejo) {
      let buttonLabel = 'Registrar Sustentación';
      let buttonDisabled = false;

      if (!hasApprovedPazYSalvo) {
        buttonLabel = 'Requiere Paz y Salvo Aprobado';
        buttonDisabled = true;
      } else if (hasSustentationRegistered && !isSustentationEvaluated) {
        buttonLabel = 'Sustentación Programada';
        buttonDisabled = true;
      } else if (isSustentationEvaluated) {
        buttonLabel = 'Sustentación Evaluada';
        buttonDisabled = true;
      }

      buttons.push({
        action: 'register_sustentation', // 🚀 NUEVO: Acción para que el contenedor escuche el evento y navegue a la vista de formulario
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
    uploadDocumentType: 'Sustentacion' as any
  }
};
