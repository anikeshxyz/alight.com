import { apiClient } from './api-client';
import { ApiResponse, PageResponse } from '@/types';
import {
  SupportTicket,
  TicketMessage,
  CreateSupportTicketPayload,
  CreateTicketMessagePayload,
  TicketStatus,
  TicketPriority,
} from '@/types/support';

// --- Storefront / Customer Support APIs ---
export async function getCustomerTicketsApi(
  page: number = 0,
  size: number = 10
): Promise<ApiResponse<PageResponse<SupportTicket>>> {
  return apiClient<PageResponse<SupportTicket>>(`/support/tickets?page=${page}&size=${size}`);
}

export async function getCustomerTicketByIdApi(id: string): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/support/tickets/${id}`);
}

export async function createCustomerTicketApi(
  payload: CreateSupportTicketPayload
): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addCustomerTicketMessageApi(
  ticketId: string,
  payload: CreateTicketMessagePayload
): Promise<ApiResponse<TicketMessage>> {
  return apiClient<TicketMessage>(`/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeCustomerTicketApi(ticketId: string): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/support/tickets/${ticketId}/close`, {
    method: 'POST',
  });
}

// --- Vendor Support APIs ---
export async function getVendorTicketsApi(
  page: number = 0,
  size: number = 15
): Promise<ApiResponse<PageResponse<SupportTicket>>> {
  return apiClient<PageResponse<SupportTicket>>(`/vendor/support/tickets?page=${page}&size=${size}`);
}

export async function getVendorTicketByIdApi(id: string): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/vendor/support/tickets/${id}`);
}

export async function addVendorTicketMessageApi(
  ticketId: string,
  payload: CreateTicketMessagePayload
): Promise<ApiResponse<TicketMessage>> {
  return apiClient<TicketMessage>(`/vendor/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVendorTicketStatusApi(
  ticketId: string,
  status: TicketStatus
): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/vendor/support/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// --- Admin Support APIs ---
export async function getAdminTicketsApi(params?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  vendorId?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<ApiResponse<PageResponse<SupportTicket>>> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.vendorId) query.append('vendorId', params.vendorId);
  if (params?.search) query.append('search', params.search);
  query.append('page', (params?.page ?? 0).toString());
  query.append('size', (params?.size ?? 20).toString());

  return apiClient<PageResponse<SupportTicket>>(`/admin/support/tickets?${query.toString()}`);
}

export async function getAdminTicketByIdApi(id: string): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/admin/support/tickets/${id}`);
}

export async function addAdminTicketMessageApi(
  ticketId: string,
  payload: CreateTicketMessagePayload
): Promise<ApiResponse<TicketMessage>> {
  return apiClient<TicketMessage>(`/admin/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminTicketStatusApi(
  ticketId: string,
  status: TicketStatus
): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/admin/support/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function assignAdminTicketApi(
  ticketId: string,
  assignedToId: string
): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/admin/support/tickets/${ticketId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assignedToId }),
  });
}

export async function resolveAdminTicketApi(
  ticketId: string,
  resolutionNotes?: string
): Promise<ApiResponse<SupportTicket>> {
  return apiClient<SupportTicket>(`/admin/support/tickets/${ticketId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNotes }),
  });
}

export async function getAdminSupportStatsApi(): Promise<ApiResponse<Record<string, unknown>>> {
  return apiClient<Record<string, unknown>>('/admin/support/tickets/stats');
}
