/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { StateComponent, stateList } from './state.component';

describe('StateComponent', () => {
  let component: StateComponent;
  let fixture: ComponentFixture<StateComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ StateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StateComponent)
    component = fixture.componentInstance;
  });

  it('El estado se renderiza correctamente', () => {
    component.label = 'Aprobado';
    component.state = stateList.APROBADO;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aprobado');
  })

  it('Se debe aplicar el estilo de acuerdo al estado seleccionado', () => {
    component.state  = stateList.APROBADO;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge-state');
    expect(element).toBeTruthy();
    expect(component.getState()).toBe('state-aprobado');
    expect(element.classList).toContain('state-aprobado');
  })

  it('No debe romperse el componente si el estado no es valido ', () => {
    component.state = 'INVALIDO' as any;

    expect(() => fixture.detectChanges()).not.toThrow();
  })
});
