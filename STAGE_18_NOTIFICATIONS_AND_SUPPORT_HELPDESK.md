# Stage 18: Notifications, Real-Time Dispatch & Support Ticket Helpdesk

## 1. Architectural Overview

The **Notifications, Real-Time Dispatch & Support Ticket Helpdesk Engine** delivers an omnichannel messaging, customer engagement, and issue resolution platform for the Alight International Multi-Vendor Marketplace. It powers real-time user notifications across multiple channels, system-wide broadcast alerts, customer support ticketing with order linkages, vendor assignment, and internal notes for support staff.

```
                              +--------------------------+
                              |    Customer / Vendor     |
                              +-------------+------------+
                                            |
                         +------------------+------------------+
                         |                                     |
                         v                                     v
             +-----------------------+             +-----------------------+
             |  NotificationService  |             |  SupportTicketService |
             +-----------+-----------+             +-----------+-----------+
                         |                                     |
        +----------------+----------------+           +--------+--------+
        |                |                |           |                 |
        v                v                v           v                 v
   +----------+    +----------+    +----------+  +----------+     +----------+
   | In-App   |    | System   |    | Unread   |  | Vendor / |     | Internal |
   | Alerts   |    | Broad-   |    | Counts   |  | Customer |     | Staff    |
   | & Read   |    | casts    |    | & Summary|  | Thread   |     | Notes    |
   +----------+    +----------+    +----------+  +----------+     +----------+
```

---

## 2. Core Entities & Database Structure (`V44__notifications_and_support_ticket_enhancements.sql`)

### 2.1 Notifications (`notifications`)
- **`user_id`**: Target user recipient.
- **`type`**: `ORDER_CONFIRMED`, `ORDER_SHIPPED`, `ORDER_DELIVERED`, `RMA_UPDATE`, `QUOTE_UPDATE`, `REVIEW_ACTIVITY`, `TICKET_MESSAGE`, `SYSTEM_BROADCAST`, `PROMOTION`.
- **`channel`**: `IN_APP`, `EMAIL`, `SMS`, `PUSH`.
- **`reference_id` & `action_url`**: Deep-linking targets for UI interactions.
- **`is_read` & `read_at`**: Instant read/unread tracking.

### 2.2 Support Tickets (`support_tickets`)
- **`ticket_number`**: Formatted tracking reference (e.g., `TCK-2026-XXXXXX`).
- **`category`**: `ORDER_ISSUE`, `PAYMENT_FAILURE`, `RETURN_REFUND`, `PRODUCT_INQUIRY`, `VENDOR_DISPUTE`, `TECHNICAL_SUPPORT`.
- **`priority`**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **`status`**: `OPEN`, `IN_PROGRESS`, `WAITING_ON_CUSTOMER`, `WAITING_ON_VENDOR`, `RESOLVED`, `CLOSED`.
- **`vendor_id` & `order_id`**: Multi-vendor entity linkage.
- **`assigned_to`**: Support agent assignment.
- **`resolution_summary` & `resolved_at`**: Formal resolution closure record.

### 2.3 Ticket Messages (`ticket_messages`)
- **`sender_type`**: `CUSTOMER`, `VENDOR`, `ADMIN`.
- **`is_internal_note`**: Flag for staff-only collaboration notes (omitted from customer-facing API views).
- **`attachments`**: JSONB array of photo/document URLs.

---

## 3. Communication & Security Architecture

1. **Automatic Event Notifications**:
   - Creating a support ticket linked to a vendor automatically sends an in-app notification to the vendor's user account.
   - Status updates or public message replies notify the counter-party immediately.
2. **Internal Note Masking**:
   - `TicketResponse.fromEntity(ticket, includeInternalNotes)` strictly filters out `is_internal_note == true` when requested by a customer (`includeInternalNotes = false`), while revealing them to authorized admins and vendors (`includeInternalNotes = true`).
3. **Multi-Tenant Ticket Isolation**:
   - Customers can only view, post to, and close tickets they opened.
   - Vendors can only view and reply to tickets associated with their store.

---

## 4. Verification & Integration Suite

Verified via [`NotificationsAndSupportIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/support/NotificationsAndSupportIntegrationTest.java):
- [x] **Notification Center Lifecycle**: Notification creation, unread counting, recent summary, single mark-as-read, and mark-all-as-read.
- [x] **Broadcast Dispatch**: System-wide announcements targeted to all or specific roles.
- [x] **Support Ticket Creation & Auto-Notification**: Ticket initialization and vendor notification trigger.
- [x] **Multi-Party Threading**: Customer replies, vendor responses, and staff internal notes with visibility isolation.
- [x] **Ticket Lifecycle Transitions**: Status progression, agent assignment, and resolution summary logging.
- [x] **Multi-Tenant Security**: Verification that customers cannot inspect or manipulate other users' tickets.
- [x] **Ticket Statistics**: Summary aggregation across ticket statuses and priority levels.
