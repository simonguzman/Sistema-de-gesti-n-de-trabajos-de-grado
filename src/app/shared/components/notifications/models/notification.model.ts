export enum NotificationType {
  CONFIRMATION = 'confirmation',
  INFO = 'info',
  ERROR = 'error',
  SECURITY = 'security'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  dismissible?: boolean;
  autoDismiss?: boolean;
  autoDismissDelay ?: number;
}
