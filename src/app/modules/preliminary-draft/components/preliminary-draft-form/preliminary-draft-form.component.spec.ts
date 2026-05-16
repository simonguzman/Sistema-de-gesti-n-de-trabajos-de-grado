/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';

import { PreliminaryDraftFormComponent } from './preliminary-draft-form.component';
import { stateList } from '../../../../core/enums/state.enum';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ProposalService } from '../../../proposal/services/proposal.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

describe('PreliminaryDraftFormComponent', () => {
  let component: PreliminaryDraftFormComponent;
  let fixture: ComponentFixture<PreliminaryDraftFormComponent>;

  // Mocks de servicios
  let notificationServiceMock: any;
  let proposalServiceMock: any;
  let userServiceMock: any;
  let authServiceMock: any;
  let preliminaryDraftServiceMock: any;

  const mockUser = { id: 'user-1', firstName: 'Juan', lastName: 'Perez' };

  const mockProposal = {
    id: 'prop-1',
    title: 'Propuesta de Prueba',
    description: 'Descripción',
    state: stateList.APROBADO,
    director: { id: 'user-1' },
    evaluations: []
  };

  beforeEach(async () => {
    notificationServiceMock = { show: jest.fn() };
    // Importante: proposalService.proposals debe ser un signal o función que devuelva un array
    proposalServiceMock = { proposals: signal([mockProposal]) };
    userServiceMock = { getAuthorsNames: jest.fn().mockReturnValue('Autor Test') };
    authServiceMock = { currentUser: signal(mockUser) };
    preliminaryDraftServiceMock = { preliminaryDrafts: signal([]) };

    await TestBed.configureTestingModule({
      imports: [PreliminaryDraftFormComponent, ReactiveFormsModule],
      providers: [
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PreliminaryDraftService, useValue: preliminaryDraftServiceMock },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PreliminaryDraftFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Lógica de Inicialización y Filtros', () => {
    it('debería filtrar las propuestas disponibles para el director actual', () => {
      const proposals = component['availableProposals']();
      expect(proposals.length).toBe(1);
      expect(proposals[0].id).toBe('prop-1');
    });

    it('debería deshabilitar título y descripción en modo creación', () => {
      expect(component.form.get('title')?.disabled).toBe(true);
      expect(component.form.get('description')?.disabled).toBe(true);
    });

    it('debería inicializar en modo edición si hay un anteproyecto previo', () => {
      const mockDraft: any = {
        proposalId: 'prop-1',
        proposalData: { title: 'Editado', description: 'Desc Editada' },
        documents: [{ name: 'file.pdf', type: 'Anteproyecto' }],
        state: stateList.EN_REVISION
      };

      // Usamos setInput para señales de entrada
      fixture.componentRef.setInput('preliminaryDraft', mockDraft);
      component.ngOnInit(); // Forzamos reinicialización

      expect(component.isEditMode).toBe(true);
      expect(component.form.get('title')?.value).toBe('Editado');
      expect(component.attachmentState().name).toBe('file.pdf');
    });
  });

  describe('Manejo de Archivos', () => {
    it('debería actualizar el estado al cargar un archivo', () => {
      const mockFile = new File([''], 'nuevo-ante.pdf');
      component.handleFileUploaded({ fileName: 'nuevo-ante.pdf', file: mockFile });

      expect(component.attachmentState().hasFile).toBe(true);
      expect(component.attachmentState().name).toBe('nuevo-ante.pdf');
      expect(component.form.get('document')?.value).toBe(mockFile);
    });

    it('debería limpiar el estado al remover el archivo', () => {
      component.removeFile();
      expect(component.attachmentState().hasFile).toBe(false);
      expect(component.form.get('document')?.value).toBeNull();
    });
  });

  describe('Submit', () => {
    it('debería mostrar notificación de error si el formulario es inválido', () => {
      component.form.patchValue({ proposalId: '' });
      component.submit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR,
        title: 'Datos incompletos'
      }));
    });

    it('debería emitir onSave con los datos correctos si el formulario es válido', () => {
      const saveSpy = jest.spyOn(component.onSave, 'emit');
      const mockFile = new File([''], 'ante.pdf');

      // Seleccionamos la propuesta
      component.form.patchValue({ proposalId: 'prop-1' });
      component.selectedProposalId.set('prop-1');

      // Cargamos archivo
      component.handleFileUploaded({ fileName: 'ante.pdf', file: mockFile });

      component.submit();

      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        proposalId: 'prop-1',
        state: stateList.EN_REVISION
      }));
    });
  });

  describe('Helpers de Visualización', () => {
    it('debería resolver el nombre del miembro correctamente', () => {
      const user: any = { firstName: 'Simón', lastName: 'Bolívar' };
      const name = component.getMemberName(user);
      expect(name).toBe('Simón Bolívar');
    });

    it('debería retornar "No asignado" si el usuario es undefined', () => {
      expect(component.getMemberName(undefined)).toBe('No asignado');
    });
  });
});
