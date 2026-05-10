/* tslint:disable:no-unused-variable */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposalCreatePageComponent } from './proposal-create-page.component';

import { Modality, Proposal } from '../../interfaces/proposal.interface';
import { stateList } from '../../../../shared/components/state/state.component';

import { of, throwError } from 'rxjs';

import { ProposalService } from '../../services/proposal.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

@Component({
  selector: 'app-proposal-form',
  template: ''
})
class MockProposalFormComponent {
  @Input() proposal: Proposal | null = null;
  @Output() onSubmit = new EventEmitter<Proposal>();
}

@Component({
  selector: 'app-confirmation-action-modal',
  template: ''
})
class MockConfirmationModalComponent {}
describe('ProposalCreatePageComponent', () => {
  let component: ProposalCreatePageComponent;
  let fixture: ComponentFixture<ProposalCreatePageComponent>;

  // Mocks
  let mockProposalService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let mockLocation: any;

  const mockProposalData: Proposal = {
    id: 'new-prop',
    title: 'Nueva Propuesta Test',
    description: 'Descripción',
    modality: Modality.TI,
    state: stateList.EN_REVISION,
    authors: ['student-1'],
    directorId: 'director-1',
    createdAt: new Date(),
    documents: [],
    evaluations: []
  };

  beforeEach(async () => {
    mockProposalService = {
      createProposalMock: jest.fn().mockReturnValue(of({}))
    };
    mockNotificationService = {
      show: jest.fn()
    };
    mockAuthService = {
      hasAnyRole: jest.fn().mockReturnValue(true)
    };
    mockRouter = {
      navigate: jest.fn()
    };
    mockLocation = {
      back: jest.fn()
    };
    await TestBed.configureTestingModule({
    imports: [ProposalCreatePageComponent],
    providers: [
      { provide: ProposalService, useValue: mockProposalService },
      { provide: NotificationService, useValue: mockNotificationService },
      { provide: AuthService, useValue: mockAuthService },
      { provide: Router, useValue: mockRouter },
      { provide: Location, useValue: mockLocation }
    ]
  })
  .overrideComponent(ProposalCreatePageComponent, {
    set: {
      imports: [
        MockProposalFormComponent,
        MockConfirmationModalComponent
      ]
    }
  })
  .compileComponents();
    fixture = TestBed.createComponent(ProposalCreatePageComponent);
    component = fixture.componentInstance;
  });

  it('Debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Debe denegar acceso y redirigir si el usuario no tiene rol de ADMIN o DIRECTOR', () => {
    mockAuthService.hasAnyRole.mockReturnValue(false);
    component.ngOnInit();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR,
        title: 'Acceso Denegado'
      })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
  });

  it('Debe abrir el modal de confirmación al recibir datos del formulario', () => {
    component.handleCreateProposal(mockProposalData);
    expect(component.confirmState.show).toBe(true);
    expect(component.confirmState.pendingData).toEqual(mockProposalData);
  });

  it('Debe resetear el estado de confirmación al cancelar', () => {
    component.confirmState = {
      show: true,
      pendingData: mockProposalData
    };
    component.cancelCreation();
    expect(component.confirmState.show).toBe(false);
    expect(component.confirmState.pendingData).toBeNull();
  });

  it('Debe llamar al servicio de creación y navegar al éxito', () => {
    component.confirmState = {
      show: true,
      pendingData: mockProposalData
    };
    component.confirmCreation();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.INFO
      })
    );
    expect(mockProposalService.createProposalMock).toHaveBeenCalledWith(mockProposalData);
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.CONFIRMATION
      })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/proposal']);
  });

  it('Debe mostrar error si el servicio de creación falla', () => {
    mockProposalService.createProposalMock.mockReturnValue(
      throwError(() => new Error('Error'))
    );
    component.confirmState = {
      show: true,
      pendingData: mockProposalData
    };
    component.confirmCreation();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR,
        title: 'Error de servidor'
      })
    );
  });

  it('Debe regresar a la ubicación anterior al llamar a goBack', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });
});
