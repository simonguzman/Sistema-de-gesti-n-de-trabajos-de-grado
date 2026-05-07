import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Modality, Proposal } from '../interfaces/proposal.interface';
import { BehaviorSubject, delay, Observable, of, tap } from 'rxjs';
import { stateList } from '../../../shared/components/state/state.component';
import { Evaluation } from '../interfaces/evaluation.interface';
import { ProposalDocument } from '../interfaces/proposalDocument.inteface';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {

  private http = inject(HttpClient);
  private apiUrl = 'https://api-sgtg-placeholder.com/api/proposals';

  private initialData: Proposal[] = [

    {
      id:'prop-001',
      title: 'Frontend de las funcionalidades asociadas a la aplicación web para la Facultad de Ingeniería Electrónica y Telecomunicaciones, dedicada a los módulos de Gestión de Trabajos de Grado de los programas de pregrado, Gestión de Estadísticas y Gestión de Notificaciones',
      modality: Modality.PP,
      description: 'Desarrollar un prototipo del FrontEnd de una aplicación web para apoyar la gestión de los procesos académicos y administrativos asociados a los trabajos de grado, las estadísticas y las notificaciones de la FIET, facilitando la organización, el seguimiento y la comunicación de la información, con el fin de contribuir al mejoramiento de la eficiencia del proceso y a la satisfacción de los usuarios involucrados. ',
      state: stateList.APROBADO,
      authors: ['user_123'],
      directorId: 'director_mock_001',
      codirector: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id:'prop-002',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: Modality.TI,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: stateList.APROBADO_CON_OBSERVACIONES,
      authors: ['user_123'],
      directorId: 'director_mock_001',
      codirector: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id:'prop-003',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: Modality.PP,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: stateList.NO_APROBADO,
      authors: ['user_123'],
      directorId: 'director_mock_001',
      codirector: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id:'prop-004',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: Modality.TI,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: stateList.APROBADO_CON_OBSERVACIONES,
      authors: ['user_123'],
      directorId: 'director_mock_001',
      codirector: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id:'prop-005',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: Modality.PP,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: stateList.APROBADO,
      authors: ['user_123'],
      directorId: 'director_mock_001',
      codirector: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
    {
      id:'prop-006',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: Modality.PP,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: stateList.APROBADO,
      authors: ['user_123'],
      directorId: 'director_mock_001',
      codirector: undefined,
      documents: [],
      evaluations: [],
      createdAt: new Date()
    },
  ];


  private _proposalsList = signal<Proposal[]>(this.getStoredProposals());
  public proposals = this._proposalsList.asReadonly();

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
        // El effect() se encargará de guardarlo en LocalStorage automáticamente
      })
    );
  }

  getProposalByIdMock(id: string): Observable<Proposal | undefined> {
    const proposal = this._proposalsList().find(p => p.id === id);
    return of(proposal).pipe(delay(1000));
  }

  updateProposalMock(id: string, changes: Partial<Proposal>): Observable<Proposal> {
    return of(changes as Proposal).pipe(
      delay(1000),
      tap(() => {
        this._proposalsList.update(proposalsList =>
          proposalsList.map(proposal => {
            if (proposal.id === id) {
              const updatedProposal = { ...proposal, ...changes };

              // Si el cambio incluye un nuevo estado, sincronizamos el documento principal
              if (changes.state && updatedProposal.documents && updatedProposal.documents.length > 0) {
                const updatedDocs = [...updatedProposal.documents];
                updatedDocs[0] = { ...updatedDocs[0], status: changes.state };
                updatedProposal.documents = updatedDocs;
              }
              return updatedProposal;
            }
            return proposal;
          })
        );
      })
    );
  }

  deleteProposalMock(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._proposalsList.update(list => list.filter(p => p.id !== id));
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
