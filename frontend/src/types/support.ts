export type TicketCategory =
  | 'ORDER_ISSUE'
  | 'PRODUCT_QUESTION'
  | 'RETURN_RMA'
  | 'BILLING_PAYMENT'
  | 'TECHNICAL_SUPPORT'
  | 'VENDOR_INQUIRY'
  | 'GENERAL_INQUIRY';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CUSTOMER'
  | 'WAITING_ON_VENDOR'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type SenderType = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SYSTEM';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderType: SenderType;
  message: string;
  attachmentsJson?: string;
  isInternalNote: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  vendorId?: string;
  vendorName?: string;
  orderId?: string;
  orderNumber?: string;
  assignedToId?: string;
  assignedToName?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface CreateSupportTicketPayload {
  category: TicketCategory;
  priority?: TicketPriority;
  subject: string;
  initialMessage: string;
  vendorId?: string;
  orderId?: string;
  attachmentsJson?: string;
}

export interface CreateTicketMessagePayload {
  message: string;
  attachmentsJson?: string;
  isInternalNote?: boolean;
}
