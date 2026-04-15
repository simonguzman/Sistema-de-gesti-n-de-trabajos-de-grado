/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RolesModalComponent, UserRoleType } from './roles-modal.component';
import { ButtonComponent } from '../../button-component/button-component.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('RolesModalComponent', () => {
  let component: RolesModalComponent;
  let fixture: ComponentFixture<RolesModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ RolesModalComponent ],
      providers: [ provideNoopAnimations() ]
    })
    .compileComponents();

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

  it('debe cambiar a modo edición al presionar gestionar roles', () => {
    openModal();

    const button = fixture.debugElement.query(By.directive(ButtonComponent));
    button.triggerEventHandler('onClick', null);

    expect(component.isEditing).toBe(true);
  });

  it('debe cambiar estado de un rol en edición', () => {
    openModal();

    component.toggleMode(); // entrar edición

    const role = component.editableRoles.find(
      r => r.type === UserRoleType.ESTUDIANTE
    );

    expect(role).toBeTruthy();

    component.toggleRole(role!);

    expect(role!.assigned).toBe(true);
  });

  it('debe emitir roles al guardar', () => {
    const spy = jest.spyOn(component.onSave, 'emit');

    openModal();
    component.toggleMode();

    component.editableRoles[0].assigned = false;
    component.saveRoles();

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: UserRoleType.DIRECTOR })
      ])
    );
  });

  it('debe descartar cambios al salir del modo edición', () => {
    openModal();

    component.toggleMode(); // entrar edición

    const original = component.editableRoles[0].assigned;

    component.editableRoles[0].assigned = !original;

    component.toggleMode(); // cancelar

    expect(component.editableRoles[0].assigned).toBe(original);
  });

  it('debe emitir evento al cerrar modal', () => {
    const spy = jest.spyOn(component.onClose, 'emit');

    component.closeModal();

    expect(spy).toHaveBeenCalled();
  });

});
