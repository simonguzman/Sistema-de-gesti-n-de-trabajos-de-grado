/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TabItem, TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  const mockTabs: TabItem[] = [
    { label: 'Tab 1', value: 'tab1' },
    { label: 'Tab 2', value: 'tab2' },
    { label: 'Tab 3', value: 'tab3' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent] // Como es standalone, va en imports
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;

    // Seteamos inputs obligatorios
    fixture.componentRef.setInput('tabs', mockTabs);
    fixture.componentRef.setInput('activeTab', 'tab1');

    fixture.detectChanges();
  });

  it('Debe ser creado', () => {
    expect(component).toBeTruthy();
  });

  it('Debe renderizar el número correcto de pestañas', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(mockTabs.length);
    expect(buttons[0].nativeElement.textContent.trim()).toBe('Tab 1');
  });

  it('Debe aplicar la clase activa solo a la pestaña correspondiente', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    // La primera pestaña debería tener la clase de borde grueso (activa)
    expect(buttons[0].nativeElement.className).toContain('border-b-4');
    expect(buttons[0].nativeElement.className).toContain('font-bold');

    // La segunda pestaña no debería tenerla
    expect(buttons[1].nativeElement.className).not.toContain('border-b-4');
    expect(buttons[1].nativeElement.className).toContain('border-transparent');
  });

  it('Debe emitir tabChange cuando se hace clic en una pestaña distinta a la activa', () => {
    const spy = jest.spyOn(component.tabChange, 'emit');
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    // Hacemos clic en la segunda pestaña
    buttons[1].nativeElement.click();

    expect(spy).toHaveBeenCalledWith('tab2');
  });

  it('No debe emitir tabChange si se hace clic en la pestaña que ya está activa', () => {
    const spy = jest.spyOn(component.tabChange, 'emit');
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    // Hacemos clic en la primera pestaña (que ya es la activa)
    buttons[0].nativeElement.click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('Debe actualizar la UI cuando el input activeTab cambia', () => {
    // Cambiamos el input programáticamente
    fixture.componentRef.setInput('activeTab', 'tab2');
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons[0].nativeElement.className).toContain('border-transparent');
    expect(buttons[1].nativeElement.className).toContain('border-b-4');
  });
});
