import { apiClient } from './api-client';
import { ApiResponse } from '@/types';
import { AdminAnalyticsOverview, VendorAnalyticsOverview, VendorOperationalBadges } from '@/types/analytics';

export async function getAdminAnalyticsOverviewApi(): Promise<ApiResponse<AdminAnalyticsOverview>> {
  return apiClient<AdminAnalyticsOverview>('/admin/analytics/overview');
}

export async function getVendorAnalyticsOverviewApi(
  range = "30d"
): Promise<ApiResponse<VendorAnalyticsOverview>> {
  const query = range ? `?range=${encodeURIComponent(range)}` : "";
  return apiClient<VendorAnalyticsOverview>(`/vendor/analytics/overview${query}`);
}

export async function getVendorOperationalBadgesApi(): Promise<ApiResponse<VendorOperationalBadges>> {
  return apiClient<VendorOperationalBadges>('/vendor/analytics/badges');
}
