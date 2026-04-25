/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AuthFooterComponent } from './auth-footer.component';

describe('AuthFooterComponent', () => {
  let component: AuthFooterComponent;
  let fixture: ComponentFixture<AuthFooterComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ AuthFooterComponent ]
    }).compileComponents();
    fixture = TestBed.createComponent(AuthFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe mostrar el año actual dinámicamente', () => {
    const currentYear = new Date().getFullYear().toString();
    const compiled = fixture.nativeElement as HTMLElement;

    // Verificamos que el año en el componente sea el correcto
    expect(component.currentYear.toString()).toBe(currentYear);

    // Verificamos que se renderice en el HTML
    expect(compiled.textContent).toContain(currentYear);
  });

  it('Debe mostrar la versión correcta de la aplicación', () => {
    const versionText = `Versión ${component.version}`;
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(versionText);
  });

  it('Debe contener la información legal de la Universidad del Cauca', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Universidad del Cauca');
    expect(compiled.textContent).toContain('NIT. 891500319-2');
    expect(compiled.textContent).toContain('Institución con Acreditación de Alta Calidad');
  });

  it('Debe tener los enlaces de políticas legales configurados', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');

    const expectedTexts = [
      'Política de Protección de Datos Personales',
      'Política de seguridad de la información',
      'Comunícate con nuestro Soporte Técnico'
    ];

    expectedTexts.forEach(text => {
      const linkFound = Array.from(links).find(link => link.textContent?.trim() === text);
      expect(linkFound).toBeTruthy();
    });
  });

  it('Debe renderizar la barra de colores institucional', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Buscamos los contenedores de colores por sus clases de Tailwind
    const colorBar = compiled.querySelector('.h-1\\.5.w-full.flex');
    const colorDivs = colorBar?.querySelectorAll('div');

    expect(colorBar).toBeTruthy();
    expect(colorDivs?.length).toBe(5); // Los 5 colores representativos
  });
});
