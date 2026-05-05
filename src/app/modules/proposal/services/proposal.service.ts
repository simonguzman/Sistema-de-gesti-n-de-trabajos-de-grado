import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Proposal } from '../interfaces/proposal.interface';
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

  private initialData: any[] = [

    {
      id:'prop-001',
      title: 'Frontend de las funcionalidades asociadas a la aplicación web para la Facultad de Ingeniería Electrónica y Telecomunicaciones, dedicada a los módulos de Gestión de Trabajos de Grado de los programas de pregrado, Gestión de Estadísticas y Gestión de Notificaciones',
      modality: 'Practica profesional',
      description: 'Desarrollar un prototipo del FrontEnd de una aplicación web para apoyar la gestión de los procesos académicos y administrativos asociados a los trabajos de grado, las estadísticas y las notificaciones de la FIET, facilitando la organización, el seguimiento y la comunicación de la información, con el fin de contribuir al mejoramiento de la eficiencia del proceso y a la satisfacción de los usuarios involucrados. ',
      state: 'Aprobado',
    },
    {
      id:'prop-002',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: 'Trabajo de investigacón',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: 'Aprobado con observaciones',
    },
    {
      id:'prop-003',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: 'Practica profesional',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: 'No aprobado',
    },
    {
      id:'prop-004',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: 'Trabajo de investigación',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: 'Aprobado con observaciones',
    },
    {
      id:'prop-005',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: 'Practica profesional',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: 'Aprobado',
    },
    {
      id:'prop-006',
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      modality: 'Practica profesional',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      state: 'Aprobado',
    },
  ];


  private _proposalsList = signal<any[]>(this.initialData);
  public proposals = this._proposalsList.asReadonly();

  createProposalMock(proposal: Proposal): Observable<Proposal>{
    const newProposal: Proposal = {
      ...proposal,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      state: stateList.EN_REVISION,
      documents: proposal.documents || [],
      evaluations: []
    };
    return of(newProposal).pipe(
      delay(1000),
      tap(saved => {
        this._proposalsList.update(currentProposal => [saved, ...currentProposal]);
      })
    );
  }

  getProposalByIdMock(id: string): Observable<Proposal | undefined>{
    const proposal = this._proposalsList().find(proposal => proposal.id === id);
    return of(proposal).pipe(delay(1000));
  }

  updateProposalMock(id: string, changes: Partial<Proposal>): Observable<Proposal> {
    return of(changes as Proposal).pipe(
      delay(1000),
      tap(() => {
        this._proposalsList.update(proposals =>
          proposals.map(proposal =>
            proposal.id === id ? {...proposal,...changes} : proposal
          )
        );
      })
    );
  }

  deleteProposalMock(id: string): Observable<void>{
    return of(undefined).pipe(
      delay(1000),
      tap(() =>{
        this._proposalsList.update(proposals =>
          proposals.filter(proposal => proposal.id !== id)
        );
      })
    );
  }

  addEvaluationMock(proposalId: string, evaluation: Evaluation): Observable<void>{
    return of(undefined).pipe(
      delay(1000),
      tap (() => {
        this._proposalsList.update(list =>
          list.map(proposal => {
            if(proposal.id === proposalId){
              return {
                ... proposal,
                state: evaluation.veredict,
                evaluations: [...proposal.evaluations, {...evaluation, id: Math.random().toString(36).substring(2,7)}]
              };
            }
            return proposal;
          })
        );
      })
    );
  }

  uploadCorrectionMock(proposalId: string, newDoc: ProposalDocument): Observable<void> {
  return of(undefined).pipe(
    delay(1200),
    tap(() => {
      this._proposalsList.update(list =>
        list.map(proposal => proposal.id === proposalId
          ? { ...proposal, documents: [...proposal.documents, newDoc], state: stateList.EN_REVISION }
          : proposal
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

}
