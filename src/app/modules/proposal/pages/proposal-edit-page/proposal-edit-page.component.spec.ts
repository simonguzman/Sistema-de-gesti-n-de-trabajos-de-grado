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
import { signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserRoleType } from '../../../../core/models/user-role';

describe('ProposalEditPageComponent', () => {
  let component: ProposalEditPageComponent;
  let fixture: ComponentFixture<ProposalEditPageComponent>;

  let mockProposalService: any;
  let mockNotificationService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockLocation: any;
  let mockAuthService: any;

  const mockProposal: any = {
    id: '123',
    title: 'Propuesta Original',
    description: 'Descripción original',
    modality: Modality.TI,
    state: stateList.EN_REVISION,
    authors: ['user-1'],
    director: { id: 'doc-100' }, // Corregido: estructura de objeto
    createdAt: new Date(),
    documents: [],
    evaluations: []
  };

  beforeEach(async () => {
    mockProposalService = {
      getProposalByIdMock: jest.fn().mockReturnValue(of(mockProposal)),
      updateProposalMock: jest.fn(),
      // SOLUCIÓN AL ERROR: Agregar la función que faltaba
      validateProposalRules: jest.fn().mockReturnValue(null),
      proposals: signal([])
    };

    mockAuthService = {
      currentUser: signal({ id: 'doc-100', roles: [UserRoleType.DIRECTOR] }),
      hasAnyRole: jest.fn().mockReturnValue(true)
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
      imports: [ProposalEditPageComponent],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: AuthService, useValue: mockAuthService },
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
    expect(component.proposalToEdit()).toEqual(mockProposal);
  });

  it('Debe navegar hacia atrás al llamar a goBack()', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('Debe actualizar el estado de confirmación en handleUpdate()', () => {
    fixture.detectChanges();
    const updatedData = { ...mockProposal, title: 'Título Actualizado' };
    component.handleUpdate(updatedData);

    expect(component.confirmState.show).toBe(true);
    expect(component.confirmState.pendingData).toEqual(updatedData);
  });

  it('Debe completar el flujo de actualización exitosamente', fakeAsync(() => {
    fixture.detectChanges();
    const updatedData = { ...mockProposal, title: 'Título Actualizado' };
    component.handleUpdate(updatedData);

    mockProposalService.updateProposalMock.mockReturnValue(of(undefined));

    component.confirmUpdate();
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
    fixture.detectChanges();
    component.handleUpdate(mockProposal);
    component.cancelUpdate();

    expect(component.confirmState.show).toBe(false);
    expect(component.confirmState.pendingData).toBeNull();
  });
});
