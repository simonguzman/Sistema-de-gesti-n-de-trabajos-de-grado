import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PreliminaryDraft } from '../interfaces/preliminary-draft.interface';
import { delay, Observable, of, tap } from 'rxjs';
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
      UserRoleType.JEFE_DEP
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

  private canUserAccessDraft(preliminaryDraft: PreliminaryDraft,userId: string): boolean {
    if (!preliminaryDraft.proposalData) return false;
    const proposal = preliminaryDraft.proposalData;
    const isDirector = proposal.director?.id === userId;
    const isCodirector = proposal.codirector?.id === userId;
    const isAdvisor = proposal.advisor?.id === userId;
    const isAuthor = proposal.authors?.some(author =>
      typeof author === 'string'
        ? author === userId
        : (author as any)?.id === userId
    ) ?? false;
    const isEvaluator = preliminaryDraft.evaluations?.some(
      evaluation => evaluation?.id === userId
    ) ?? false;
    return (
      isDirector ||
      isCodirector ||
      isAdvisor ||
      isAuthor ||
      isEvaluator
    );
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

  addEvaluationMock(preliminaryDraftId: string,evaluation: Evaluation): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list =>
          list.map(preliminaryDraft => {
            if (
              preliminaryDraft.preliminaryDraftId !== preliminaryDraftId
            ) {
              return preliminaryDraft;
            }
            const newEvaluations = [
              {
                ...evaluation,
                id: crypto.randomUUID()
              },
              ...(preliminaryDraft.evaluations || [])
            ];
            return {
              ...preliminaryDraft,
              evaluations: newEvaluations,
              state: this.calculateDraftState(
                preliminaryDraft.state,
                newEvaluations
              )
            };
          })
        );
      })
    );
  }

  private calculateDraftState(currentState: stateList,evaluations: Evaluation[]): stateList {
    if (evaluations.length < 2) {
      return currentState;
    }
    const allPassed = evaluations.every(
      evaluation => this.isApprovedEvaluation(evaluation)
    );
    return allPassed
      ? stateList.APROBADO
      : stateList.NO_APROBADO;
  }

  private isApprovedEvaluation(evaluation: Evaluation): boolean {
    return [
      stateList.APROBADO,
      stateList.APROBADO_CON_OBSERVACIONES
    ].includes(evaluation.veredict);
  }

  uploadCouncilResolutionMock(preliminaryDraftId: string,doc: Document,finalState: stateList): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list =>
          list.map(draft =>
            draft.preliminaryDraftId === preliminaryDraftId ? {
                  ...draft,
                  councilResolution: doc,
                  state: finalState
                }
              : draft
          )
        );
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

  uploadDocumentMock(preliminaryDraftId: string,doc: Document): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list =>
          list.map(preliminaryDraft => {
            if (preliminaryDraft.preliminaryDraftId !== preliminaryDraftId) {
              return preliminaryDraft;
            }
            const currentDocs =preliminaryDraft.documents || [];
            return {
              ...preliminaryDraft,
              documents: [...currentDocs, doc],
              state:
                doc.type === 'Correccion'
                  ? stateList.EN_REVISION
                  : preliminaryDraft.state
            };
          })
        );
      })
    );
  }
}
