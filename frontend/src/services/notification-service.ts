import { apiClient } from './api-client';
import { ApiResponse, PageResponse } from '@/types';
import { NotificationItem, NotificationPreferences } from '@/types/notification';

export async function getNotificationsApi(
  page: number = 0,
  size: number = 20,
  unreadOnly?: boolean
): Promise<ApiResponse<PageResponse<NotificationItem>>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (unreadOnly) {
    query.append('unreadOnly', 'true');
  }
  return apiClient<PageResponse<NotificationItem>>(`/notifications?${query.toString()}`);
}

export async function getUnreadNotificationCountApi(): Promise<ApiResponse<{ count: number }>> {
  return apiClient<{ count: number }>('/notifications/unread-count');
}

export async function markNotificationAsReadApi(id: string): Promise<ApiResponse<NotificationItem>> {
  return apiClient<NotificationItem>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsReadApi(): Promise<ApiResponse<void>> {
  return apiClient<void>('/notifications/mark-all-read', {
    method: 'PATCH',
  });
}

export async function getNotificationPreferencesApi(): Promise<ApiResponse<NotificationPreferences>> {
  return apiClient<NotificationPreferences>('/notifications/preferences');
}

export async function updateNotificationPreferencesApi(
  preferences: NotificationPreferences
): Promise<ApiResponse<NotificationPreferences>> {
  return apiClient<NotificationPreferences>('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}
