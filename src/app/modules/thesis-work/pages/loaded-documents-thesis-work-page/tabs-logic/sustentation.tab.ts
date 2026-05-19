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
        { action: 'view_sustentation_details', label: 'Ver Detalles', variant: 'primary', disabled: false },
        { action: 'evaluate_sustentation', label: 'Evaluar Sustentación', icon: 'gavel', variant: 'primary', disabled: false }
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

    // 🔍 2. ¿Ya se registró la programación de la sustentación?
    const hasSustentationRegistered = !!thesis.sustentation;

    // 🔍 3. Validar si el usuario actual es un jurado asignado
    const isJuror = thesis.sustentation?.assignedJurors?.some(
      (juror: any) => juror.id === baseContext.currentUser?.id
    ) ?? false;

    // 🔍 4. ¿La sustentación ya cuenta con alguna evaluación registrada?
    const isSustentationEvaluated = (thesis.sustentation?.verdicts?.length ?? 0) > 0;

    return {
      ...baseContext,
      hasApprovedPazYSalvo,
      hasSustentationRegistered,
      isSustentationEvaluated,
      isJuror
    };
  },

  getTableData: (documents: Document[], context: ThesisEvaluationContext) => {
    const thesis = context.thesisWork;
    if (!thesis.sustentation) return [];

    const dateRaw = thesis.sustentation.sustentationDate;
    const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString('es-ES') : 'Fecha pendiente';

    const verdictsList = thesis.sustentation.verdicts || [];
    const isSustentationEvaluated = verdictsList.length > 0;

    // Obtenemos el último estado registrado en la sustentación
    const currentStatus = isSustentationEvaluated ? verdictsList[verdictsList.length - 1].veredict : stateList.EN_REVISION;

    const allowedActions = ['view_sustentation_details'];
    const isJuror = context['isJuror'] ?? false;

    // El botón de evaluar SOLO aparece si es Jurado/Admin Y NADIE ha evaluado todavía.
    if ((isJuror || context.isAdmin) && !isSustentationEvaluated) {
      allowedActions.push('evaluate_sustentation');
    }

    return [{
      id: thesis.thesisWorkId,
      name: 'Programación oficial de Sustentación',
      date: dateStr,
      status: currentStatus,
      allowedActions
    }];
  },

  getHeaderButtons: (context: ThesisEvaluationContext) => {
    const buttons: TableButton[] = [];
    const { isConsejo, hasApprovedPazYSalvo, hasSustentationRegistered, isSustentationEvaluated, thesisWork } = context as any;

    if (isConsejo) {
      let buttonLabel = 'Registrar Sustentación';
      let buttonDisabled = false;

      // 🧠 Extraemos el último veredicto para evaluar la nueva regla de negocio
      const verdictsList = thesisWork?.sustentation?.verdicts || [];
      const lastVerdict = verdictsList.length > 0 ? verdictsList[verdictsList.length - 1].veredict : null;

      if (!hasApprovedPazYSalvo) {
        buttonLabel = 'Requiere Paz y Salvo Aprobado';
        buttonDisabled = true;
      } else if (!hasSustentationRegistered) {
        // Escenario 1: No hay ninguna sustentación registrada
        buttonLabel = 'Registrar Sustentación';
        buttonDisabled = false;
      } else {
        // Ya existe un registro de sustentación, revisamos su estado final
        if (lastVerdict === stateList.APLAZADO) {
          // Escenario 2: REGLA DE NEGOCIO - Fue aplazada, se vuelve a habilitar
          buttonLabel = 'Reprogramar Sustentación';
          buttonDisabled = false;
        } else if (isSustentationEvaluated) {
          // Escenario 3: Evaluada con éxito/fracaso definitivo
          buttonLabel = 'Sustentación Evaluada';
          buttonDisabled = true;
        } else {
          // Escenario 4: Está programada pero esperando el dictamen del jurado
          buttonLabel = 'Sustentación Programada';
          buttonDisabled = true;
        }
      }

      buttons.push({
        action: 'register_sustentation',
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
