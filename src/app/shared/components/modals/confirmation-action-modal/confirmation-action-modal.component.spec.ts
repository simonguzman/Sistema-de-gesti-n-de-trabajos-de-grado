/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { ConfirmationActionModalComponent } from './confirmation-action-modal.component';
import { ButtonComponent } from '../../button-component/button-component.component';

describe('ConfirmationActionModalComponent', () => {
  let component: ConfirmationActionModalComponent;
  let fixture: ComponentFixture<ConfirmationActionModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ ConfirmationActionModalComponent ],
      providers: [ provideNoopAnimations() ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationActionModalComponent)
    component = fixture.componentInstance;
  });

  it('El modal se renderiza correctamente', () => {
    component.description = 'Descripción';
    component.isOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Descripción');
  });

  it('El modal permite cancelar la acción', () => {
    const cancelSpy = jest.spyOn(component.onClose, 'emit');
    component.isOpen = true;
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.directive(ButtonComponent));
    const cancelButton = buttons.find(btn =>btn.componentInstance.label === 'Cancelar');
    cancelButton?.triggerEventHandler('onClick', null);
    expect(cancelSpy).toHaveBeenCalled();
  })

  it('El modal permite aceptar la acción', () => {
    const confirmSpy = jest.spyOn(component.onConfirm, 'emit');
    const closeSpy = jest.spyOn(component.onClose, 'emit');
    fixture.detectChanges();
    component.confirmAction();
    expect(confirmSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  })

  it('confirmAction debe emitir confirm y cerrar', () => {
    const confirmSpy = jest.spyOn(component.onConfirm, 'emit');
    const closeSpy = jest.spyOn(component.onClose, 'emit');

    component.confirmAction();

    expect(confirmSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
