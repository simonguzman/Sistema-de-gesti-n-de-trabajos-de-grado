/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsPageComponent } from './user-details-page.component';
import { IdentificationType, UserState } from '../../interfaces/user.interface';
import { of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserRoleType } from '../../../../core/models/user-role';

describe('UserDetailsPageComponent', () => {
  let component: UserDetailsPageComponent;
  let fixture: ComponentFixture<UserDetailsPageComponent>;
  let mockRouter: any;

  // Usuario de prueba
  const dummyUser = {
    id: 'user-001',
    idType: IdentificationType.CC,
    idNumber: 1061700000,
    firstName: 'Simón',
    lastName: 'Guzmán',
    secondLastName: 'Anaya',
    codeNumber: 202601,
    roles: [UserRoleType.ESTUDIANTE],
    email: 'simon@unicauca.edu.co',
    state: UserState.active
  };

  beforeEach(async () => {
    mockRouter = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      // Importamos el componente ya que es Standalone
      imports: [UserDetailsPageComponent],
      providers: [
        // 1. PROVEEDORES DE HTTP (Soluciona el error NG0201)
        provideHttpClient(),
        provideHttpClientTesting(),

        // 2. MOCK DE ACTIVATED ROUTE (Para simular el ID en la URL)
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => 'user-001'
              }
            }
          }
        },

        // 3. MOCK DE ROUTER
        { provide: Router, useValue: mockRouter },

        // 4. MOCKS DE SERVICIOS
        {
          provide: UserService,
          useValue: {
            getUserByIdMock: (id: string) => of(dummyUser)
          }
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: () => dummyUser
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe cargar la información del usuario al inicializar (con ID en ruta)', () => {
    // Al iniciar, el ngOnInit llama a getUserByIdMock
    expect(component.user()).toBeDefined();
    expect(component.user()?.firstName).toBe('Simón');
    expect(component.isLoading()).toBe(false);
  });

  it('Debe navegar a /users al ejecutar goBack() si no es perfil propio', () => {
    component.isMyProfile.set(false);
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('Debe navegar a /notifications al ejecutar goBack() si es "Mi Perfil"', () => {
    component.isMyProfile.set(true);
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('Debe renderizar correctamente los nombres y apellidos en el HTML', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Buscamos en el HTML los valores del dummyUser
    const content = compiled.textContent;
    expect(content).toContain('Simón');
    expect(content).toContain('Guzmán');
    expect(content).toContain('Anaya');
  });

  it('Debe mostrar el mensaje de carga cuando isLoading es true', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.text-center')?.textContent).toContain('Cargando información...');
  });
});
