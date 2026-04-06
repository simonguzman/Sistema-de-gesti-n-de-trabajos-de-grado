import { NotificationService } from './../../services/notification.service';
import { Component, inject } from '@angular/core';
import { NotificationItemComponent } from '../notification-item/notification-item.component';

@Component({
  selector: 'app-notification-container',
  imports: [NotificationItemComponent],
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.css']
})
export class NotificationContainerComponent {
  protected notificationService = inject(NotificationService)
}
