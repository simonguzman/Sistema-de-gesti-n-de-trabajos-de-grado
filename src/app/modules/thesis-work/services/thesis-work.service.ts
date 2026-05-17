import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { delay, Observable, of, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { PreliminaryDraftService } from '../../preliminary-draft/services/preliminary-draft.service';

import { stateList } from '../../../core/enums/state.enum';
import { Document, DocumentType } from '../../../core/interfaces/Document.interface';
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

  private readonly _thesisWorksList = signal<ThesisWork[]>(this.initializeThesisWorks());

  public thesisWorks = computed(() => {
    const currentUser = this.authService.currentUser();
    const allWorks = this._thesisWorksList();
    if (!currentUser) return [];

    if (this.authService.hasAnyRole([
      UserRoleType.ADMINISTRADOR,
      UserRoleType.DECANATURA,
      UserRoleType.CONSEJO
    ])) {
      return allWorks;
    }

    return allWorks.filter(work => this.canUserAccessThesisWork(work, currentUser.id));
  });

  constructor() {
    effect(() => {
      localStorage.setItem('thesisWorks', JSON.stringify(this._thesisWorksList()));
    });
  }

  private initializeThesisWorks(): ThesisWork[] {
    const stored = localStorage.getItem('thesisWorks');
    if (stored) return JSON.parse(stored);

    const approvedDrafts = this.preliminaryDraftService.preliminaryDrafts()
      .filter(draft => draft.state === stateList.APROBADO);

    return approvedDrafts.map(draft => ({
      thesisWorkId: crypto.randomUUID(),
      preliminaryDraftId: draft.preliminaryDraftId!,
      preliminaryDraftData: draft,
      documents: [],
      advances: [],
      evaluations: [],
      specialRequests: [],
      state: stateList.EN_DESARROLLO,
      createdDate: new Date()
    }));
  }

  private canUserAccessThesisWork(work: ThesisWork, userId: string): boolean {
    const proposal = work.preliminaryDraftData.proposalData;
    const isDirector = proposal.director?.id === userId;
    const isCodirector = proposal.codirector?.id === userId;
    const isAdvisor = proposal.advisor?.id === userId;
    const isAuthor = proposal.authors?.some(author =>
      typeof author === 'string' ? author === userId : (author as any)?.id === userId
    ) ?? false;
    const isJuror = work.sustentation?.assignedJurors?.some(juror => juror.id === userId) ?? false;

    return isDirector || isCodirector || isAdvisor || isAuthor || isJuror;
  }

  getThesisWorkByIdMock(id: string): Observable<ThesisWork | undefined> {
    return of(this._thesisWorksList().find(w => w.thesisWorkId === id)).pipe(delay(500));
  }

  uploadDocumentMock(thesisWorkId: string, document: Document, advanceMeta?: { title: string; comments: string; studentId: string }): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;

          // Si no es tipo avance, se maneja en la bolsa de formatos tradicionales
          if ((document.type as string) !== 'Avance') {
            const nextState = document.type === 'Formato' ? stateList.EN_REVISION : work.state;
            return {
              ...work,
              documents: [document, ...work.documents],
              state: nextState
            };
          }

          // =========================================================================
          // 🚀 CORRECCIÓN: CARGA DE AVANCES (DESACOPLADA DEL ESTADO MAESTRO)
          // =========================================================================
          const existingAdvances = work.advances || [];

          const newAdvance = {
            id: document.id,
            title: advanceMeta?.title || document.name,
            comments: advanceMeta?.comments || '',
            uploadDate: new Date(document.uploadDate),
            studentId: advanceMeta?.studentId || '',
            status: stateList.EN_REVISION, // 📌 El estado "En revisión" se encapsula ÚNICAMENTE dentro del avance
            documents: [document]
          };

          return {
            ...work,
            advances: [newAdvance, ...existingAdvances],
            // state: stateList.EN_REVISION <-- ❌ ELIMINADO: Ya no altera el estado del Trabajo de Grado
            state: work.state // ✅ PRESERVADO: Mantiene su estado actual (ej: "En desarrollo")
          };
        }));
      })
    );
  }

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

  saveSustentationRegistryMock(thesisWorkId: string, formData: any): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;

          const allUsers = this.userService.users();
          const juror1User = allUsers.find(u => u.id === formData.juror1);
          const juror2User = allUsers.find(u => u.id === formData.juror2);

          const dateStr = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replaceAll('/', ' - ');

          const sustentationDoc: Document = {
            id: formData.formatEDocument?.id || crypto.randomUUID(),
            name: formData.formatEDocument?.fileName || 'Formato E - Sustentación',
            url: formData.formatEDocument?.url || 'uploads/sustentation/formato_e_registro.pdf',
            uploadDate: dateStr,
            type: DocumentType['FORMATO E'] || ('Formato E' as any),
            status: stateList.EN_REVISION
          };

          // ✅ CONCORDANCIA TOTAL CON TU INTERFAZ
          const sustentationRegistry: SustentationRegistry = {
            id: crypto.randomUUID(),
            sustentationDate: formData.sustentationDate ? new Date(formData.sustentationDate) : undefined,
            sustentationTime: formData.sustentationTime || undefined, // Mapeado por si lo capturas en el formulario
            assignedJurors: [
              ...(juror1User ? [juror1User] : []),
              ...(juror2User ? [juror2User] : [])
            ],
            verdicts: [] // Inicializa como un arreglo vacío según exige 'JurorVerdict[]'
          };

          return {
            ...work,
            sustentation: sustentationRegistry,
            documents: [sustentationDoc, ...(work.documents || [])],
            state: work.state
          };
        }));
      })
    );
  }

  uploadFinalDeliveryMock( thesisWorkId: string,  monograph: File, formatE: File, annexes?: File): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;

          const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' - ');

          // 1. Registro de Monografía
          const docMonograph: Document = {
            id: crypto.randomUUID(),
            name: monograph.name.replace('.pdf', ''),
            url: 'uploads/final-delivery/monografia_' + monograph.name,
            uploadDate: dateStr,
            type: DocumentType.MONONGRAFIA, // Ajustar al tipo string/enum de tu dominio
            status: stateList.EN_REVISION
          };

          // 2. Registro de Formato E (Usa tu DocumentType.FORMATO)
          const docFormatE: Document = {
            id: crypto.randomUUID(),
            name: formatE.name.replace('.pdf', ''),
            url: 'uploads/final-delivery/formato_e_' + formatE.name,
            uploadDate: dateStr,
            type: DocumentType['FORMATO E'],
            status: stateList.EN_REVISION
          };

          const newDocuments = [docMonograph, docFormatE];

          // 3. Registro opcional de Anexos
          if (annexes) {
            newDocuments.push({
              id: crypto.randomUUID(),
              name: annexes.name,
              url: 'uploads/final-delivery/anexos_' + annexes.name,
              uploadDate: dateStr,
              type: 'Anexos' as any,
              status: stateList.EN_REVISION
            });
          }

          return {
            ...work,
            documents: [...newDocuments, ...(work.documents || [])],
            state: stateList.EN_REVISION // Cambia el estado global del proyecto a En Revisión
          };
        }));
      })
    );
  }
  registerPazYSalvoMock(
    thesisWorkId: string,
    payload: { academicApproved: boolean, academicComments?: string, financialApproved: boolean, financialComments?: string },
    file: File
  ): Observable<void> {
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this._thesisWorksList.update(list => list.map(work => {
          if (work.thesisWorkId !== thesisWorkId) return work;

          // 🧠 1. Evaluamos si TODO fue aprobado
          const isFullyApproved = payload.academicApproved && payload.financialApproved;
          const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' - ');
          const docId = crypto.randomUUID();

          // 🧠 2. Creamos el documento del Paz y Salvo (Asegúrate de tener DocumentType.PAZ_Y_SALVO en tu Enum)
          const pazYSalvoDoc: Document = {
            id: docId,
            name: file.name.replace('.pdf', ''),
            url: 'uploads/paz-y-salvo/' + file.name,
            uploadDate: dateStr,
            type: DocumentType['PAZ Y SALVO'],
            status: isFullyApproved ? stateList.APROBADO : stateList.NO_APROBADO
          };

          let updatedDocuments = [pazYSalvoDoc, ...(work.documents || [])];

          // 🛑 REGLA DE NEGOCIO CLAVE: Si NO aprueba, invalidamos la Entrega Final actual
          if (!isFullyApproved) {
            updatedDocuments = updatedDocuments.map(doc => {
              // Si es el Formato E de la entrega final, lo marcamos como rechazado
              if (doc.type === DocumentType.FORMATO) {
                return { ...doc, status: stateList.NO_APROBADO };
              }
              return doc;
            });
          }

          return {
            ...work,
            pazYSalvo: {
              id: crypto.randomUUID(),
              ...payload,
              documentId: docId,
              registrationDate: new Date()
            },
            documents: updatedDocuments
            // Aquí también podrías cambiar el 'state' global del trabajo si tu lógica lo requiere
          };
        }));
      })
    );
  }




}
