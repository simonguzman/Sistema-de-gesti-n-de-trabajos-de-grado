/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthHeaderComponent } from './auth-header.component';

describe('AuthHeaderComponent', () => {
  let component: AuthHeaderComponent;
  let fixture: ComponentFixture<AuthHeaderComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ AuthHeaderComponent ]
    }).compileComponents();
    fixture = TestBed.createComponent(AuthHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe mostrar el logo institucional con el alt text correcto', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('img');

    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toContain('assets/images/logo-unicauca-azul.png');
    expect(img?.getAttribute('alt')).toBe('Logo Unicauca');
  });

  it('Debe mostrar el título del sistema correctamente', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');

    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Sistema de gestión de trabajo de grado');
  });

  it('Debe renderizar la línea divisoria azul con dimensiones específicas', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    /** * NOTA: Escapamos los corchetes [ ] del selector de Tailwind w-[1.5px]
     * para que querySelector no los interprete como atributos.
     */
    const divider = compiled.querySelector('.w-\\[1\\.5px\\]');

    expect(divider).toBeTruthy();
    // Verificamos que tenga el color de marca asignado en el HTML
    expect(divider?.classList.contains('bg-[#143296]')).toBeTruthy();
  });

  it('Debe tener la estructura de flexbox para el alineamiento', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('div');

    expect(container?.classList.contains('flex')).toBeTruthy();
    expect(container?.classList.contains('items-center')).toBeTruthy();
  });
});
