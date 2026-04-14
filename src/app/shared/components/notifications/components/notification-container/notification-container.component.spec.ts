/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import { NotificationContainerComponent } from './notification-container.component';
import { Notification, NotificationType } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';

describe('NotificationContainerComponent', () => {
  const mockNotification = {
    id: '123',
    type: NotificationType.CONFIRMATION,
    title: 'Exito',
    message: 'Operación completada',
    dismissible: true
  }

  let component: NotificationContainerComponent;
  let fixture: ComponentFixture<NotificationContainerComponent>;
  let mockService: Partial<NotificationService>;
  let notificationsSignal: WritableSignal<Notification[]>;;

  beforeEach(async() => {
    notificationsSignal = signal([mockNotification])
    mockService = {
      notifications: notificationsSignal.asReadonly(),
      dismiss: jest.fn()
    };
    await TestBed.configureTestingModule({
      imports: [NotificationContainerComponent],
      providers: [{
        provide: NotificationService, useValue: mockService
      }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationContainerComponent);
  });

  it('debe mostrar la lista de notificaciones que han sido notificadas', () =>{
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.directive(NotificationItemComponent));

    expect(items.length).toBe(1);
  })

  it('Debe pasar correctamente la notificación al hijo', () => {
    fixture.detectChanges();

    const item = fixture.debugElement.query(By.directive(NotificationItemComponent));

    expect(item.componentInstance.notification()).toEqual(mockNotification);
  })

  it('Cuando se emite el dismiss se debe llamar al servicio', () => {
    fixture.detectChanges();

    const item = fixture.debugElement.query(By.directive(NotificationItemComponent));

    item.componentInstance.dismissed.emit('123');

    expect (mockService.dismiss as jest.Mock).toHaveBeenCalledWith('123');
  })

  it('debe actualizar la vista cuando cambian las notificaciones', () => {
    fixture.detectChanges();

    let items = fixture.debugElement.queryAll(
      By.directive(NotificationItemComponent)
    );
    expect(items.length).toBe(1);

    notificationsSignal.set([
      mockNotification,
      { ...mockNotification, id: '456' }
    ]);

    fixture.detectChanges();

    items = fixture.debugElement.queryAll(
      By.directive(NotificationItemComponent)
    );

    expect(items.length).toBe(2);
  });

});
