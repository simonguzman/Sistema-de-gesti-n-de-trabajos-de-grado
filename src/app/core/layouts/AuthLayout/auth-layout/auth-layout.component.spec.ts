/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthLayoutComponent } from './auth-layout.component';
import { AuthHeaderComponent } from '../auth-header/auth-header.component';
import { AuthFooterComponent } from '../auth-footer/auth-footer.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [ AuthLayoutComponent, AuthHeaderComponent, AuthFooterComponent, RouterTestingModule ]
    }).compileComponents();
    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe contener los componentes base del layout (Header y Footer)', () => {
    const header = fixture.debugElement.query(By.directive(AuthHeaderComponent));
    const footer = fixture.debugElement.query(By.directive(AuthFooterComponent));

    expect(header).toBeTruthy();
    expect(footer).toBeTruthy();
  });

  it('Debe tener un router-outlet para cargar los componentes hijos (Login/Register)', () => {
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(outlet).toBeTruthy();
  });

  it('Debe renderizar la imagen de fondo de estudiantes con el alt correcto', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('img');

    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('assets/images/estudiantes-unicauca.png');
    expect(img?.getAttribute('alt')).toBe('Estudiantes Unicauca');
  });

  it('Debe tener la estructura de clases para el diseño responsivo', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Verificamos que la sección de la imagen tenga la clase hidden md:block
    const imageContainer = compiled.querySelector('.absolute.right-0.top-0');
    expect(imageContainer?.classList.contains('hidden')).toBeTruthy();
    expect(imageContainer?.classList.contains('md:block')).toBeTruthy();

    // Verificamos que el contenedor del router-outlet ocupe la mitad en desktop
    const mainSection = compiled.querySelector('section');
    expect(mainSection?.classList.contains('md:w-1/2')).toBeTruthy();
  });

  it('Debe asegurar que el z-index permita la interacción sobre la imagen', () => {
    const headerElement = fixture.debugElement.query(By.css('app-auth-header')).nativeElement;
    const mainElement = fixture.debugElement.query(By.css('main')).nativeElement;

    // Verificamos que los elementos críticos tengan z-10 para estar sobre el fondo
    expect(headerElement.classList.contains('z-10')).toBeTruthy();
    expect(mainElement.classList.contains('z-10')).toBeTruthy();
  });
});
