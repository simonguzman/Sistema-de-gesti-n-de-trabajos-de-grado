import { Injectable, signal } from '@angular/core';
import { Notification, NotificationType } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  private readonly DEFAULT_DURATION = 5000;

  show(notification: Omit<Notification, 'id'>): void {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification, id
    }
    this._notifications.update(prev => [newNotification, ...prev]);
    const duration = newNotification.type === NotificationType.ERROR ? 10000 : 5000
    if(newNotification.type){
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: string): void{
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  success(title: string, message: string) :void {
    this.show({ type: NotificationType.CONFIRMATION, title, message, autoDismiss: true })
  }

  info(title: string, message: string) : void{
    this.show({ type: NotificationType.INFO, title, message, autoDismiss: true})
  }

  error(title: string, message: string): void{
    this.show({ type: NotificationType.ERROR, title, message, autoDismiss: true })
  }

  security(title: string, message: string){
    this.show({ type: NotificationType.SECURITY, title, message, autoDismiss: true })
  }

}
