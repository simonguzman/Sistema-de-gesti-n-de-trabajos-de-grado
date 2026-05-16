import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreliminaryDraftPageComponent } from './preliminary-draft-page.component';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal, Component, Input, Output, EventEmitter } from '@angular/core';

// Componentes Reales (Necesarios para el override)
import { TableComponent } from '../../../../shared/components/table-component/table-component.component';
import { ConfirmationActionModalComponent } from "../../../../shared/components/modals/confirmation-action-modal/confirmation-action-modal.component";
import { DescriptionModalComponent } from "../../../../shared/components/modals/description-modal/description-modal.component";

// Interfaces y Enums
import { UserRoleType } from '../../../../core/models/user-role';
import { stateList } from '../../../../core/enums/state.enum';
import { NotificationType } from '../../../../shared/components/notifications/models/notification.model';

// Servicios
import { PreliminaryDraftService } from '../../services/preliminary-draft.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../shared/components/notifications/services/notification.service';

// --- MOCKS DE COMPONENTES ---
@Component({
  selector: 'app-table-component',
  template: '',
  standalone: true
})
class MockTable {
  @Input() columns: any;
  @Input() data: any;
  @Input() headerButtons: any;
  @Output() action = new EventEmitter<any>();
  @Output() headerButtonClicked = new EventEmitter<any>();
}

@Component({
  selector: 'app-confirmation-action-modal',
  template: '',
  standalone: true
})
class MockConfirmModal {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() isProcessing: boolean = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

@Component({
  selector: 'app-description-modal',
  template: '',
  standalone: true
})
class MockDescModal {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() content: string = '';
  @Output() close = new EventEmitter<void>();
}

describe('PreliminaryDraftPageComponent', () => {
  let component: PreliminaryDraftPageComponent;
  let fixture: ComponentFixture<PreliminaryDraftPageComponent>;

  // Mocks de Servicios
  let routerMock: any;
  let preliminaryDraftServiceMock: any;
  let authServiceMock: any;
  let notificationServiceMock: any;

  const mockDrafts: any[] = [
    {
      preliminaryDraftId: '1',
      state: stateList.APLAZADO,
      proposalData: {
        title: 'Anteproyecto de Investigación',
        description: 'Descripción detallada',
        modality: 'Investigación',
        director: { id: 'dir-123' },
        authors: ['student-1']
      },
      evaluators: []
    },
    {
      preliminaryDraftId: '2',
      state: stateList.APROBADO,
      proposalData: { title: 'Anteproyecto Finalizado' },
      director: { id: 'dir-123' }
    }
  ];

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    notificationServiceMock = { show: jest.fn() };

    preliminaryDraftServiceMock = {
      preliminaryDrafts: signal(mockDrafts),
      deleteDraftMock: jest.fn().mockReturnValue(of({}))
    };

    authServiceMock = {
      currentUser: signal({ id: 'student-1' }),
      hasAnyRole: jest.fn().mockReturnValue(false)
    };

    await TestBed.configureTestingModule({
      imports: [PreliminaryDraftPageComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PreliminaryDraftService, useValue: preliminaryDraftServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    })
    .overrideComponent(PreliminaryDraftPageComponent, {
      remove: {
        imports: [
          TableComponent,
          ConfirmationActionModalComponent,
          DescriptionModalComponent
        ]
      },
      add: { imports: [MockTable, MockConfirmModal, MockDescModal] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreliminaryDraftPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería filtrar los botones del encabezado según el rol', () => {
    authServiceMock.hasAnyRole.mockReturnValue(false);
    // Acceso a método privado para re-inicializar botones en el test
    (component as any).initHeaderButtons();

    expect(component['headerButtons'].length).toBe(1);
    expect(component['headerButtons'][0].label).toBe('Formatos descargables');
  });

  describe('Lógica de tableData (Permisos)', () => {
    it('un Estudiante Autor debería poder ver el proyecto pero no editarlo', () => {
      authServiceMock.currentUser.set({ id: 'student-1' });
      const data = (component as any).tableData();
      const actions = data[0].allowedActions;

      expect(actions).toContain('ver');
      expect(actions).not.toContain('editar');
      expect(actions).not.toContain('eliminar');
    });

    it('un Director debería poder editar y eliminar si el estado es PENDIENTE', () => {
      authServiceMock.currentUser.set({ id: 'dir-123' });
      const data = (component as any).tableData();
      const actions = data[0].allowedActions;

      expect(actions).toContain('editar');
      expect(actions).toContain('eliminar');
    });

    it('nadie debería poder editar o eliminar si el proyecto ya está APROBADO', () => {
      authServiceMock.currentUser.set({ id: 'dir-123' });
      authServiceMock.hasAnyRole.mockReturnValue(true); // Simulando Admin

      const data = (component as any).tableData();
      const actions = data[1].allowedActions; // El segundo mock está APROBADO

      expect(actions).not.toContain('editar');
      expect(actions).not.toContain('eliminar');
    });
  });

  describe('Acciones de Tabla', () => {
    it('debería abrir el modal de descripción con el contenido correcto', () => {
      const event = {
        action: 'ver descripción',
        row: { description: 'Contenido de prueba', allowedActions: ['ver descripción'] }
      };
      component.handleTableAction(event);

      expect(component.descriptionModal().isOpen).toBe(true);
      expect(component.descriptionModal().content).toBe('Contenido de prueba');
    });

    it('debería navegar a la edición si el usuario tiene permiso', () => {
      const event = {
        action: 'editar',
        row: { id: '1', allowedActions: ['editar'] }
      };
      component.handleTableAction(event);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/preliminary-draft/edit', '1']);
    });
  });

  describe('Eliminación de Registro', () => {
    it('debería llamar al servicio de eliminación y mostrar éxito', () => {
      component.deleteState.set({
        isOpen: true,
        draftId: '1',
        draftTitle: 'Test',
        isProcessing: false
      });

      component.confirmDelete();

      expect(preliminaryDraftServiceMock.deleteDraftMock).toHaveBeenCalledWith('1');
      expect(notificationServiceMock.show).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.CONFIRMATION
      }));
    });
  });
});
