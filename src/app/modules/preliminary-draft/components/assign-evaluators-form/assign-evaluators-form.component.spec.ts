/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignEvaluatorsFormComponent } from './assign-evaluators-form.component';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { UserRoleType } from '../../../../core/models/user-role';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../users/services/user.service';
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';

describe('AssignEvaluatorsFormComponent', () => {
  let component: AssignEvaluatorsFormComponent;
  let fixture: ComponentFixture<AssignEvaluatorsFormComponent>;

  // Mocks
  let userServiceMock: any;
  let preliminaryDraftServiceMock: any;
  let notificationServiceMock: any;

  const mockUsers = [
    { id: '1', firstName: 'Docente', lastName: 'Uno', roles: [UserRoleType.DOCENTE] },
    { id: '2', firstName: 'Docente', lastName: 'Dos', roles: [UserRoleType.DOCENTE] },
    { id: '3', firstName: 'Director', lastName: 'X', roles: [UserRoleType.DOCENTE] },
    { id: '4', firstName: 'Jefe', lastName: 'Y', roles: [UserRoleType.JEFE_DEP] },
  ];

  const mockDraft = {
    preliminaryDraftId: 'd-1',
    proposalData: {
      id: 'p-1',
      director: { id: '3' }, // El ID 3 no debe estar disponible
      authors: ['auth-1'],
      codirector: null,
      advisor: null
    }
  };

  beforeEach(async () => {
    userServiceMock = {
      users: signal(mockUsers),
      getAuthorsNames: jest.fn().mockReturnValue('Autor Prueba')
    };

    preliminaryDraftServiceMock = {
      validateReviewersRules: jest.fn().mockReturnValue(null)
    };

    notificationServiceMock = {
      show: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AssignEvaluatorsFormComponent, ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: PreliminaryDraftService, useValue: preliminaryDraftServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        FormBuilder,
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssignEvaluatorsFormComponent);
    component = fixture.componentInstance;

    // Seteamos el input requerido
    fixture.componentRef.setInput('preliminaryDraft', mockDraft);
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Lógica de Filtrado de Evaluadores', () => {
    it('debería filtrar usuarios que son participantes (Director) o tienen roles de conflicto (Jefe)', () => {
      const available = component.availableEvaluators();

      // Debe contener a Docente Uno y Dos (ID 1 y 2)
      // NO debe contener al ID 3 (Director) ni al ID 4 (Jefe Depto)
      expect(available.length).toBe(2);
      expect(available.find(u => u.id === '3')).toBeUndefined();
      expect(available.find(u => u.id === '4')).toBeUndefined();
    });

    it('debería excluir al Evaluador 1 de la lista del Evaluador 2', () => {
      // Simulamos selección del primer evaluador
      component.form.get('evaluator1')?.setValue('1');
      fixture.detectChanges();

      const filteredE2 = component['filteredEvaluatorsForE2']();
      expect(filteredE2.find(u => u.id === '1')).toBeUndefined();
      expect(filteredE2.find(u => u.id === '2')).toBeTruthy();
    });

    it('debería resetear Evaluador 2 si se selecciona el mismo en Evaluador 1', () => {
      component.form.get('evaluator2')?.setValue('1');
      component.form.get('evaluator1')?.setValue('1'); // Cambiamos E1 al mismo valor

      expect(component.form.get('evaluator2')?.value).toBe('');
    });
  });

  describe('Submit y Validaciones', () => {
    it('debería mostrar error si el formulario es inválido', () => {
      component.form.patchValue({ evaluator1: '', evaluator2: '' });
      component.submit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.ERROR,
        title: 'Formulario incompleto'
      }));
    });

    it('debería mostrar error si falla la validación de reglas del servicio', () => {
      // Simulamos que el servicio devuelve un mensaje de error
      preliminaryDraftServiceMock.validateReviewersRules.mockReturnValue('Error de negocio');

      component.form.patchValue({ evaluator1: '1', evaluator2: '2' });
      component.submit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error de negocio',
        type: NotificationType.ERROR
      }));
    });

    it('debería emitir onSave cuando la asignación es válida', () => {
      const emitSpy = jest.spyOn(component.onSave, 'emit');

      component.form.patchValue({ evaluator1: '1', evaluator2: '2' });
      component.submit();

      expect(emitSpy).toHaveBeenCalledWith({ ev1: '1', ev2: '2' });
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.CONFIRMATION
      }));
    });
  });

  describe('Helpers de UI', () => {
    it('debería formatear correctamente el nombre completo del usuario', () => {
      const user: any = { firstName: 'Juan', secondName: 'Camilo', lastName: 'Perez', secondLastName: 'Gomez' };
      expect(component.getMemberFullName(user)).toBe('Juan Camilo Perez Gomez');
    });

    it('debería manejar usuarios con nombres incompletos', () => {
      const user: any = { firstName: 'Juan', lastName: 'Perez' };
      expect(component.getMemberFullName(user)).toBe('Juan Perez');
    });

    it('debería validar correctamente si un campo es inválido', () => {
      const control = component.form.get('evaluator1');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.isFieldInvalid('evaluator1')).toBe(true);
    });
  });
});
