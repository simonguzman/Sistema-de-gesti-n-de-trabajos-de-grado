import { Injectable, signal } from '@angular/core';
import { Notification, NotificationType } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  show(notification: Omit<Notification, 'id'>): void {
    const id = crypto.randomUUID();
    const newNotif: Notification = {
      dismissible: true,
      autoDismiss: false,
      autoDismissDelay: 5000,
      ...notification,
      id
    }
    this._notifications.update(list => [...list, newNotif]);

    if(newNotif.autoDismiss){
      setTimeout(() => this.dismiss(id), newNotif.autoDismissDelay);
    }
  }

  dismiss(id: string): void{
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  success(title: string, message: string) :void {
    this.show({ type: NotificationType.CONFIRMATION, title, message, autoDismiss: true })
  }

  info(title: string, message: string) : void{
    this.show({ type: NotificationType.INFO, title, message})
  }

  error(title: string, message: string): void{
    this.show({ type: NotificationType.ERROR, title, message })
  }

  security(title: string, message: string){
    this.show({ type: NotificationType.SECURITY, title, message })
  }

}
