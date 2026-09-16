-- ==========================================================
-- Stage 18: Notifications, Real-Time Dispatch & Support Ticket Enhancements
-- ==========================================================

-- 1. Notification Center Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
    ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_channel 
    ON notifications(type, channel);

-- 2. Support Ticket Helpdesk Performance Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status_created 
    ON support_tickets(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_vendor_status_created 
    ON support_tickets(vendor_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority_created 
    ON support_tickets(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_created 
    ON ticket_messages(ticket_id, created_at ASC);
