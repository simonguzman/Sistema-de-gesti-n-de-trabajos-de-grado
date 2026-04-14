import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NotificationItemComponent } from './notification-item.component';
import { NotificationType } from '../../models/notification.model';

describe('NotificationItemComponent', () => {
  let component: NotificationItemComponent;
  let fixture: ComponentFixture<NotificationItemComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      imports: [NotificationItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationItemComponent);
    component = fixture.componentInstance;
  });

  const mockNotification = {
    id: '123',
    type: NotificationType.CONFIRMATION,
    title: 'Exito',
    message: 'Operación completada',
    dismissible: true
  };

  it('debe mostrar el titulo y mensaje correctamente', () =>{
    fixture.componentRef.setInput('notification', mockNotification);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    expect(element.textContent).toContain('Exito');
    expect(element.textContent).toContain('Operación completada')
  })

  it('debe aplicar las clases correctas según el tipo (Logic Mapping)', () => {
    // Probamos el tipo ERROR para validar el cambio de config()
    fixture.componentRef.setInput('notification', {
      ...mockNotification,
      type: NotificationType.ERROR
    });
    fixture.detectChanges();

    const container = fixture.debugElement.query(By.css('[role="alert"]')).nativeElement;

    // En lugar de probar "red-500", probamos la clase lógica de tu config
    expect(container.classList).toContain('notification--error');
  });

  it('debe emitir el ID cuando se hace clic en el botón de cerrar', () => {
    // Arrange
    fixture.componentRef.setInput('notification', mockNotification);
    fixture.detectChanges();

    // Creamos un espía en el output (que es una Signal de salida)
    const emitSpy = jest.spyOn(component.dismissed, 'emit');

    // Act: Buscamos el botón y simulamos el clic
    const closeButton = fixture.debugElement.query(By.css('.notification__close'));
    closeButton.triggerEventHandler('click', null);

    // Assert
    expect(emitSpy).toHaveBeenCalledWith('123');
  });

  it('no debe renderizar el botón de cerrar si dismissible es false', () => {
    // Arrange
    fixture.componentRef.setInput('notification', {
      ...mockNotification,
      dismissible: false
    });

    // Act
    fixture.detectChanges();

    // Assert
    const closeButton = fixture.debugElement.query(By.css('.notification__close'));
    expect(closeButton).toBeNull(); // El botón no debe existir en el DOM
  });

  it('No debe romperse el componente si el type no es una opción valida',() => {
    fixture.componentRef.setInput('notification',{
      ...mockNotification,
      type: 'INVALIDO'
    });

    expect(() => fixture.detectChanges()).not.toThrow();

  })

});
