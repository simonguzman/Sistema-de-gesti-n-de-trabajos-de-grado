import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { delay, Observable, of, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { PreliminaryDraftService } from '../../preliminary-draft/services/preliminary-draft.service';

import { stateList } from '../../../core/enums/state.enum';
import { Document } from '../../../core/interfaces/Document.interface';
import { Evaluation } from '../../../core/interfaces/evaluation.interface';
import { UserRoleType } from '../../../core/models/user-role';

import { ThesisWork, SustentationRegistry } from '../interfaces/thesis-work.interface';

@Injectable({
  providedIn: 'root'
})
export class ThesisWorkService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly preliminaryDraftService = inject(PreliminaryDraftService);

  // Signal principal
  private readonly _thesisWorksList = signal<ThesisWork[]>(this.initializeThesisWorks());

  // Computed para filtrar según el rol del usuario logueado
  public thesisWorks = computed(() => {
    const currentUser = this.authService.currentUser();
    const allWorks = this._thesisWorksList();
    if (!currentUser) return [];

    // Roles administrativos ven todo el universo de trabajos de grado
    if (this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.DECANATURA,
      UserRoleType.CONSEJO
    ])) {
      return allWorks;
    }

    // Filtrar por involucrados en el proyecto
    return allWorks.filter(work => this.canUserAccessThesisWork(work, currentUser.id));
  });

  constructor() {
    // Persistencia mockeada en LocalStorage
    effect(() => {
      localStorage.setItem('thesisWorks', JSON.stringify(this._thesisWorksList()));
    });
  }

  /**
   * Inicializa la lista. Si no hay datos, mapea los Anteproyectos Aprobados
   * al nuevo formato plano y limpio de la interfaz ThesisWork.
   */
  private initializeThesisWorks(): ThesisWork[] {
    const stored = localStorage.getItem('thesisWorks');
    if (stored) return JSON.parse(stored);

    const approvedDrafts = this.preliminaryDraftService.preliminaryDrafts()
      .filter(draft => draft.state === stateList.APROBADO);

    return approvedDrafts.map(draft => ({
      thesisWorkId: crypto.randomUUID(),
      preliminaryDraftId: draft.preliminaryDraftId!,
      preliminaryDraftData: draft,
      documents: [],          // Inicialización centralizada de archivos
      evaluations: [],        // Inicialización centralizada de conceptos/evaluaciones
      specialRequests: [],
      state: stateList.EN_DESARROLLO,
      createdDate: new Date()
    }));
  }

  /**
   * Reglas de negocio y permisos de acceso para usuarios no administrativos
   */
  private canUserAccessThesisWork(work: ThesisWork, userId: string): boolean {
    const proposal = work.preliminaryDraftData.proposalData;

    const isDirector = proposal.director?.id === userId;
    const isCodirector = proposal.codirector?.id === userId;
    const isAdvisor = proposal.advisor?.id === userId;
    const isAuthor = proposal.authors?.some(author =>
      typeof author === 'string' ? author === userId : (author as any)?.id === userId
    ) ?? false;

    // REFACTORED: Ahora buscamos los jurados en la estructura operativa de sustentación
    const isJuror = work.sustentation?.assignedJurors?.some(juror => juror.id === userId) ?? false;

    return isDirector || isCodirector || isAdvisor || isAuthor || isJuror;
  }

  // ==========================================
  // METODOS MOCK OPERATIVOS (Simulando HTTP)
  // ==========================================

  getThesisWorkByIdMock(id: string): Observable<ThesisWork | undefined> {
    return of(this._thesisWorksList().find(w => w.thesisWorkId === id)).pipe(delay(500));
  }

  /**
   * REFACTORED: Método único para la carga de cualquier archivo del flujo.
   * El componente simplemente debe instanciar el Document con el 'type' adecuado
   * (ej: 'Avance', 'Formato_E', 'Formato_F', etc.)
   */
  uploadDocumentMock(thesisWorkId: string, document: Document): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;

          // Regla de negocio ágil: Si cargan el Formato E (Entrega final), mutamos el estado a EN_REVISION
          const nextState = document.type === 'Formato' ? stateList.EN_REVISION : work.state;

          return {
            ...work,
            documents: [document, ...work.documents],
            state: nextState
          };
        }));
      })
    );
  }

  /**
   * REFACTORED: Agrega cualquier evaluación de forma centralizada.
   * Maneja tanto revisiones parciales de avances como dictámenes de formatos administrativos.
   */
  addEvaluationMock(thesisWorkId: string, evaluation: Evaluation): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;
          return { ...work, evaluations: [evaluation, ...work.evaluations] };
        }));
      })
    );
  }

  /**
   * NEW METHOD: Permite coordinar, agendar jurados y recolectar veredictos
   * para el proceso activo de sustentación (Consejo de Facultad / Jurados).
   */
  saveSustentationRegistryMock(thesisWorkId: string, sustentationData: SustentationRegistry): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;
          return {
            ...work,
            sustentation: sustentationData
          };
        }));
      })
    );
  }
}
