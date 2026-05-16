/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ReviewPresentationsFacultyCouncilFormComponent } from './review-presentations-faculty-council-form.component';

import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

import { PreliminaryDraft } from '../../interfaces/preliminary-draft.interface';

import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';
import { IdentificationType, UserState } from '../../../users/interfaces/user.interface';
import { UserRoleType } from '../../../../core/models/user-role';
import { Modality } from '../../../proposal/interfaces/proposal.interface';

describe('ReviewPresentationsFacultyCouncilFormComponent', () => {

  let component: ReviewPresentationsFacultyCouncilFormComponent;
  let fixture: ComponentFixture<ReviewPresentationsFacultyCouncilFormComponent>;

  let userServiceMock: any;
  let notificationServiceMock: any;

  // Helper para crear el mock de la data de entrada
  const createMockDraft = (
    state = stateList.EN_REVISION
  ): PreliminaryDraft => {

    const mockUser = {
      id: 'dir-123',
      idType: IdentificationType.CC,
      idNumber: 1061,
      firstName: 'Nombre',
      lastName: 'Apellido',
      secondLastName: 'Segundo',
      codeNumber: 123,
      roles: [UserRoleType.DOCENTE],
      email: 'test@unicauca.edu.co',
      password: '123',
      state: UserState.active
    };

    return {
      preliminaryDraftId: 'draft-001',
      proposalId: 'prop-001',
      state,
      createdData: new Date('2026-05-14T12:00:00'),

      evaluations: [
        {
          id: 'eval-1',
          documentId: 'doc-001',
          evaluatorName: 'Evaluador 1',
          comments: 'Todo bien',
          veredict: stateList.APROBADO,
          signedDocuments: ['evaluacion-firmada.pdf']
        } as any
      ],

      documents: [
        {
          id: 'doc-001',
          name: 'anteproyecto.pdf',
          url: 'http://bucket.com/1.pdf',
          uploadDate: '2026-05-14T12:00:00',
          type: 'Anteproyecto',
          status: stateList.EN_REVISION
        },
        {
          id: 'doc-002',
          name: 'presentacion.pdf',
          url: 'http://bucket.com/2.pdf',
          uploadDate: '2026-05-15T12:00:00',
          type: 'Formato',
          status: stateList.EN_REVISION
        }
      ],

      proposalData: {
        id: 'prop-001',
        title: 'Sistema de Gestión de Trabajos de Grado',
        description: 'Descripción del sistema',
        modality: Modality.TI,
        authors: ['estudiante-1'],
        director: mockUser,
        state: stateList.EN_REVISION,
        createdAt: new Date(),
        documents: [],
        evaluations: [
          {
            id: 'proposal-eval-1',
            evaluatorName: 'Docente',
            veredict: stateList.APROBADO,
            signedDocuments: ['propuesta-firmada.pdf']
          } as any
        ]
      }
    };
  };

  beforeEach(async () => {
    userServiceMock = {
      getAuthorsNames: jest.fn().mockReturnValue('Juan Perez'),
      getUserFullName: jest.fn().mockReturnValue('Director Ejemplo')
    };

    notificationServiceMock = {
      show: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ReviewPresentationsFacultyCouncilFormComponent,
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: UserService, useValue: userServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewPresentationsFacultyCouncilFormComponent);
    component = fixture.componentInstance;

    // Inicialización del Input obligatorio
    fixture.componentRef.setInput('preliminaryDraft', createMockDraft());
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Computed y Getters', () => {

    it('debería calcular isReadOnly como true cuando el estado es APROBADO', () => {
      fixture.componentRef.setInput(
        'preliminaryDraft',
        createMockDraft(stateList.APROBADO)
      );
      fixture.detectChanges();

      // Al cambiar a getter, se accede sin paréntesis ()
      expect(component.isReadOnly).toBe(true);
    });

    it('debería calcular isReadOnly como false cuando el estado NO es APROBADO', () => {
      fixture.componentRef.setInput(
        'preliminaryDraft',
        createMockDraft(stateList.EN_REVISION)
      );
      fixture.detectChanges();

      expect(component.isReadOnly).toBe(false);
    });

    it('debería retornar el documento firmado aprobado más reciente', () => {
      const doc = component.signedProposalDocument;
      expect(doc).toBeDefined();
      expect(doc?.name).toBe('propuesta-firmada.pdf');
    });

    it('debería retornar undefined en signedProposalDocument si no hay evaluaciones', () => {
      const draft = createMockDraft();
      draft.proposalData.evaluations = [];
      fixture.componentRef.setInput('preliminaryDraft', draft);
      fixture.detectChanges();

      expect(component.signedProposalDocument).toBeUndefined();
    });

    it('debería retornar el documento de anteproyecto', () => {
      const doc = component.approvedPreliminaryDraftDocument;
      expect(doc?.type).toBe('Anteproyecto');
    });

    it('debería retornar el documento de presentación (tipo Formato)', () => {
      const doc = component.presentationDocument;
      expect(doc?.type).toBe('Formato');
    });

    it('debería formatear correctamente la fecha de carga del documento', () => {
      const date = component.documentUploadDate;
      expect(date).toContain('2026');
    });

    it('debería manejar fecha no disponible si no hay documentos', () => {
      const draft = createMockDraft();
      draft.documents = [];
      fixture.componentRef.setInput('preliminaryDraft', draft);
      fixture.detectChanges();

      expect(component.documentUploadDate).toBe('No disponible');
    });
  });

  describe('Validaciones de Formulario', () => {
    it('debería detectar campo inválido si está vacío y fue tocado', () => {
      const control = component.evaluationForm.get('result');
      control?.markAsTouched();
      control?.setValue('');
      expect(component.isFieldInvalid('result')).toBe(true);
    });
  });

  describe('Manejo de Archivos', () => {
    it('debería actualizar el signal de archivo y cerrar el modal', () => {
      const mockFile = new File(['blob'], 'test.pdf');
      component.handleFileUploaded({ fileName: 'test.pdf', file: mockFile });

      expect(component.uploadedSignedFile()).toEqual({
        fileName: 'test.pdf',
        file: mockFile
      });
      expect(component.isUploadModalOpen()).toBe(false);
    });
  });

  describe('Submit', () => {
    it('debería mostrar notificación de error si falta el archivo', () => {
      component.evaluationForm.patchValue({
        result: stateList.APROBADO,
        comments: 'OK'
      });

      component.submit();

      expect(notificationServiceMock.show).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Es obligatorio adjuntar el documento de evaluación firmado.',
          type: NotificationType.ERROR
        })
      );
    });

    it('debería emitir onSaveEvaluation cuando todo es válido', () => {
      const emitSpy = jest.spyOn(component.onSaveEvaluation, 'emit');
      const mockFile = new File(['content'], 'signed.pdf');

      component.evaluationForm.patchValue({
        result: stateList.APROBADO,
        comments: 'Buen trabajo'
      });
      component.uploadedSignedFile.set({ fileName: 'signed.pdf', file: mockFile });

      component.submit();

      expect(emitSpy).toHaveBeenCalledWith({
        formValues: component.evaluationForm.value,
        file: mockFile
      });
    });
  });
});
