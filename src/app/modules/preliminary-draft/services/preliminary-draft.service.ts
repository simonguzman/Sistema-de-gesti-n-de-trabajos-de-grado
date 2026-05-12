import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PreliminaryDraft } from '../interfaces/preliminary-draft.interface';
import { delay, Observable, of, tap } from 'rxjs';
import { stateList } from '../../../core/enums/state.enum';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { ProposalService } from '../../proposal/services/proposal.service';
import { UserRoleType } from '../../../core/models/user-role';
import { Evaluation } from '../../../core/interfaces/evaluation.interface';
import { Document } from '../../../core/interfaces/Document.inteface';
import { User } from '../../users/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class PreliminaryDraftService {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private proposalService = inject(ProposalService);

  private _draftsList = signal<PreliminaryDraft[]>(this.getStoredDrafts());

  /**
   * Lista filtrada por permisos (Signals)
   */
  public preliminaryDrafts = computed(() => {
    const currentUser = this.authService.currentUser();
    const allDrafts = this._draftsList();

    if (!currentUser) return [];

    // Admins y Jefes ven todo el universo de anteproyectos
    if (this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.COMITE,
      UserRoleType.JEFE_DEP
    ])) {
      return allDrafts;
    }

    return allDrafts.filter(draft => {
      if (!draft.proposalData) return false;

      // Director
      const isDirector = draft.proposalData.director?.id === currentUser.id;

      // Autores: Manejo seguro del tipo (string vs objeto)
      const isAuthor = draft.proposalData.authors?.some(auth => {
        if (!auth) return false;
        // Si es un string, comparamos directo. Si es objeto, usamos .id
        return typeof auth === 'string' ? auth === currentUser.id : (auth as any).id === currentUser.id;
      }) ?? false;

      // Revisores: Manejo seguro
      const isReviewer = draft.reviewers?.some(rev => rev && rev.id === currentUser.id) ?? false;

      return isDirector || isAuthor || isReviewer;
    });
  });

  constructor() {
    effect(() => {
      localStorage.setItem('preliminaryDrafts', JSON.stringify(this._draftsList()));
    });
  }

  private getStoredDrafts(): PreliminaryDraft[] {
    const stored = localStorage.getItem('preliminaryDrafts');
    return stored ? JSON.parse(stored) : [];
  }

  // =======================================================================
  // REGLAS DE NEGOCIO (CORREGIDAS)
  // =======================================================================

  /**
   * REGLA: Los evaluadores no pueden ser parte de la propuesta original.
   */
  validateReviewersRules(proposalId: string, rev1Id: string, rev2Id: string): string | null {
    if (rev1Id === rev2Id) return 'Debe seleccionar dos evaluadores diferentes.';

    const original = this.proposalService.proposals().find(p => p.id === proposalId);
    if (!original) return 'No se encontró la propuesta base.';

    // Extraemos los IDs prohibidos considerando que ahora son Objetos User
    const forbiddenIds = new Set([
      original.director.id,
      original.codirector?.id,
      original.advisor?.id,
      ...(original.authors || [])
    ].filter(id => !!id));

    if (forbiddenIds.has(rev1Id)) return 'El primer docente tiene vínculos con la propuesta.';
    if (forbiddenIds.has(rev2Id)) return 'El segundo docente tiene vínculos con la propuesta.';

    return null;
  }

  /**
   * Asignación de evaluadores (Mock)
   */
  assignReviewersMock(draftId: string, reviewersIds: string[]): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        // Buscamos los objetos User reales para guardarlos en el anteproyecto
        const reviewerUsers = reviewersIds
          .map(id => this.userService.users().find(u => u.id === id))
          .filter((u): u is User => !!u);

        this._draftsList.update(list => list.map(draft => {
          if (draft.preliminaryDraftId === draftId) {
            return {
              ...draft,
              reviewers: reviewerUsers,
              state: stateList.EN_REVISION // Cambia estado al ser asignado
            };
          }
          return draft;
        }));
      })
    );
  }

  /**
   * Registro de evaluación y cálculo de estado automático
   */
  addEvaluationMock(draftId: string, evaluation: Evaluation): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list => list.map(draft => {
          if (draft.preliminaryDraftId !== draftId) return draft;

          const newEvaluations = [
            { ...evaluation, id: crypto.randomUUID() },
            ...(draft.evaluations || [])
          ];

          let newState = draft.state;

          // Si ya tenemos las 2 evaluaciones de los jurados
          if (newEvaluations.length >= 2) {
            const allPassed = newEvaluations.every(e =>
              e.veredict === stateList.APROBADO ||
              e.veredict === stateList.APROBADO_CON_OBSERVACIONES
            );

            // Si ambos aprueban, queda listo para la resolución del consejo
            newState = allPassed ? stateList.APROBADO : stateList.NO_APROBADO;
          }

          return { ...draft, evaluations: newEvaluations, state: newState };
        }));
      })
    );
  }

  /**
   * Resolución Final del Consejo
   */
  uploadCouncilResolutionMock(draftId: string, doc: Document, finalState: stateList): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._draftsList.update(list => list.map(draft =>
          draft.preliminaryDraftId === draftId
            ? { ...draft, councilResolution: doc, state: finalState }
            : draft
        ));
      })
    );
  }
  createPreliminaryDraftMock(draft: PreliminaryDraft): Observable<PreliminaryDraft> {
    return of(draft).pipe(
      delay(1000),
      tap(newDraft => {
        // Generamos el ID si no existe
        const draftToSave: PreliminaryDraft = {
          ...newDraft,
          preliminaryDraftId: crypto.randomUUID()
        };

        // Actualizamos la señal (esto disparará el effect del localStorage)
        this._draftsList.update(list => [...list, draftToSave]);
      })
    );
  }
  /**
   * Obtiene un anteproyecto por su ID
   */
  getDraftByIdMock(id: string): Observable<PreliminaryDraft | undefined> {
    return of(this._draftsList().find(d => d.preliminaryDraftId === id)).pipe(
      delay(500)
    );
  }

  /**
   * Elimina un anteproyecto de la lista
   */
  deleteDraftMock(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        this._draftsList.update(list =>
          list.filter(draft => draft.preliminaryDraftId !== id)
        );
      })
    );
  }

  updatePreliminaryDraftMock(id: string, updatedData: PreliminaryDraft): Observable<PreliminaryDraft>{
    return of(updatedData).pipe(
      delay(800),
      tap(() => {
        this._draftsList.update(list => list.map(draft =>
          draft.preliminaryDraftId === id
            ? {...draft, ...updatedData}
            : draft
        ));
      })
    );
  }

}
