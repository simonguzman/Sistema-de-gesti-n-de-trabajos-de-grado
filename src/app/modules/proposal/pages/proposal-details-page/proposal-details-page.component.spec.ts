/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserService } from '../../../users/services/user.service';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { Modality, Proposal } from '../../interfaces/proposal.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { ProposalDetailsPageComponent } from './proposal-details-page.component';
import { User } from '../../../users/interfaces/user.interface';

describe('ProposalDetailsPageComponent', () => {
  let component: ProposalDetailsPageComponent;
  let fixture: ComponentFixture<ProposalDetailsPageComponent>;

  let mockProposalService: any;
  let mockUserService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockProposal: any = {
    id: 'prop-123',
    title: 'Sistema de Gestión de Grados',
    description: 'Descripción de prueba',
    modality: Modality.TI,
    state: stateList.EN_REVISION,
    authors: ['student-1', 'student-2'],
    createdAt: new Date(),
    documents: [],
    evaluations: []
  };

  beforeEach(async () => {
    mockProposalService = {
      getProposalByIdMock: jest.fn().mockReturnValue(of(mockProposal))
    };

    mockUserService = {
      getAuthorsNames: jest.fn().mockReturnValue('Estudiante 1, Estudiante 2')
    };

    mockNotificationService = {
      show: jest.fn()
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
        { provide: NotificationService, useValue: mockNotificationService },
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

  // --- CORRECCIÓN AQUÍ ---
  it('Debe obtener el nombre completo del usuario concatenando sus propiedades', () => {
    const mockUser: Partial<User> = {
      firstName: 'Juan',
      secondName: 'Carlos',
      lastName: 'Pérez',
      secondLastName: 'Rodríguez'
    };

    const name = component.getMemberName(mockUser as User);

    // Ya no esperamos que llame al servicio, sino que el resultado sea el correcto
    expect(name).toBe('Juan Carlos Pérez Rodríguez');
  });

  it('Debe manejar nombres con campos faltantes en getMemberName', () => {
    const mockUser: Partial<User> = {
      firstName: 'Juan',
      lastName: 'Pérez'
    };

    const name = component.getMemberName(mockUser as User);

    // El filtro debe eliminar los espacios extra de los campos nulos
    expect(name).toBe('Juan Pérez');
  });

  it('Debe retornar "No asignado" si el usuario es undefined', () => {
    const name = component.getMemberName(undefined);
    expect(name).toBe('No asignado');
  });
  // ------------------------

  it('Debe obtener los nombres de los autores a través del UserService', () => {
    const authors = component.getAuthors(['id1', 'id2']);
    expect(mockUserService.getAuthorsNames).toHaveBeenCalledWith(['id1', 'id2']);
    expect(authors).toBe('Estudiante 1, Estudiante 2');
  });
});
