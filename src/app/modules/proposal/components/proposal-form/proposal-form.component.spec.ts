import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProposalFormComponent } from './proposal-form.component';
import { UserRoleType } from '../../../../core/models/user-role';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';
import { ProposalService } from '../../services/proposal.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

describe('ProposalFormComponent', () => {
  let component: ProposalFormComponent;
  let fixture: ComponentFixture<ProposalFormComponent>;
  let mockNotificationService: any;
  let mockProposalService: any;
  let mockUserService: any;
  let mockAuthService: any;

  const mockStudents = [
    { id: '1', firstName: 'Estudiante', lastName: 'Uno', roles: [UserRoleType.ESTUDIANTE] },
    { id: '2', firstName: 'Estudiante', lastName: 'Dos', roles: [UserRoleType.ESTUDIANTE] }
  ];

  beforeEach(async () => {
    mockNotificationService = { show: jest.fn() };
    mockProposalService = { proposals: signal([]) };

    // Mock para AuthService para evitar que el submit se aborte por falta de sesión
    mockAuthService = {
      currentUser: signal({ id: 'dir-01', name: 'Director de Prueba' })
    };

    mockUserService = {
      students: signal(mockStudents),
      teachers: signal([{ id: 'teacher-45', firstName: 'Profesor', lastName: 'Asignado' }]),
      advisors: signal([]),
      addRoleToUser: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProposalFormComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ProposalService, useValue: mockProposalService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe inicializar el formulario con valores vacíos por defecto', () => {
    const titleValue = component.proposalForm.get('title')?.value;
    // Verificamos que sea falsy (null o cadena vacía) según la inicialización
    expect(titleValue === null || titleValue === '').toBe(true);
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

    // Acceso a propiedad protected para validación
    const filtered = (component as any).filteredStudentsForS2();
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
      description: 'Descripción obligatoria para validez',
      modality: 'Trabajo de investigacion',
      student1: '1'
    });

    // Simulamos carga de archivo
    component.attachedFile = { hasFile: true, name: 'propuesta.pdf' };
    component.proposalForm.get('document')?.setValue(new File([], 'propuesta.pdf'));

    fixture.detectChanges();
    component.submit();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.mock.calls[0][0];
    expect(emittedValue?.title).toBe('Proyecto de Prueba');
  });

  it('Debe añadir el rol de CODIRECTOR si se selecciona uno en el formulario', () => {
    component.proposalForm.patchValue({
      title: 'Proyecto con Codirector',
      description: 'Descripción obligatoria',
      modality: 'Trabajo de investigacion',
      student1: '1',
      codirector: 'teacher-45'
    });

    component.attachedFile = { hasFile: true, name: 'doc.pdf' };
    component.proposalForm.get('document')?.setValue(new File([], 'doc.pdf'));

    fixture.detectChanges();
    component.submit();

    expect(mockUserService.addRoleToUser).toHaveBeenCalledWith('teacher-45', UserRoleType.CODIRECTOR);
  });

  it('Debe cargar los datos en el formulario cuando se recibe una propuesta por input (Modo Edición)', () => {
    const existingProposal: any = {
      id: 'prop-123',
      title: 'Propuesta Existente',
      description: 'Detalle de la propuesta',
      modality: 'Trabajo de investigacion',
      authors: ['1', '2'],
      documents: [{ name: 'archivo_antiguo.pdf' }],
      state: 'EN_REVISION',
      createdAt: new Date(),
      evaluations: []
    };

    fixture.componentRef.setInput('proposal', existingProposal);
    fixture.detectChanges();

    expect(component.isEditMode).toBe(true);
    expect(component.proposalForm.get('title')?.value).toBe('Propuesta Existente');
    expect(component.attachedFile.name).toBe('archivo_antiguo.pdf');
  });
});
