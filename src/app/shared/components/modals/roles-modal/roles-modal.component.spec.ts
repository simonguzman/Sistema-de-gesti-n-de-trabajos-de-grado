import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RolesModalComponent, UserRoleType } from './roles-modal.component';
import { ButtonComponent } from '../../button-component/button-component.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('RolesModalComponent', () => {
  let component: RolesModalComponent;
  let fixture: ComponentFixture<RolesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesModalComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(RolesModalComponent);
    component = fixture.componentInstance;
  });

  const mockRoles = [
    { type: UserRoleType.DIRECTOR, assigned: true },
    { type: UserRoleType.ESTUDIANTE, assigned: false }
  ];

  function openModal() {
    component.roles = mockRoles;
    component.isOpen = true;

    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true
      }
    } as any);

    fixture.detectChanges();
  }

  it('debe renderizar roles asignados correctamente', () => {
    openModal();
    expect(fixture.nativeElement.textContent).toContain('Director');
  });

  it('debe mostrar solo roles asignados en modo vista', () => {
    openModal();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Director');
    expect(text).not.toContain('Estudiante');
  });

  it('debe entrar en modo edición al presionar gestionar roles', () => {
    openModal();
    const button = fixture.debugElement.query(By.directive(ButtonComponent));
    button.triggerEventHandler('onClick', null);
    expect(component.isEditing).toBe(true);
  });

  it('debe cambiar estado de un rol en edición', () => {
    openModal();
    component.startEdit();
    const role = component.draftRoles.find(
      r => r.type === UserRoleType.ESTUDIANTE
    );
    expect(role).toBeTruthy();
    component.toggleRole(role!);
    expect(role!.assigned).toBe(true);
  });

  it('debe emitir roles al guardar', () => {
    const spy = jest.spyOn(component.onSave, 'emit');
    openModal();
    component.startEdit();
    component.draftRoles[0].assigned = false;
    component.saveRoles();
    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: UserRoleType.DIRECTOR })
      ])
    );
  });

  it('debe descartar cambios al cancelar edición', () => {
    openModal();
    component.startEdit();
    const original = component.draftRoles[0].assigned;
    component.draftRoles[0].assigned = !original;
    component.cancelEdit();
    expect(component.draftRoles[0].assigned).toBe(original);
  });

  it('debe emitir evento al cerrar modal', () => {
    const spy = jest.spyOn(component.onClose, 'emit');
    component.closeModal();
    expect(spy).toHaveBeenCalled();
  });
});
