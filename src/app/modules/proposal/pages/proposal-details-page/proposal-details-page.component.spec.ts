/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { of, throwError } from 'rxjs';

import { UserService } from '../../../users/services/user.service';
import { ProposalService } from '../../services/proposal.service';

import { Modality, Proposal } from '../../interfaces/proposal.interface';
import { stateList } from '../../../../shared/components/state/state.component';
import { ProposalDetailsPageComponent } from './proposal-details-page.component';

describe('ProposalDetailsPageComponent', () => {
  let component: ProposalDetailsPageComponent;
  let fixture: ComponentFixture<ProposalDetailsPageComponent>;

  let mockProposalService: any;
  let mockUserService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockProposal: Proposal = {
    id: 'prop-123',
    title: 'Sistema de Gestión de Grados',
    description: 'Descripción de prueba para el detalle',
    modality: Modality.TI,
    state: stateList.EN_REVISION,
    authors: ['student-1', 'student-2'],
    directorId: 'director-1',
    codirector: 'codirector-1',
    advisor: 'advisor-1',
    createdAt: new Date(),
    documents: [],
    evaluations: []
  };

  beforeEach(async () => {
    mockProposalService = {
      getProposalByIdMock: jest.fn().mockReturnValue(of(mockProposal))
    };

    mockUserService = {
      getUserFullName: jest.fn().mockImplementation((id) => `Nombre de ${id}`),
      getAuthorsNames: jest.fn().mockReturnValue('Estudiante 1, Estudiante 2')
    };

    mockRouter = {
      navigate: jest.fn()
    };

    mockActivatedRoute = {
      parent: {
        snapshot: {
          paramMap: {
            get: jest.fn().mockReturnValue('prop-123')
          }
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ProposalDetailsPageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalDetailsPageComponent);
    component = fixture.componentInstance;
  });

  it('Debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Debe cargar los detalles de la propuesta al iniciar', () => {
    fixture.detectChanges();
    expect(mockProposalService.getProposalByIdMock).toHaveBeenCalledWith('prop-123');
    expect(component.proposal()).toEqual(mockProposal);
  });

  it('Debe redirigir a /proposal si no se encuentra el ID en la ruta', () => {
    mockActivatedRoute.parent.snapshot.paramMap.get.mockReturnValue(null);
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
  });

  it('Debe redirigir a /proposal si el servicio devuelve null o da error', () => {
    mockProposalService.getProposalByIdMock.mockReturnValue(of(null));
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);

    mockProposalService.getProposalByIdMock.mockReturnValue(throwError(() => new Error('Error')));
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
  });

  it('Debe obtener el nombre completo del usuario a través del UserService', () => {
    const name = component.getMemberName('director-1');
    expect(mockUserService.getUserFullName).toHaveBeenCalledWith('director-1');
    expect(name).toBe('Nombre de director-1');
  });

  it('Debe obtener los nombres de los autores a través del UserService', () => {
    const authors = component.getAuthors(['id1', 'id2']);
    expect(mockUserService.getAuthorsNames).toHaveBeenCalledWith(['id1', 'id2']);
    expect(authors).toBe('Estudiante 1, Estudiante 2');
  });

  it('Debe navegar a las sub-rutas relativas (accediendo vía casting)', () => {
    const componentAny = component as any;
    componentAny.router.navigate(['evaluations_performed'], { relativeTo: componentAny.route });

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['evaluations_performed'],
      { relativeTo: mockActivatedRoute }
    );
  });
});
