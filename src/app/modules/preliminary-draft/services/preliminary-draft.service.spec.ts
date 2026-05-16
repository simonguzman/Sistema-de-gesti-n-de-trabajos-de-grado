import { TestBed } from '@angular/core/testing';
import { PreliminaryDraftService } from './preliminary-draft.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { ProposalService } from '../../proposal/services/proposal.service';
import { stateList } from '../../../core/enums/state.enum';
import { UserRoleType } from '../../../core/models/user-role';
import { signal, WritableSignal } from '@angular/core';
import { IdentificationType, User, UserState } from '../../users/interfaces/user.interface';

describe('PreliminaryDraftService', () => {
  let service: PreliminaryDraftService;

  // Tipamos los mocks como 'any' para evitar conflictos con las interfaces privadas de Angular/RxJS
  let authServiceMock: any;
  let userServiceMock: any;
  let proposalServiceMock: any;

  // Creamos un usuario de prueba que cumpla con la interfaz User completa
  const mockUser: User = {
    id: 'user-1',
    idType: IdentificationType.CC,
    idNumber: 123456,
    firstName: 'Test',
    lastName: 'User',
    secondLastName: 'Test', // Agregado
    codeNumber: 123456,     // Agregado
    email: 'test@test.com',
    password: 'password123',
    roles: [UserRoleType.ESTUDIANTE],
    state: UserState.active,
  };

  beforeEach(() => {
    // Para poder usar .set() en los tests, definimos currentUser como un signal normal
    // pero el servicio lo consumirá como Signal (gracias a la naturaleza de los signals)
    const currentUserSignal = signal<User | null>(mockUser);

    authServiceMock = {
      currentUser: currentUserSignal, // Aquí el signal permite lectura
      hasAnyRole: jest.fn()
    };

    userServiceMock = {
      users: signal<User[]>([]),
      addRoleToUser: jest.fn()
    };

    proposalServiceMock = {};

    TestBed.configureTestingModule({
      providers: [
        PreliminaryDraftService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: ProposalService, useValue: proposalServiceMock }
      ]
    });

    localStorage.clear();
    service = TestBed.inject(PreliminaryDraftService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('validateReviewersRules', () => {
    const proposal: any = {
      director: { id: 'dir-1' },
      codirector: { id: 'cod-1' },
      authors: [{ id: 'auth-1' }]
    };

    it('should return error if evaluators are equal', () => {
      const result = service.validateReviewersRules(proposal, 'eval-1', 'eval-1');
      expect(result).toBe('Debe seleccionar dos evaluadores diferentes.');
    });

    it('should return error if first evaluator is director', () => {
      const result = service.validateReviewersRules(proposal, 'dir-1', 'eval-2');
      expect(result).toBe('El primer docente tiene vínculos con la propuesta.');
    });

    it('should return error if second evaluator is author', () => {
      const result = service.validateReviewersRules(proposal, 'eval-1', 'auth-1');
      expect(result).toBe('El segundo docente tiene vínculos con la propuesta.');
    });

    it('should return null when evaluators are valid', () => {
      const result = service.validateReviewersRules(proposal, 'eval-1', 'eval-2');
      expect(result).toBeNull();
    });
  });

  describe('calculateDocumentStatus', () => {
    it('should return EN_REVISION when no evaluations exist', () => {
      const status = service.calculateDocumentStatus('doc-1', [], 2);
      expect(status).toBe(stateList.EN_REVISION);
    });

    it('should return NO_APROBADO when one evaluation is rejected', () => {
      const evals: any[] = [{ documentId: 'doc-1', veredict: stateList.NO_APROBADO }];
      const status = service.calculateDocumentStatus('doc-1', evals, 2);
      expect(status).toBe(stateList.NO_APROBADO);
    });
  });

  describe('preliminaryDrafts computed', () => {
    it('should return all drafts for admin', () => {
      // Usamos el mock de Jest para forzar el retorno de true
      authServiceMock.hasAnyRole.mockReturnValue(true);

      (service as any)._preliminaryDraftsList.set([
        { preliminaryDraftId: '1' },
        { preliminaryDraftId: '2' }
      ]);

      expect(service.preliminaryDrafts().length).toBe(2);
    });

    it('should filter drafts for normal user', () => {
      authServiceMock.hasAnyRole.mockReturnValue(false);

      // Ahora .set() funcionará porque el signal en el mock es Writable
      (authServiceMock.currentUser as WritableSignal<User | null>).set({
        ...mockUser,
        id: 'user-auth'
      });

      const drafts: any[] = [{
        preliminaryDraftId: '1',
        proposalData: { authors: ['user-auth'] }
      }];

      (service as any)._preliminaryDraftsList.set(drafts);

      expect(service.preliminaryDrafts().length).toBe(1);
    });
  });
});
