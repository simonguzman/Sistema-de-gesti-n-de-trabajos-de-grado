/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';

import { ProposalFormComponent } from './proposal-form.component';
import { UserRoleType } from '../../../../core/models/user-role';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ProposalService } from '../../services/proposal.service';
import { UserService } from '../../../users/services/user.service';

describe('ProposalFormComponent', () => {
  let component: ProposalFormComponent;
  let fixture: ComponentFixture<ProposalFormComponent>;
  let mockNotificationService: any;
  let mockProposalService: any;
  let mockUserService: any;

  const mockStudents = [
    { id: '1', firstName: 'Estudiante', lastName: 'Uno', roles: [UserRoleType.ESTUDIANTE] },
    { id: '2', firstName: 'Estudiante', lastName: 'Dos', roles: [UserRoleType.ESTUDIANTE] }
  ];

  beforeEach(async () => {
    mockNotificationService = { show: jest.fn() };
    mockProposalService = { proposals: signal([]) };
    mockUserService = {
      students: signal(mockStudents),
      teachers: signal([]),
      advisors: signal([]),
      users: signal([]),
      currentUser: signal({ id: 'dir-01' }),
      login: jest.fn(),
      addRoleToUser: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProposalFormComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ProposalService, useValue: mockProposalService },
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe inicializar el formulario vacío por defecto', () => {
    expect(component.proposalForm.get('title')?.value).toBeNull();
    expect(component.isEditMode).toBe(false);
  });

  it('Debe activar la validación requerida del asesor solo cuando la modalidad es "Practica profesional"', () => {
    const modalityControl = component.proposalForm.get('modality');
    const advisorControl = component.proposalForm.get('advisor');

    modalityControl?.setValue('Practica profesional');
    expect(advisorControl?.errors?.['required']).toBeTruthy();

    modalityControl?.setValue('Trabajo de investigacion');
    expect(advisorControl?.errors).toBeNull();
  });

  it('Debe filtrar al Estudiante 2 para que no sea el mismo que el Estudiante 1', () => {
    component.proposalForm.get('student1')?.setValue('1');
    fixture.detectChanges();

    // Accedemos mediante (component as any) porque la propiedad es protected
    const filtered = (component as any).filteredStudentsForS2();

    // Cambiamos .any por .some (JavaScript estándar)
    const existsStudent1 = filtered.some((s: any) => s.id === '1');

    expect(existsStudent1).toBe(false);
    expect(filtered.length).toBe(1);
  });

  it('Debe mostrar error de notificación si el formulario es inválido al hacer submit', () => {
    component.submit();
    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Formulario incorrecto'
    }));
  });

  it('Debe emitir la propuesta correctamente cuando los datos son válidos', () => {
    const emitSpy = jest.spyOn(component.onSubmit, 'emit');

    component.proposalForm.patchValue({
      title: 'Proyecto de Prueba',
      description: 'Descripción larga',
      modality: 'Trabajo de investigacion',
      student1: '1'
    });

    component.attachedFile = { hasFile: true, name: 'propuesta.pdf' };

    component.submit();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.mock.calls[0][0];

    // Agregamos una aserción para asegurar que emittedValue existe ante TypeScript
    expect(emittedValue).toBeDefined();
    if (emittedValue) {
      expect(emittedValue.title).toBe('Proyecto de Prueba');
      expect(emittedValue.authors).toContain('1');
    }
  });

  it('Debe añadir el rol de CODIRECTOR si se selecciona uno en el formulario', () => {
    component.proposalForm.patchValue({
      title: 'Proyecto con Codirector',
      description: 'Desc',
      modality: 'Trabajo de investigacion',
      student1: '1',
      codirector: 'teacher-45'
    });
    component.attachedFile = { hasFile: true, name: 'doc.pdf' };

    component.submit();

    expect(mockUserService.addRoleToUser).toHaveBeenCalledWith('teacher-45', UserRoleType.CODIRECTOR);
  });

  it('Debe cargar los datos en el formulario cuando se recibe una propuesta por input (Modo Edición)', () => {
    const existingProposal: any = {
      id: 'prop-123',
      title: 'Propuesta Existente',
      description: 'Bla bla',
      modality: 'Trabajo de investigacion',
      authors: ['1', '2'],
      documents: [{ name: 'archivo_antiguo.pdf' }],
      state: 'EN_REVISION'
    };

    fixture.componentRef.setInput('proposal', existingProposal);
    fixture.detectChanges();

    expect(component.isEditMode).toBe(true);
    expect(component.proposalForm.get('title')?.value).toBe('Propuesta Existente');
    expect(component.attachedFile.name).toBe('archivo_antiguo.pdf');
  });
});
