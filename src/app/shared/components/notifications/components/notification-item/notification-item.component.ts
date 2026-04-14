import { Component, computed, input, output } from '@angular/core';
import { Notification, NotificationType } from '../../models/notification.model';
import { NgClass } from '@angular/common';

interface NotificationConfig {
  containerClass: string;
  titleClass: string;
  messageClass: string;
  iconClass: string;
  icon: string;
  closeClass: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  [NotificationType.CONFIRMATION]: {
    containerClass: 'notification--confirmation',
    titleClass:     'notification__title--confirmation',
    messageClass:   'notification__message--confirmation',
    iconClass:      'text-green-600',
    icon:           'pi-check-circle',
    closeClass:     'notification__close--confirmation'
  },
  [NotificationType.INFO]: {
    containerClass: 'notification--info',
    titleClass:     'notification__title--info',
    messageClass:   'notification__message--info',
    iconClass:      'text-blue-600',
    icon:           'pi-info-circle',
    closeClass:     'notification__close--info'
  },
  [NotificationType.ERROR]: {
    containerClass: 'notification--error',
    titleClass:     'notification__title--error',
    messageClass:   'notification__message--error',
    iconClass:      'text-red-500',
    icon:           'pi-times-circle',
    closeClass:     'notification__close--error'
  },
  [NotificationType.SECURITY]: {
    containerClass: 'notification--security',
    titleClass:     'notification__title--security',
    messageClass:   'notification__message--security',
    iconClass:      'text-orange-500',
    icon:           'pi-shield',
    closeClass:     'notification__close--security'
  }
};

@Component({
  selector: 'app-notification-item',
  imports: [NgClass],
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.css']
})
export class NotificationItemComponent {

  notification = input.required<Notification>();
  dismissed = output<string>();

  config = computed<NotificationConfig>(() => {
    const type = this.notification().type;
    return NOTIFICATION_CONFIG[type] ?? NOTIFICATION_CONFIG[NotificationType.INFO];
  });
}
