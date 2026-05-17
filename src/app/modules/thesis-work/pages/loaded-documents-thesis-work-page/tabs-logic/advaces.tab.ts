import { TableButton } from '../../../../../shared/components/table-component/table-component.component';
import { stateList } from '../../../../../core/enums/state.enum';
import { Document, DocumentType } from '../../../../../core/interfaces/Document.interface';
import { TabConfiguration, ThesisEvaluationContext } from './tab-config.interface';

export const AdvancesTabConfig: TabConfiguration = {
  tabValue: 'AVANCES',
  columns: [
    { field: 'name', header: 'Nombre del Avance', type: 'text', width: '35%' },
    { field: 'uploadDate', header: 'Fecha', type: 'text', width: '20%' },
    { field: 'status', header: 'Estado', type: 'state', width: '20%' },
    {
      field: 'acciones', header: 'Acciones', type: 'actions', width: '25%',
      actions: [
        { action: 'download', label: 'Descargar', icon: 'download', variant: 'primary', disabled: false },
        { action: 'evaluate-advance', label: 'Evaluar avance', icon: 'assignment', variant: 'primary', disabled: false }
      ]
    }
  ],

  enrichEvaluationContext: (baseContext: ThesisEvaluationContext): ThesisEvaluationContext => {
    const thesis = baseContext.thesisWork;
    if (!thesis) return baseContext;

    const proposal = thesis.preliminaryDraftData?.proposalData;

    // 🧠 1. Calcular cuántos docentes DEBEN evaluar obligatoriamente
    let requiredEvaluatorsCount = 0;
    if (proposal?.director) requiredEvaluatorsCount++;
    if (proposal?.codirector) requiredEvaluatorsCount++;
    if (proposal?.advisor) requiredEvaluatorsCount++;

    const advances = thesis.advances || [];
    const latestAdvance = advances.length > 0 ? advances[0] : null;

    let isLatestAdvancePending = false;
    if (latestAdvance) {
      const evaluations = thesis.evaluations?.filter((ev: any) => ev.documentId === latestAdvance.id) || [];
      // 🧠 2. Está pendiente si el número de evaluaciones es menor a los requeridos
      isLatestAdvancePending = evaluations.length < requiredEvaluatorsCount;
    }

    // 🔍 NUEVA REGLA: Verificar si ya existe el Formato E (Entrega Final) registrado en el proyecto
    const hasFinalDelivery = thesis.documents?.some(
      (doc: any) => doc.type === DocumentType.FORMATO
    ) ?? false;

    return {
      ...baseContext,
      latestAdvanceId: latestAdvance?.id || null,
      isLatestAdvancePending,
      requiredEvaluatorsCount,
      hasFinalDelivery // <-- Exportamos la bandera al contexto global de la pestaña
    };
  },

  getTableData: (documents: Document[], context: ThesisEvaluationContext) => {
    const activeAdvances = context.thesisWork?.advances || [];
    const requiredCount = context['requiredEvaluatorsCount'] || 1;
    const hasFinalDelivery = context['hasFinalDelivery'] || false; // Evaluamos el estado del proyecto

    return activeAdvances.map((adv: any) => {
      const allowedActions = ['download'];

      const evaluationsForThisAdvance = context.thesisWork?.evaluations?.filter((ev: any) => ev.documentId === adv.id) || [];
      const isFullyEvaluated = evaluationsForThisAdvance.length >= requiredCount;

      let displayStatus = isFullyEvaluated ? stateList.EVALUADO : stateList.EN_REVISION;

      const userFullName = `${context.currentUser?.firstName || ''} ${context.currentUser?.lastName || ''}`.trim();
      const alreadyEvaluated = evaluationsForThisAdvance.some((ev: any) => ev.evaluatorName?.trim() === userFullName);

      const isAssignedEvaluator = context.isDirector || context.isCodirector || context.isAdvisor || context.isAdmin;

      // 🧠 4. Ajuste de seguridad: Se permite evaluar SOLO SI el docente está asignado,
      // no ha evaluado, no han terminado todos, Y ADEMÁS no se ha congelado el flujo por una Entrega Final.
      if (isAssignedEvaluator && !alreadyEvaluated && !isFullyEvaluated && !hasFinalDelivery) {
        allowedActions.push('evaluate-advance');
      }

      return {
        id: adv.id,
        name: adv.title,
        uploadDate: new Date(adv.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' - '),
        status: displayStatus,
        url: adv.documents?.[0]?.url || '',
        allowedActions
      };
    });
  },

  getHeaderButtons: (context: ThesisEvaluationContext) => {
    const buttons: TableButton[] = [];
    const hasFinalDelivery = context['hasFinalDelivery'] || false;

    if (context.isStudent || context.isAdmin) {
      let buttonLabel = 'Cargar nuevo avance';
      let buttonDisabled = context.isLatestAdvancePending;

      // 🧠 5. Control Dinámico del Botón: Prioridad absoluta al estado de Entrega Final
      if (hasFinalDelivery) {
        buttonLabel = 'Entrega final registrada';
        buttonDisabled = true;
      } else if (context.isLatestAdvancePending) {
        buttonLabel = 'Avance en revisión';
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
    uploadDescription: 'Seleccione el archivo PDF del avance de desarrollo',
    uploadedByText: 'Estudiante',
    confirmDescription: '¿Está seguro de cargar este avance? Se notificará al director, codirector y asesor (si aplican).',
    uploadDocumentType: DocumentType.ANEXO
  }
};
