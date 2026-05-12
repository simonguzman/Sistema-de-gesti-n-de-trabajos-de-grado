/* tslint:disable:no-unused-variable */
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ProposalEditPageComponent } from './proposal-edit-page.component';
import { Modality, Proposal } from '../../interfaces/proposal.interface';
import { stateList } from '../../../../core/enums/state.enum';
import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { UserService } from '../../../users/services/user.service';


describe('ProposalEditPageComponent', () => {
  let component: ProposalEditPageComponent;
  let fixture: ComponentFixture<ProposalEditPageComponent>;

  let mockProposalService: any;
  let mockUserService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockLocation: any;

  const mockProposal: Proposal = {
    id: '123',
    title: 'Propuesta Original',
    description: 'Descripción original',
    modality: Modality.TI,
    state: stateList.EN_REVISION,
    authors: ['user-1'],
    directorId: 'doc-100',
    createdAt: new Date(),
    documents: [],
    evaluations: []
  };

  beforeEach(async () => {
    mockProposalService = {
      getProposalByIdMock: jest.fn().mockReturnValue(of(mockProposal)),
      updateProposalMock: jest.fn(),
      proposals: signal([])
    };

    mockUserService = {
      students: signal([]),
      teachers: signal([]),
      advisors: signal([]),
      users: signal([]),
      currentUser: jest.fn().mockReturnValue({ id: 'doc-100' }),
      login: jest.fn()
    };

    mockNotificationService = { show: jest.fn() };
    mockRouter = { navigate: jest.fn() };
    mockLocation = { back: jest.fn() };
    mockActivatedRoute = {
      snapshot: {
        paramMap: { get: jest.fn().mockReturnValue('123') }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ProposalEditPageComponent, HttpClientTestingModule],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: UserService, useValue: mockUserService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalEditPageComponent);
    component = fixture.componentInstance;
  });

  it('Debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Debe cargar la propuesta al iniciar', () => {
    fixture.detectChanges();
    expect(mockProposalService.getProposalByIdMock).toHaveBeenCalledWith('123');
    // Acceso a la señal pública
    expect(component.proposalToEdit()).toEqual(mockProposal);
  });

  it('Debe navegar hacia atrás al llamar a goBack()', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe actualizar el estado de confirmación en handleUpdate()', () => {
    const updatedData = { ...mockProposal, title: 'Título Actualizado' };
    component.handleUpdate(updatedData);

    // Verificamos el objeto confirmState
    expect(component.confirmState.show).toBe(true);
    expect(component.confirmState.pendingData).toEqual(updatedData);
  });

  it('Debe completar el flujo de actualización exitosamente', fakeAsync(() => {
    fixture.detectChanges();
    const updatedData = { ...mockProposal, title: 'Título Actualizado' };
    component.handleUpdate(updatedData);

    const updateSubject = new Subject<void>();
    mockProposalService.updateProposalMock.mockReturnValue(updateSubject.asObservable());

    component.confirmUpdate();

    updateSubject.next();
    updateSubject.complete();
    tick();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.CONFIRMATION
    }));
    expect(component.confirmState.show).toBe(false);
  }));

  it('Debe manejar el error si la actualización falla', fakeAsync(() => {
    fixture.detectChanges();
    component.handleUpdate(mockProposal);

    mockProposalService.updateProposalMock.mockReturnValue(throwError(() => new Error('Error')));

    component.confirmUpdate();
    tick();

    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.ERROR
    }));
    expect(component.confirmState.show).toBe(false);
  }));

  it('Debe resetear el estado al cancelar la actualización', () => {
    component.handleUpdate(mockProposal);
    component.cancelUpdate();

    expect(component.confirmState.show).toBe(false);
    expect(component.confirmState.pendingData).toBeNull();
  });
});
