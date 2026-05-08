import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Modality, Proposal } from '../interfaces/proposal.interface';
import { delay, map, Observable, of, tap } from 'rxjs';
import { stateList } from '../../../shared/components/state/state.component';
import { Evaluation } from '../interfaces/evaluation.interface';
import { ProposalDocument } from '../interfaces/proposalDocument.inteface';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserRoleType } from '../../../core/models/user-role';
import { UserService } from '../../users/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private apiUrl = 'https://api-sgtg-placeholder.com/api/proposals';

  private initialData: Proposal[] = [
    {
      id: 'prop-001',
      title: 'Frontend de las funcionalidades asociadas a la aplicación web para la Facultad de Ingeniería Electrónica...',
      modality: Modality.PP,
      description: 'Desarrollar un prototipo del FrontEnd...',
      state: stateList.APROBADO,
      authors: ['user-001'], // Simón Guzmán
      directorId: 'doc-005', // Hugo Armando Ordoñez
      codirector: 'doc-001', // Pablo Mage
      advisor: 'doc-002',    // Alejandro Toledo
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id: 'prop-002',
      title: 'Análisis de vulnerabilidades en redes IoT...',
      modality: Modality.TI,
      description: 'Investigación sobre seguridad en protocolos Zigbee...',
      state: stateList.APROBADO_CON_OBSERVACIONES,
      authors: ['user-001'], // Simón Guzmán (Tiene 2 propuestas)
      directorId: 'doc-005', // Hugo Armando Ordoñez
      codirector: undefined,
      advisor: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id: 'prop-003',
      title: 'Implementación de microservicios para gestión académica...',
      modality: Modality.PP,
      description: 'Migración de monolito a microservicios...',
      state: stateList.NO_APROBADO,
      authors: ['user-456'], // Juan Pérez
      directorId: 'doc-005', // Hugo Armando Ordoñez
      codirector: undefined,
      advisor: 'doc-002',    // Alejandro Toledo (Como asesor)
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id: 'prop-004',
      title: 'Estudio de algoritmos de optimización para transporte...',
      modality: Modality.TI,
      description: 'Optimización de rutas de buses...',
      state: stateList.APROBADO_CON_OBSERVACIONES,
      authors: ['user-003'], // María Fernanda Rojas
      directorId: 'doc-001', // Pablo Mage (Como director)
      codirector: 'doc-008', // Gustavo Ramírez
      advisor: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id: 'prop-005',
      title: 'Desarrollo de App móvil para seguimiento de egresados...',
      modality: Modality.PP,
      description: 'Aplicación en Flutter con Firebase...',
      state: stateList.APROBADO,
      authors: ['user-004'], // Andrés Felipe Caldas
      directorId: 'doc-005', // Hugo Armando Ordoñez
      codirector: undefined,
      advisor: 'doc-003',    // Carlos Eduardo Ramírez
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id: 'prop-006',
      title: 'Sistema de monitoreo ambiental basado en LoRaWAN...',
      modality: Modality.PP,
      description: 'Uso de sensores de calidad de aire...',
      state: stateList.APROBADO,
      authors: ['user-005'], // Camila Andrea Suárez
      directorId: 'doc-006', // Libardo Pantoja
      codirector: 'doc-001', // Pablo Mage (Como codirector)
      advisor: 'doc-002',    // Alejandro Toledo (Como asesor)
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
  ];


  private _proposalsList = signal<Proposal[]>(this.getStoredProposals());

  public proposals = computed(() => {
    const currentUser = this.authService.currentUser();
    const activeProposals = this._proposalsList().filter(p => p.isActive !== false);

    if (!currentUser) return [];

    // Uso de UserRoleType para mayor seguridad
    if (this.authService.hasAnyRole([UserRoleType.ADMINISTRADOR, UserRoleType.COMITE])) {
      return activeProposals;
    }

    return activeProposals.filter(proposal => {
      // Filtrado estricto por ID
      const isAuthor     = proposal.authors?.includes(currentUser.id);
      const isDirector   = proposal.directorId === currentUser.id;
      const isCodirector = proposal.codirector === currentUser.id;
      const isAdvisor    = proposal.advisor === currentUser.id;

      return isAuthor || isDirector || isCodirector || isAdvisor;
    });
  });

  constructor() {
    // 2. EFECTO DE PERSISTENCIA: Cada vez que _proposalsList cambie,
    // se guardará automáticamente en el localStorage.
    effect(() => {
      localStorage.setItem('proposals', JSON.stringify(this._proposalsList()));
    });
  }

  private getStoredProposals(): Proposal[] {
    const stored = localStorage.getItem('proposals');
    return stored ? JSON.parse(stored) : this.initialData;
  }

  createProposalMock(proposal: Proposal): Observable<Proposal> {
    const newProposal: Proposal = {
      ...proposal,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      state: stateList.EN_REVISION,
      // Nos aseguramos de que si el formulario envió un documento, se guarde
      documents: proposal.documents ? proposal.documents.map(doc => ({
        ...doc,
        id: doc.id || Date.now().toString() // Asegurar un ID si no lo tiene
      })) : [],
      evaluations: []
    };

    return of(newProposal).pipe(
      delay(1000),
      tap(saved => {
        this._proposalsList.update(current => [saved, ...current]);

        // --- GESTIÓN DE ROLES AL CREAR ---
        if (saved.directorId) this.userService.addRoleToUser(saved.directorId, UserRoleType.DIRECTOR);
        if (saved.codirector) this.userService.addRoleToUser(saved.codirector, UserRoleType.CODIRECTOR);
        if (saved.advisor)    this.userService.addRoleToUser(saved.advisor, UserRoleType.ASESOR);
      })
    );
  }

  getProposalByIdMock(id: string): Observable<Proposal | undefined> {
    const proposal = this._proposalsList().find(p => p.id === id);
    return of(proposal).pipe(delay(1000));
  }

  /**
   * REGLA DE NEGOCIO: Valida las restricciones de la universidad
   * @returns string con el error o null si es válido
   */
  validateProposalRules(proposal: Partial<Proposal>): string | null {
    // 1. Regla: Director != Codirector
    if (proposal.directorId && proposal.codirector && proposal.directorId === proposal.codirector) {
      return 'Un docente no puede ser Director y Codirector simultáneamente en el mismo proyecto.';
    }

    // 2. Regla: Máximo 2 propuestas por estudiante
    if (proposal.authors && proposal.authors.length > 0) {
      for (const authorId of proposal.authors) {
        const activeCount = this._proposalsList().filter(p =>
          p.authors?.includes(authorId) && p.id !== proposal.id
        ).length;

        if (activeCount >= 2) {
          const studentName = this.userService.getUserFullName(authorId);
          return `El estudiante ${studentName} ya está vinculado a 2 propuestas (límite máximo permitido).`;
        }
      }
    }
    return null;
  }

  updateProposalMock(id: string, changes: Partial<Proposal>): Observable<Proposal> {
    const oldProposal = this._proposalsList().find(p => p.id === id);

    return of(null).pipe(
      delay(1000),
      tap(() => {
        if (!oldProposal) return;

        // Pasamos el 'id' de la propuesta actual para que handleRoleExchange la ignore al contar
        this.handleRoleExchange(oldProposal.codirector, changes.codirector, UserRoleType.CODIRECTOR, id);
        this.handleRoleExchange(oldProposal.advisor, changes.advisor, UserRoleType.ASESOR, id);

        this._proposalsList.update(list =>
          list.map(p => (p.id === id ? { ...p, ...changes } : p))
        );
      }),
      map(() => this._proposalsList().find(p => p.id === id)!)
    );
  }

  /**
   * Gestiona el traspaso de roles entre docentes al editar
   */
  private handleRoleExchange(
    oldId: string | undefined,
    newId: string | undefined,
    role: UserRoleType,
    currentProposalId: string // <--- Agregamos esto
  ): void {
    if (oldId === newId) return;

    if (newId) this.userService.addRoleToUser(newId, role);

    if (oldId) {
      // Verificamos si aparece en OTRA propuesta (que no sea la actual)
      const isStillLinked = this._proposalsList().some(p =>
        p.id !== currentProposalId && ( // <--- Crucial: Ignorar la que estamos editando
          (role === UserRoleType.CODIRECTOR && p.codirector === oldId) ||
          (role === UserRoleType.ASESOR && p.advisor === oldId)
        )
      );

      if (!isStillLinked) {
        this.userService.removeRoleFromUser(oldId, role);
      }
    }
  }

  deleteProposalMock(id: string): Observable<void> {
    const proposalToRemove = this._proposalsList().find(p => p.id === id);

    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        if (!proposalToRemove) return;

        // 1. Primero actualizamos la lista (eliminamos la propuesta del Signal)
        this._proposalsList.update(list => list.filter(p => p.id !== id));

        // 2. Ahora que el Signal NO tiene la propuesta, verificamos los roles
        const rolesToCheck = [
          { id: proposalToRemove.codirector, role: UserRoleType.CODIRECTOR },
          { id: proposalToRemove.advisor,    role: UserRoleType.ASESOR }
        ];

        rolesToCheck.forEach(({ id: userId, role }) => {
          if (userId) {
            // Ahora esta búsqueda dará 'false' si era su única propuesta
            const isStillLinked = this._proposalsList().some(p =>
              (role === UserRoleType.CODIRECTOR && p.codirector === userId) ||
              (role === UserRoleType.ASESOR && p.advisor === userId)
            );

            if (!isStillLinked) {
              this.userService.removeRoleFromUser(userId, role);
            }
          }
        });
      })
    );
  }

  addEvaluationMock(proposalId: string, evaluation: Evaluation): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._proposalsList.update(list => {
          const updatedList = list.map(p => {
            if (p.id === proposalId) {
              console.log('Actualizando propuesta con evaluación:', evaluation);

              // Actualizamos la propuesta y sus evaluaciones
              const updatedProposal = {
                ...p,
                state: evaluation.veredict,
                evaluations: [{ ...evaluation, id: Math.random().toString(36).substring(2, 7) }, ...(p.evaluations || [])]
              };

              // IMPORTANTE: También debemos actualizar el estado del último documento cargado
              if (updatedProposal.documents && updatedProposal.documents.length > 0) {
                updatedProposal.documents = updatedProposal.documents.map((doc, index) =>
                  index === 0 ? { ...doc, status: evaluation.veredict } : doc
                );
              }

              return updatedProposal;
            }
            return p;
          });
          return updatedList;
        });
      })
    );
  }

  // 3. PERSISTENCIA DE DOCUMENTOS: Al actualizar la lista aquí, el 'effect' lo guardará en el navegador
  uploadCorrectionMock(proposalId: string, newDoc: ProposalDocument): Observable<void> {
    return of(undefined).pipe(
      delay(1200),
      tap(() => {
        this._proposalsList.update(list =>
          list.map(p => p.id === proposalId
            ? { ...p, documents: [newDoc,...p.documents], state: stateList.EN_REVISION }
            : p
          )
        );
      })
    );
  }

  getDownloadableFormatsMock(): Observable<ProposalDocument[]> {
    const formats: ProposalDocument[] = [
      { id: 'f1', name: 'Formato_Propuesta_V1.docx', url: '#', uploadDate: new Date(), type: 'Formato' },
      { id: 'f2', name: 'Anexo_A_Estudiantes.pdf', url: '#', uploadDate: new Date(), type: 'Formato' }
    ];
    return of(formats).pipe(delay(300));
  }

  // 4. HELPER DE CONSULTA: Útil para refrescar la vista en el componente
  getDocumentsByProposalId(id: string): ProposalDocument[] {
    const proposal = this._proposalsList().find(p => p.id === id);
    return proposal ? proposal.documents : [];
  }

}
