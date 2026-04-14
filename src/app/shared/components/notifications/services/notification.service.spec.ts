import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('show debe agregar una notificación correctamente', () => {
    service.show({
      type: NotificationType.CONFIRMATION,
      title: 'Prueba',
      message: 'Mensaje de prueba'
    });

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);

    const notif = notifications[0];
    expect(notif).toEqual(
      expect.objectContaining({
        type: NotificationType.CONFIRMATION,
        title: 'Prueba',
        message: 'Mensaje de prueba'
      })
    );

    expect(notif.id).toBeDefined();
  });

  it('debe manejar múltiples notificaciones', () => {
    service.success('Uno', 'Mensaje 1');
    service.success('Dos', 'Mensaje 2');

    const notifications = service.notifications();
    expect(notifications.length).toBe(2);
    expect(notifications[0].id).not.toBe(notifications[1].id);
  });

  it('dismiss debe eliminar una notificación por id', () => {
    service.success('Test', 'Mensaje');
    const id = service.notifications()[0].id;

    service.dismiss(id);

    expect(service.notifications().length).toBe(0);
  });

  it('dismiss con id inexistente no debe afectar el estado', () => {
    service.success('Test', 'Mensaje');

    service.dismiss('id-inexistente');

    expect(service.notifications().length).toBe(1);
  });

  it('success debe crear notificación de tipo CONFIRMATION', () => {
    service.success('Exito', 'Todo bien');

    const notif = service.notifications()[0];

    expect(notif.type).toBe(NotificationType.CONFIRMATION);
    expect(notif.title).toBe('Exito');
    expect(notif.message).toBe('Todo bien');
  });
});
