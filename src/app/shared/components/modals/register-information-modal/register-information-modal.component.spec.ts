/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RegisterInformationModalComponent } from './register-information-modal.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ButtonComponent } from '../../button-component/button-component.component';
import { StateComponent, stateList } from '../../state/state.component';

describe('RegisterInformationModalComponent', () => {
  let component: RegisterInformationModalComponent;
  let fixture: ComponentFixture<RegisterInformationModalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ RegisterInformationModalComponent ],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterInformationModalComponent);
    component = fixture.componentInstance;
  });

  const mockData = {
    modalHeader: 'Header Test',
    subTitle: 'Subtitulo Test',
    title: 'Proyecto X',
    modality: 'Investigación',
    student: 'Juan',
    director: 'Dr. Smith',
    codirector: 'Dra. Ana',
    adviser: 'Ing. Pedro',
    state: stateList.APROBADO,
    documents: ['doc1.pdf', 'doc2.pdf']
  };

  it('Debe renderizar la información correctamente', () => {
    Object.assign(component, mockData);
    component.isOpen = true;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Header Test');
    expect(text).toContain('Subtitulo Test');
    expect(text).toContain('Proyecto X');
    expect(text).toContain('Juan');
    expect(text).toContain('Dr. Smith');
  })

  it('Debe mostrar el codirector si el trabajo de grado lo tiene', () => {
    component.codirector = 'Joe Doe';
    component.isOpen = true;
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Codirector');
  })
  it('NO debe mostrar el codirector si el trabajo de grado NO lo tiene', () => {
    component.codirector = undefined;
    component.isOpen = true;
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('Codirector');
  })

  it('Debe mostrar el asesor si el trabajo de grado lo tiene', () => {
    component.adviser = 'Joe Doe';
    component.isOpen = true;
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Asesor');
  })
  it('NO debe mostrar el asesor si el trabajo de grado NO lo tiene', () => {
    component.adviser = undefined;
    component.isOpen = true;
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('Asesor');
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
    const button = fixture.debugElement.queryAll(By.directive(ButtonComponent));
    expect(button.length).toBe(component.documents.length);
  })

  it('Debe mostrar el mensaje si no tiene documentos', () => {
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
  })

  it('closeModal debe emitir onClose', () => {
    const spy = jest.spyOn(component.onClose, 'emit');
    component.closeModal();
    expect(spy).toHaveBeenCalled();
  });
});
