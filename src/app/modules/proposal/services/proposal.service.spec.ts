import { TestBed } from '@angular/core/testing';
import { ProposalService } from './proposal.service';
import { signal } from '@angular/core';
import { UserRoleType } from '../../../core/models/user-role';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../users/services/user.service';
import { stateList } from '../../../core/enums/state.enum';

describe('Service: Proposal', () => {
  let service: ProposalService;
  let mockAuthService: any;
  let mockUserService: any;

  // Mock de usuarios necesarios para que getMockUser no falle durante la inicialización
  const mockUsers = [
    { id: 'user-001', name: 'Estudiante 1' },
    { id: 'user-456', name: 'Estudiante 2' },
    { id: 'user-003', name: 'Estudiante 3' },
    { id: 'doc-001', name: 'Docente 1' },
    { id: 'doc-002', name: 'Docente 2' },
    { id: 'doc-005', name: 'Docente 5' },
    { id: 'doc-008', name: 'Docente 8' },
  ];

  beforeEach(() => {
    localStorage.clear();

    mockAuthService = {
      currentUser: signal({ id: 'user-001', roles: [UserRoleType.ESTUDIANTE] }),
      hasAnyRole: jest.fn().mockReturnValue(false)
    };

    // CORRECCIÓN: Definimos getAllUsers para que la inicialización del servicio funcione
    mockUserService = {
      getAllUsers: jest.fn().mockReturnValue(mockUsers),
      addRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
      getUserFullName: jest.fn().mockReturnValue('Simón Guzmán')
    };

    TestBed.configureTestingModule({
      providers: [
        ProposalService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService }
      ]
    });

    service = TestBed.inject(ProposalService);
  });

  it('Debe cargar los datos iniciales si el localStorage está vacío', () => {
    const initialProposals = service.proposals();
    // En initialData hay propuestas donde user-001 es autor
    expect(initialProposals.length).toBeGreaterThan(0);
    expect(initialProposals.some(p => p.authors?.includes('user-001'))).toBe(true);
  });

  it('Debe validar que un Director no sea el mismo Codirector', () => {
    // Usamos objetos con ID para cumplir con la lógica del servicio
    const invalidProposal = {
      director: { id: 'doc-123' } as any,
      codirector: { id: 'doc-123' } as any
    };

    const error = service.validateProposalRules(invalidProposal);
    expect(error).toContain('no puede ser Director y Codirector');
  });

  it('Debe validar el límite máximo de 2 propuestas por estudiante', () => {
    const newProposal = {
      id: 'new-prop',
      authors: ['user-001']
    };

    const error = service.validateProposalRules(newProposal);
    expect(error).toContain('límite máximo');
  });

  it('Debe persistir en el signal cuando se crea una propuesta', (done) => {
    const newProposalData: any = {
      title: 'Nueva Propuesta Test',
      authors: ['user-999'],
      director: { id: 'doc-100' }
    };

    service.createProposalMock(newProposalData).subscribe(() => {
      const list = (service as any)._proposalsList();
      const exists = list.some((p: any) => p.title === 'Nueva Propuesta Test');
      expect(exists).toBe(true);
      done();
    });
  });

  it('Debe gestionar el cambio de roles al actualizar una propuesta', (done) => {
    const proposalId = 'prop-001';
    const changes = { codirector: { id: 'doc-new-specialist' } as any };

    service.updateProposalMock(proposalId, changes).subscribe(() => {
      expect(mockUserService.addRoleToUser).toHaveBeenCalledWith('doc-new-specialist', UserRoleType.CODIRECTOR);
      done();
    });
  });

  it('Debe filtrar propuestas según el rol de COMITE (ver todas)', () => {
    mockAuthService.hasAnyRole.mockReturnValue(true);
    // Forzamos re-evaluación del computed si fuera necesario
    const allProposals = service.proposals();
    // En initialData hay 4 propuestas
    expect(allProposals.length).toBe(4);
  });

  it('Debe actualizar el estado de la propuesta y del documento al añadir una evaluación', (done) => {
    const proposalId = 'prop-001';
    const evaluation: any = {
      veredict: stateList.APROBADO,
      observations: 'Excelente'
    };

    // Agregamos un documento mock a la propuesta para la prueba
    (service as any)._proposalsList.update((list: any[]) =>
      list.map(p => p.id === proposalId ? { ...p, documents: [{ id: 'doc-1', status: stateList.EN_REVISION }] } : p)
    );

    service.addEvaluationMock(proposalId, evaluation).subscribe(() => {
      // Accedemos a la lista interna para verificar
      const updated = (service as any)._proposalsList().find((p: any) => p.id === proposalId);
      expect(updated?.state).toBe(stateList.APROBADO);
      expect(updated?.documents[0].status).toBe(stateList.APROBADO);
      done();
    });
  });
});
