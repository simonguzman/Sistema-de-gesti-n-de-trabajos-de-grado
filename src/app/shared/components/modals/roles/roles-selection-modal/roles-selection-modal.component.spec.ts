/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { RolesSelectionModalComponent } from './roles-selection-modal.component';
import { UserRole, UserRoleType } from '../../../../../core/models/user-role';
import { SimpleChange } from '@angular/core';

describe('RolesSelectionModalComponent', () => {
  let component: RolesSelectionModalComponent;
  let fixture: ComponentFixture<RolesSelectionModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ RolesSelectionModalComponent ],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();
    fixture = TestBed.createComponent(RolesSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar editableRoles con todos los valores del Enum si la entrada es vacía', () => {
    component.roles = [];
    component.isOpen = true;

    // Simulamos el cambio manual del @Input para disparar ngOnChanges
    component.ngOnChanges({
      isOpen: new SimpleChange(false, true, true)
    });

    const enumCount = Object.values(UserRoleType).length;
    expect(component.editableRoles.length).toBe(enumCount);
    expect(component.editableRoles.every(r => !r.assigned)).toBe(true);
  });

  it('debería crear una copia profunda de los roles recibidos para no afectar al padre antes de guardar', () => {
    const mockRoles: UserRole[] = [
      { type: UserRoleType.ADMINISTRADOR, assigned: true }
    ];
    component.roles = mockRoles;
    component.isOpen = true;
    component.initializeRoles();

    // Cambiamos el rol en el componente de selección
    component.toggleRole(component.editableRoles[0]);

    expect(component.editableRoles[0].assigned).toBe(false);
    expect(mockRoles[0].assigned).toBe(true); // El original se mantiene intacto
  });

  it('debería cambiar el estado assigned al llamar a toggleRole', () => {
    const role: UserRole = { type: UserRoleType.ADMINISTRADOR, assigned: false };
    component.toggleRole(role);
    expect(role.assigned).toBe(true);
    component.toggleRole(role);
    expect(role.assigned).toBe(false);
  });

  it('debería emitir onSave con los cambios y cerrar el modal al guardar', () => {
    const onSaveSpy = jest.spyOn(component.onSave, 'emit');
    const isOpenChangeSpy = jest.spyOn(component.isOpenChange, 'emit');

    component.editableRoles = [
      { type: UserRoleType.ADMINISTRADOR, assigned: true }
    ];

    component.save();

    expect(onSaveSpy).toHaveBeenCalledWith(component.editableRoles);
    expect(isOpenChangeSpy).toHaveBeenCalledWith(false);
  });

  it('debería emitir isOpenChange(false) al llamar a close sin guardar nada', () => {
    const spy = jest.spyOn(component.isOpenChange, 'emit');
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
