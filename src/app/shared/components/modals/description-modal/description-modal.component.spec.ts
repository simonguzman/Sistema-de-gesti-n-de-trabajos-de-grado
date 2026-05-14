import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptionModalComponent } from './description-modal.component';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('DescriptionModalComponent', () => {
  let component: DescriptionModalComponent;
  let fixture: ComponentFixture<DescriptionModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ DescriptionModalComponent ],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescriptionModalComponent);
    component = fixture.componentInstance;
  });

  it('El modal se renderiza correctamente', () => {
    component.titleDescription = 'Modal';
    component.description = 'Descripción';
    component.isOpen = true;
    fixture.detectChanges();
    const modal = fixture.debugElement.query(By.css('p-dialog'));
    expect(modal).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Modal');
    expect(fixture.nativeElement.textContent).toContain('Descripción');
  })

  it('Debe emitir un evento cuando el modal se cierra', () => {
    const emitSpy = jest.spyOn(component.onClose, 'emit');
    component.isOpen = true;
    fixture.detectChanges();
    const dialog = fixture.debugElement.query(By.css('p-dialog'));
    dialog.triggerEventHandler('onHide', null);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('closeModal debe emitir el evento onClose', () => {
    const emitSpy = jest.spyOn(component.onClose, 'emit');
    component.closeModal();
    expect(emitSpy).toHaveBeenCalled();
  })
});
