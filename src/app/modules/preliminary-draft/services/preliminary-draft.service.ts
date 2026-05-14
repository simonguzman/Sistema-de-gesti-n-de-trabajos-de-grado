import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PreliminaryDraft } from '../interfaces/preliminary-draft.interface';
import { delay, map, Observable, of, tap } from 'rxjs';
import { stateList } from '../../../core/enums/state.enum';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { ProposalService } from '../../proposal/services/proposal.service';
import { UserRoleType } from '../../../core/models/user-role';
import { Evaluation } from '../../../core/interfaces/evaluation.interface';
import { Document } from '../../../core/interfaces/Document.interface';
import { User } from '../../users/interfaces/user.interface';
import { Proposal } from '../../proposal/interfaces/proposal.interface';

@Injectable({
  providedIn: 'root'
})
export class PreliminaryDraftService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly proposalService = inject(ProposalService);

  private readonly _draftsList = signal<PreliminaryDraft[]>(this.getStoredDrafts());

  public preliminaryDrafts = computed(() => {
    const currentUser = this.authService.currentUser();
    const allDrafts = this._draftsList();
    if (!currentUser) return [];
    if (this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.COMITE,
      UserRoleType.JEFE_DEP,
      UserRoleType.CONSEJO
    ])) {
      return allDrafts;
    }
    return allDrafts.filter(preliminaryDraft =>
      this.canUserAccessDraft(preliminaryDraft, currentUser.id)
    );
  });

  constructor() {
    effect(() => {
      localStorage.setItem(
        'preliminaryDrafts',
        JSON.stringify(this._draftsList())
      );
    });
  }

  private getStoredDrafts(): PreliminaryDraft[] {
    const stored = localStorage.getItem('preliminaryDrafts');
    return stored ? JSON.parse(stored) : [];
  }

  private updateDraftInList(updatedDraft: PreliminaryDraft) {
    this._draftsList.update(list =>
      list.map(draft =>
        draft.preliminaryDraftId === updatedDraft.preliminaryDraftId
          ? updatedDraft
          : draft
      )
    );
  }

  private canUserAccessDraft(preliminaryDraft: PreliminaryDraft, userId: string): boolean {
    if (!preliminaryDraft.proposalData) return false;
    const proposal = preliminaryDraft.proposalData;

    const isDirector = proposal.director?.id === userId;
    const isCodirector = proposal.codirector?.id === userId;
    const isAdvisor = proposal.advisor?.id === userId;
    const isAuthor = proposal.authors?.some(author =>
      typeof author === 'string' ? author === userId : (author as any)?.id === userId
    ) ?? false;

    // CORRECCIÓN AQUÍ: Verificar en 'evaluators' que es donde se guardan al asignar
    const isAssignedEvaluator = preliminaryDraft.evaluators?.some(
      evaluator => evaluator.id === userId
    ) ?? false;

    // También dejamos el check de evaluaciones por si ya empezó el proceso
    const hasEvaluation = preliminaryDraft.evaluations?.some(
      evaluation => evaluation?.id === userId // O la propiedad que uses para el ID del evaluador en la nota
    ) ?? false;

    return isDirector || isCodirector || isAdvisor || isAuthor || isAssignedEvaluator || hasEvaluation;
  }

  validateReviewersRules(original: Proposal,evaluator1Id: string,evaluator2Id: string): string | null {
    if (evaluator1Id === evaluator2Id) {
      return 'Debe seleccionar dos evaluadores diferentes.';
    }
    if (!original) {
      return 'No se proporcionaron los datos de la propuesta.';
    }
    const forbiddenIds = new Set<string>();
    if (original.director?.id) {
      forbiddenIds.add(original.director.id);
    }
    if (original.codirector?.id) {
      forbiddenIds.add(original.codirector.id);
    }
    if (original.advisor?.id) {
      forbiddenIds.add(original.advisor.id);
    }
    original.authors?.forEach(author => {
      if (typeof author === 'string') {
        forbiddenIds.add(author);
      } else if ((author as any)?.id) {
        forbiddenIds.add((author as any).id);
      }
    });
    if (forbiddenIds.has(evaluator1Id)) {
      return 'El primer docente tiene vínculos con la propuesta.';
    }
    if (forbiddenIds.has(evaluator2Id)) {
      return 'El segundo docente tiene vínculos con la propuesta.';
    }
    return null;
  }

  assignReviewersMock(draftId: string,evaluatorsIds: string[]): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        evaluatorsIds.forEach(id => {
          this.userService.addRoleToUser(id, UserRoleType.EVALUADOR);
        });
        const evaluatorUsers = evaluatorsIds
          .map(id =>
            this.userService.users().find(user => user.id === id)
          )
          .filter((user): user is User => !!user);
        this._draftsList.update(list =>
          list.map(preliminaryDraft =>
            preliminaryDraft.preliminaryDraftId === draftId
              ? {
                  ...preliminaryDraft,
                  evaluators: evaluatorUsers,
                  state: stateList.EN_REVISION
                }
              : preliminaryDraft
          )
        );
      })
    );
  }

  addEvaluationMock(preliminaryDraftId: string, evaluation: Evaluation): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list =>
          list.map(draft => {
            if (draft.preliminaryDraftId !== preliminaryDraftId) return draft;

            const newEvaluations = [evaluation, ...(draft.evaluations || [])];

            return {
              ...draft,
              evaluations: newEvaluations,
              // Enviamos el 'draft' para que la lógica sepa cuál es el último documento
              state: this.calculateDraftState(draft, newEvaluations)
            };
          })
        );
      })
    );
  }

  private calculateDraftState(preliminaryDraft: PreliminaryDraft, evaluations: Evaluation[]): stateList {
    // Al usar [doc, ...currentDocs] en la carga, el índice 0 siempre es el más reciente
    const lastDocumentId = preliminaryDraft.documents[0]?.id;

    if (!lastDocumentId) return stateList.EN_REVISION;

    const currentVersionEvaluations = evaluations.filter(e => e.documentId === lastDocumentId);

    const hasRejection = currentVersionEvaluations.some(
      e => e.veredict === stateList.NO_APROBADO
    );

    if (hasRejection) return stateList.NO_APROBADO;

    // Se mantiene EN_REVISION para permitir la decisión final del Consejo
    return stateList.EN_REVISION;
  }

  private isApprovedEvaluation(evaluation: Evaluation): boolean {
    return [
      stateList.APROBADO,
      stateList.APROBADO_CON_OBSERVACIONES
    ].includes(evaluation.veredict);
  }

  uploadCouncilResolutionMock(id: string, doc: Document, state: stateList, evaluation: any) {
  return this.getDraftByIdMock(id).pipe(
    map(draft => {
      if (draft) {
        draft.documents.push(doc);
        draft.state = state;

        // Guardamos la evaluación para que la independencia sea persistente
        if (!draft.evaluations) draft.evaluations = [];
        draft.evaluations.push(evaluation);

        this.updateDraftInList(draft);
      }
      return draft;
    })
  );
}

  createPreliminaryDraftMock(preliminaryDraft: PreliminaryDraft): Observable<PreliminaryDraft> {
    return of(preliminaryDraft).pipe(
      delay(1000),
      tap(newDraft => {
        const draftToSave: PreliminaryDraft = {
          ...newDraft,
          preliminaryDraftId: crypto.randomUUID(),
          evaluations: newDraft.evaluations || [],
          documents: newDraft.documents || [],
          createdData: new Date(),
          state: newDraft.state || stateList.EN_REVISION
        };

        this._draftsList.update(list => [
          ...list,
          draftToSave
        ]);
      })
    );
  }

  getDraftByIdMock(id: string): Observable<PreliminaryDraft | undefined> {
    return of(
      this._draftsList().find(
        preliminaryDraft => preliminaryDraft.preliminaryDraftId === id
      )
    ).pipe(
      delay(500)
    );
  }

  deleteDraftMock(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        this._draftsList.update(list =>
          list.filter(
            preliminaryDraft =>
              preliminaryDraft.preliminaryDraftId !== id
          )
        );
      })
    );
  }

  updatePreliminaryDraftMock(id: string,updatedData: PreliminaryDraft): Observable<PreliminaryDraft> {
    return of(updatedData).pipe(
      delay(800),
      tap(() => {
        this._draftsList.update(list =>
          list.map(preliminaryDraft =>
            preliminaryDraft.preliminaryDraftId === id ? {
                  ...preliminaryDraft,
                  ...updatedData
                }
              : preliminaryDraft
          )
        );
      })
    );
  }

  uploadDocumentMock(preliminaryDraftId: string, doc: Document): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list =>
          list.map(draft => {
            if (draft.preliminaryDraftId !== preliminaryDraftId) return draft;

            const currentDocs = draft.documents || [];
            return {
              ...draft,
              documents: [doc, ...currentDocs],
              // REINICIO DE ESTADO: Cualquier nuevo documento cargado reinicia el ciclo a "En revisión"
              state: stateList.EN_REVISION
            };
          })
        );
      })
    );
  }

  public calculateDocumentStatus(docId: string, evaluations: Evaluation[], totalEvaluators: number): stateList {
    const documentEvaluations = evaluations?.filter(e => e.documentId === docId) || [];

    // 1. Si no hay evaluaciones aún, está en revisión
    if (documentEvaluations.length === 0) return stateList.EN_REVISION;

    // 2. Si hay AL MENOS un veredicto "NO_APROBADO", el documento completo se marca así
    if (documentEvaluations.some(e => e.veredict === stateList.NO_APROBADO)) {
      return stateList.NO_APROBADO;
    }

    // 3. Si ya evaluaron todos los jurados asignados y nadie rechazó, está APROBADO
    // (Esto es lo que hará que en tu captura se vea verde)
    if (totalEvaluators > 0 && documentEvaluations.length >= totalEvaluators) {
      return stateList.APROBADO;
    }

    // 4. Si faltan evaluadores por calificar, sigue en revisión
    return stateList.EN_REVISION;
  }
}
