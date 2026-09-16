export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'RMA_UPDATE'
  | 'QUOTE_UPDATE'
  | 'REVIEW_ACTIVITY'
  | 'TICKET_MESSAGE'
  | 'SYSTEM_BROADCAST'
  | 'PROMOTION';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  actionUrl?: string;
  metadataJson?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  supportAlerts: boolean;
}
