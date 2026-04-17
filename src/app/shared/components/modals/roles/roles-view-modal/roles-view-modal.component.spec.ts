/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';


import { RolesViewModalComponent } from './roles-view-modal.component';
import { UserRoleType } from '../../../../../core/models/user-role';
import { ButtonComponent } from '../../../button-component/button-component.component';

describe('RolesViewModalComponent', () => {
  let component: RolesViewModalComponent;
  let fixture: ComponentFixture<RolesViewModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ RolesViewModalComponent ],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();
    fixture = TestBed.createComponent(RolesViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería filtrar solo los roles con assigned: true en activeRoles', () => {
    component.roles = [
      { type: UserRoleType.ADMINISTRADOR, assigned: true },
      { type: UserRoleType.DIRECTOR, assigned: false }
    ];

    expect(component.activeRoles.length).toBe(1);
    expect(component.activeRoles[0].type).toBe(UserRoleType.ADMINISTRADOR);
  });

  it('debería disparar onManage al presionar el botón de Gestionar', () => {
    const spy = jest.spyOn(component.onManage, 'emit');
    component.isOpen = true;
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.directive(ButtonComponent));
    expect(button).not.toBeNull();
    button.componentInstance.onClick.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('debería emitir isOpenChange al cerrar', () => {
    const spy = jest.spyOn(component.isOpenChange, 'emit');
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
