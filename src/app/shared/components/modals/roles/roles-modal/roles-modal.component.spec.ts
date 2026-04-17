/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { RolesModalComponent } from './roles-modal.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ButtonComponent } from '../../../button-component/button-component.component';
import { UserRoleType } from '../../../../../core/models/user-role';
import { RolesSelectionModalComponent } from '../roles-selection-modal/roles-selection-modal.component';
import { RolesViewModalComponent } from '../roles-view-modal/roles-view-modal.component';

describe('RolesModalComponent', () => {
  let component: RolesModalComponent;
  let fixture: ComponentFixture<RolesModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ RolesModalComponent, RolesSelectionModalComponent, RolesViewModalComponent ],
      providers: [ provideNoopAnimations() ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const mockRoles = [
    { type: UserRoleType.DIRECTOR, assigned: true },
    { type: UserRoleType.ESTUDIANTE, assigned: false }
  ];

  it('debería iniciar en modo vista (isEditing = false)', () => {
    expect(component.isEditing).toBe(false);
    const viewModal = fixture.debugElement.query(By.directive(RolesViewModalComponent));
    expect(viewModal).toBeTruthy();
  });

  it('debería cambiar a modo edición cuando el hijo emite onManage', () => {
    // 1. Aseguramos que estamos en vista
    component.isEditing = false;
    fixture.detectChanges();

    // 2. Obtenemos el componente hijo de vista
    const viewModal = fixture.debugElement.query(By.directive(RolesViewModalComponent));

    // 3. Simulamos que el usuario dio clic en "Gestionar" dentro del hijo
    viewModal.componentInstance.onManage.emit();
    fixture.detectChanges();

    expect(component.isEditing).toBe(true);

    // 4. Verificamos que ahora se renderice el selector
    const selectionModal = fixture.debugElement.query(By.directive(RolesSelectionModalComponent));
    expect(selectionModal).toBeTruthy();
  });

  it('debería emitir onSave y cerrar todo al guardar en el hijo de selección', () => {
    const spySave = jest.spyOn(component.onSave, 'emit');
    const spyOpen = jest.spyOn(component.isOpenChange, 'emit');

    component.isEditing = true;
    fixture.detectChanges();

    const selectionModal = fixture.debugElement.query(By.directive(RolesSelectionModalComponent));

    // El hijo emite los roles actualizados
    selectionModal.componentInstance.onSave.emit(mockRoles);

    expect(spySave).toHaveBeenCalledWith(mockRoles);
    expect(component.isEditing).toBe(false);
    expect(spyOpen).toHaveBeenCalledWith(false);
  });

  it('debería cerrar y resetear estado al llamar a closeAll', () => {
    const spyOpen = jest.spyOn(component.isOpenChange, 'emit');
    component.isEditing = true;

    component.closeAll();

    expect(component.isEditing).toBe(false);
    expect(spyOpen).toHaveBeenCalledWith(false);
  });

  it('debería pasar los roles y el nombre de usuario al hijo de vista', () => {
    component.username = 'Simón';
    component.roles = mockRoles;
    component.isEditing = false;
    fixture.detectChanges();

    const viewModal = fixture.debugElement.query(By.directive(RolesViewModalComponent)).componentInstance;

    expect(viewModal.username).toBe('Simón');
    expect(viewModal.roles).toEqual(mockRoles);
  });

});
