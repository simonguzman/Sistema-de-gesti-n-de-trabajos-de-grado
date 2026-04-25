/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UserDetailsPageComponent } from './user-details-page.component';
import { IdentificationType, UserState } from '../../interfaces/user.interface';
import { of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('UserDetailsPageComponent', () => {
  let component: UserDetailsPageComponent;
  let fixture: ComponentFixture<UserDetailsPageComponent>;
  let mockUserService: jest.Mocked<UserService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;

  const mockUser = {
    id: '1',
    idType: IdentificationType.CC,
    idNumber: 1002819781,
    firstName: 'Simón',
    lastName: 'Guzmán',
    secondLastName: 'Anaya',
    codeNumber: 104619021348,
    roles: ['Estudiante', 'Asesor'],
    email: 'siguzman@unicauca.edu.co',
    password: '*******',
    state: UserState.active
  };

  beforeEach(async() => {
    mockUserService = {
      getUserByIdMock: jest.fn().mockReturnValue(of(mockUser))
    }as unknown as jest.Mocked<UserService>
    mockRouter = {
      navigate: jest.fn()
    }as unknown as jest.Mocked<Router>
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn().mockReturnValue('1')
        }
      }
    }
    TestBed.configureTestingModule({
      imports: [ UserDetailsPageComponent ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter},
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(UserDetailsPageComponent);
    component = fixture.componentInstance;
  });

  it('Debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
  it('Debe cargar la información del usuario al inicializar (con ID en ruta)', () => {
    fixture.detectChanges();
    expect(mockUserService.getUserByIdMock).toHaveBeenCalledWith('1');
    expect(component.user()).toEqual(mockUser);
    expect(component.isLoading()).toBeFalsy();
  })
  it('Debe usar el ID por defecto si no hay ID en la ruta', () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
    fixture.detectChanges();
    expect(mockUserService.getUserByIdMock).toHaveBeenCalledWith('id-del-admin-logueado');
  })
  it('Debe navegar a /users al ejecutar goBack()', () => {
    fixture.detectChanges();
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
  })
  it('Debe mostrar el esqueleto de carga cuando isLoading es true', () => {
    fixture.detectChanges();
    component.isLoading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.text-center').textContent).toContain('Cargando información...');
  });
  it('Debe renderizar correctamente los nombres y apellidos en el HTML', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const textContent = compiled.textContent;
    expect(textContent).toContain('Simón');
    expect(textContent).toContain('Guzmán Anaya')
  });
});
