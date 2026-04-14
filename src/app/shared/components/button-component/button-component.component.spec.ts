import { ButtonComponent } from './button-component.component';
import {ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

describe('EmptyStateComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ ButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('El boton se renderiza correctamente', () => {
    component.label = 'Guardar';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Guardar');
  });

  it('Se emite el evento al hacer click en el boton', () => {
    component.label = 'Guardar'
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.onClick, 'emit');
    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click()
    expect(emitSpy).toHaveBeenCalled();

  })

  it('Se aplica el estilo segun la variante del boton', () => {
    component.variant = 'primary';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.classList).toContain('btn-primary');
  })
});
