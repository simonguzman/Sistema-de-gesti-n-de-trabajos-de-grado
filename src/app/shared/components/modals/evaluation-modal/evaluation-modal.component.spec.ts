/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { EvaluationModalComponent } from './evaluation-modal.component';
import { StateComponent, stateList } from '../../state/state.component';
import { ButtonComponent } from '../../button-component/button-component.component';

describe('EvaluationModalComponent', () => {
  let component: EvaluationModalComponent;
  let fixture: ComponentFixture<EvaluationModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ EvaluationModalComponent ],
      providers: [ provideNoopAnimations() ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationModalComponent);
    component = fixture.componentInstance;
  });

  const mockData = {
    name: 'Juan Perez',
    role: 'Evaluador',
    comments: 'Buen trabajo',
    state: stateList.APROBADO,
    documents: ['archivo1.pdf', 'archivo2.pdf']
  };

  it('Debe renderizar la información correctamente', () => {
    Object.assign(component, mockData);
    component.isOpen = true;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Juan Perez');
    expect(text).toContain('Evaluador');
    expect(text).toContain('Buen trabajo');
  })

  it('Debe mostrar el estado solo si existe', () => {
     component.state = stateList.APROBADO;
     component.isOpen = true;
     fixture.detectChanges();
     const state = fixture.debugElement.query(By.directive(StateComponent));
     expect(state).toBeTruthy();
  })
  it('NO debe mostrar el estado si no existe', () => {
     component.state = undefined;
     component.isOpen = true;
     fixture.detectChanges();
     const state = fixture.debugElement.query(By.directive(StateComponent));
     expect(state).toBeNull();
  })

  it('Debe mostrar la lista de documentos', () => {
    component.documents = ['archivo1.pdf', 'archivo2.pdf'];
    component.isOpen = true;
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.directive(ButtonComponent));
    expect(buttons.length).toBe(component.documents.length);
  })

  it('Debe mostrar mensaje cuando no hay documentos en la lista', () => {
    component.documents = [];
    component.isOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No han sido cargados archivos');
  })

  it('Debe emitir un evento al descargar un archivo', () => {
    const spy = jest.spyOn(component.onDownloadFile, 'emit');
    component.isOpen = true;
    component.documents = ['archivo1.pdf'];
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.directive(ButtonComponent));
    const button = buttons.find(btn => btn.componentInstance.label === 'Descargar');
    expect(button).toBeTruthy()
    button!.triggerEventHandler('onClick', null);
    expect(spy).toHaveBeenCalledWith('archivo1.pdf');
  });

  it('closeModal debe emitir onClose', () => {
    const spy = jest.spyOn(component.onClose, 'emit');
    component.closeModal()
    expect(spy).toHaveBeenCalled();
  })

});
