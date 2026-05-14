import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { delay, map, Observable, of, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { ProposalService } from '../../proposal/services/proposal.service';

import { stateList } from '../../../core/enums/state.enum';
import { Evaluation } from '../../../core/interfaces/evaluation.interface';
import { Document } from '../../../core/interfaces/Document.interface';
import { UserRoleType } from '../../../core/models/user-role';

import { User } from '../../users/interfaces/user.interface';
import { Proposal } from '../../proposal/interfaces/proposal.interface';

import { PreliminaryDraft } from '../interfaces/preliminary-draft.interface';
@Injectable({
  providedIn: 'root'
})
export class PreliminaryDraftService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly proposalService = inject(ProposalService);

  private readonly _preliminaryDraftsList = signal<PreliminaryDraft[]>(this.getStoredPreliminaryDrafts());

  public preliminaryDrafts = computed(() => {
    const currentUser = this.authService.currentUser();
    const allPreliminaryDrafts = this._preliminaryDraftsList();
    if (!currentUser) return [];
    if (this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.COMITE,
      UserRoleType.JEFE_DEP,
      UserRoleType.CONSEJO
    ])) {
      return allPreliminaryDrafts;
    }
    return allPreliminaryDrafts.filter(preliminaryDraft =>
      this.canUserAccessPreliminaryDraft(preliminaryDraft, currentUser.id)
    );
  });

  constructor() {
    effect(() => {
      localStorage.setItem(
        'preliminaryDrafts',
        JSON.stringify(this._preliminaryDraftsList())
      );
    });
  }

  private getStoredPreliminaryDrafts(): PreliminaryDraft[] {
    const stored = localStorage.getItem('preliminaryDrafts');
    return stored ? JSON.parse(stored) : [];
  }

  private updatePreliminaryDraftInList(updatedPreliminaryDraft: PreliminaryDraft) {
    this._preliminaryDraftsList.update(list =>
      list.map(preliminaryDraft =>
        preliminaryDraft.preliminaryDraftId === updatedPreliminaryDraft.preliminaryDraftId
          ? updatedPreliminaryDraft
          : preliminaryDraft
      )
    );
  }

  private canUserAccessPreliminaryDraft(preliminaryDraft: PreliminaryDraft, userId: string): boolean {
    if (!preliminaryDraft.proposalData) return false;
    const proposal = preliminaryDraft.proposalData;
    const isDirector = proposal.director?.id === userId;
    const isCodirector = proposal.codirector?.id === userId;
    const isAdvisor = proposal.advisor?.id === userId;
    const isAuthor = proposal.authors?.some(author =>
      typeof author === 'string' ? author === userId : (author as any)?.id === userId
    ) ?? false;
    const isAssignedEvaluator = preliminaryDraft.evaluators?.some(
      evaluator => evaluator.id === userId
    ) ?? false;

    const hasEvaluation = preliminaryDraft.evaluations?.some(
      evaluation => evaluation?.id === userId
    ) ?? false;
    return isDirector || isCodirector || isAdvisor || isAuthor || isAssignedEvaluator || hasEvaluation;
  }

  validateReviewersRules(originalProposal: Proposal,evaluator1Id: string,evaluator2Id: string): string | null {
    if (evaluator1Id === evaluator2Id) {
      return 'Debe seleccionar dos evaluadores diferentes.';
    }
    if (!originalProposal) {
      return 'No se proporcionaron los datos de la propuesta.';
    }
    const forbiddenIds = new Set<string>();
    if (originalProposal.director?.id) {
      forbiddenIds.add(originalProposal.director.id);
    }
    if (originalProposal.codirector?.id) {
      forbiddenIds.add(originalProposal.codirector.id);
    }
    if (originalProposal.advisor?.id) {
      forbiddenIds.add(originalProposal.advisor.id);
    }
    originalProposal.authors?.forEach(author => {
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

  assignReviewersMock(preliminaryDraftId: string,evaluatorsIds: string[]): Observable<void> {
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
        this._preliminaryDraftsList.update(list =>
          list.map(preliminaryDraft =>
            preliminaryDraft.preliminaryDraftId === preliminaryDraftId
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
        this._preliminaryDraftsList.update(list =>
          list.map(preliminaryDraft => {
            if (preliminaryDraft.preliminaryDraftId !== preliminaryDraftId) return preliminaryDraft;
            const newEvaluations = [evaluation, ...(preliminaryDraft.evaluations || [])];
            return {
              ...preliminaryDraft,
              evaluations: newEvaluations,
              state: this.calculatePreliminaryDraftState(preliminaryDraft, newEvaluations)
            };
          })
        );
      })
    );
  }

  private calculatePreliminaryDraftState(preliminaryDraft: PreliminaryDraft, evaluations: Evaluation[]): stateList {
    const lastDocumentId = preliminaryDraft.documents[0]?.id;
    if (!lastDocumentId) return stateList.EN_REVISION;
    const currentVersionEvaluations = evaluations.filter(evaluation => evaluation.documentId === lastDocumentId);
    const hasRejection = currentVersionEvaluations.some(
      evaluation => evaluation.veredict === stateList.NO_APROBADO
    );
    if (hasRejection) return stateList.NO_APROBADO;
    return stateList.EN_REVISION;
  }

  private isApprovedEvaluation(evaluation: Evaluation): boolean {
    return [
      stateList.APROBADO,
      stateList.APROBADO_CON_OBSERVACIONES
    ].includes(evaluation.veredict);
  }

  uploadCouncilResolutionMock(id: string, document: Document, state: stateList, evaluation: Evaluation) {
  return this.getPreliminaryDraftByIdMock(id).pipe(
    map(preliminaryDraft => {
      if (preliminaryDraft) {
        preliminaryDraft.documents.push(document);
        preliminaryDraft.state = state;
        if (!preliminaryDraft.evaluations) preliminaryDraft.evaluations = [];
        preliminaryDraft.evaluations.push(evaluation);
        this.updatePreliminaryDraftInList(preliminaryDraft);
      }
      return preliminaryDraft;
    })
  );
}

  createPreliminaryDraftMock(preliminaryDraft: PreliminaryDraft): Observable<PreliminaryDraft> {
    return of(preliminaryDraft).pipe(
      delay(1000),
      tap(newPreliminaryDraft => {
        const preliminaryDraftToSave: PreliminaryDraft = {
          ...newPreliminaryDraft,
          preliminaryDraftId: crypto.randomUUID(),
          evaluations: newPreliminaryDraft.evaluations || [],
          documents: newPreliminaryDraft.documents || [],
          createdData: new Date(),
          state: newPreliminaryDraft.state || stateList.EN_REVISION
        };
        this._preliminaryDraftsList.update(list => [
          ...list,
          preliminaryDraftToSave
        ]);
      })
    );
  }

  getPreliminaryDraftByIdMock(id: string): Observable<PreliminaryDraft | undefined> {
    return of(
      this._preliminaryDraftsList().find(
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
        this._preliminaryDraftsList.update(list =>
          list.filter(
            preliminaryDraft =>
              preliminaryDraft.preliminaryDraftId !== id
          )
        );
      })
    );
  }

  updatePreliminaryDraftMock(id: string, updatedData: PreliminaryDraft): Observable<PreliminaryDraft> {
    return of(updatedData).pipe(
      delay(800),
      tap(() => {
        this._preliminaryDraftsList.update(list =>
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

  uploadDocumentMock(preliminaryDraftId: string, document: Document): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._preliminaryDraftsList.update(list =>
          list.map(preliminaryDraft => {
            if (preliminaryDraft.preliminaryDraftId !== preliminaryDraftId) return preliminaryDraft;
            const currentDocuments = preliminaryDraft.documents || [];
            return {
              ...preliminaryDraft,
              documents: [document, ...currentDocuments],
              state: stateList.EN_REVISION
            };
          })
        );
      })
    );
  }

  public calculateDocumentStatus(documentId: string, evaluations: Evaluation[], totalEvaluators: number): stateList {
    const documentEvaluations = evaluations?.filter(evaluation => evaluation.documentId === documentId) || [];
    if (documentEvaluations.length === 0) return stateList.EN_REVISION;
    if (documentEvaluations.some(evaluation => evaluation.veredict === stateList.NO_APROBADO)) {
      return stateList.NO_APROBADO;
    }
    if (totalEvaluators > 0 && documentEvaluations.length >= totalEvaluators) {
      return stateList.APROBADO;
    }
    return stateList.EN_REVISION;
  }
}
