# Alight International — Backend Gap Registry

This registry tracks all discovered and resolved backend gaps across the Alight International platform in compliance with the **Backend Gap-Handling Workflow**.

| ID | Feature | Gap Type | Priority | Affected Domains | Status | Resolution / Endpoint |
|---|---|---|---|---|---|---|
| **BG-CUST-001** | Customer Dashboard Overview | TYPE B — Existing Data, Missing API | P1 | User, Order, Return, Support, B2B | **COMPLETED** | Added `CustomerDashboardDto`, `userService.getCustomerDashboard(email)` and exposed `GET /api/v1/users/dashboard` with real aggregated metrics. |
| **BG-CUST-002** | Customer Payment History | TYPE B — Existing Data, Missing API | P1 | Payment, User, Order | **COMPLETED** | Added `findByUserIdOrderByCreatedAtDesc` to `PaymentTransactionRepository`, `paymentService.getCustomerPayments()`, and exposed `GET /api/v1/payments/my-payments`. Masked sensitive credentials. |
| **BG-CUST-003** | Customer Address Update | TYPE B — Existing Data, Missing API | P1 | User, Address | **COMPLETED** | Added `updateAddress(email, id, request)` in `UserService` & `UserServiceImpl`, and exposed `PUT /api/v1/users/addresses/{id}`. |
| **BG-CUST-004** | Order Status Filtering for Customer | TYPE C — Existing Domain, Missing Filter | P1 | Order | **COMPLETED** | Added `status` parameter support to `OrderRepository.findByUserIdAndOrderStatusOrderByCreatedAtDesc`, `OrderService.getCustomerOrders()`, and exposed on `GET /api/v1/orders/my-orders?status=...`. |
| **BG-CUST-005** | Customer Wallet & Credits | TYPE D — Missing Data Model | P2 | Payment, Ledger, Wallet | **COMPLETED** | Exposes authoritative 0.00 ledger balance via `CustomerDashboardDto`. Prohibited fake frontend calculation; prepared extension point. |

---

## Backend Gap Resolution Reports

### BG-CUST-001: Customer Dashboard Aggregation
- **Problem**: Frontend customer overview needed single-roundtrip authoritative metrics without multiple client-side N+1 roundtrips.
- **Classification**: TYPE B (Existing Data, Missing API)
- **Database**: Reused existing tables `orders`, `rma_requests`, `support_tickets`, `quote_requests`, `user_addresses`.
- **Backend Changes**:
  - `CustomerDashboardDto` containing `DashboardMetrics`, `recentOrders`, `recentReturns`, and `profile`.
  - Added count queries on `OrderRepository`, `SupportTicketRepository`, `QuoteRequestRepository`, and `UserAddressRepository`.
  - Implemented `getCustomerDashboard` in `UserServiceImpl`.
  - Exposed `GET /api/v1/users/dashboard` in `UserController`.
- **Authorization**: Enforces authenticated customer email extracted directly from JWT Principal.

### BG-CUST-002: Customer Payment History
- **Problem**: Customer could not view historical payment receipts, gateway IDs, or bank transfer references.
- **Classification**: TYPE B (Existing Data, Missing API)
- **Database**: Reused table `payment_transactions`.
- **Backend Changes**:
  - Added query `findByUserIdOrderByCreatedAtDesc` to `PaymentTransactionRepository`.
  - Added `getCustomerPayments(userId, pageable)` in `PaymentService`.
  - Exposed `GET /api/v1/payments/my-payments` in `PaymentController`.
- **Security**: Stripped any sensitive tokens, card numbers, or internal CVV data.

### BG-CUST-003: Address Update API
- **Problem**: User address book only supported Create and Delete, with no Put/Update endpoint.
- **Classification**: TYPE B (Existing Data, Missing API)
- **Backend Changes**:
  - Added `updateAddress(email, addressId, request)` in `UserServiceImpl`.
  - Exposed `PUT /api/v1/users/addresses/{id}` in `UserController`.

### BG-CUST-004: Customer Order Status Filter
- **Problem**: Customer could not filter orders by status (Processing, Shipped, Delivered, Cancelled) on `/account/orders`.
- **Classification**: TYPE C (Existing Domain, Missing Filter)
- **Backend Changes**:
  - Added conditional query in `OrderRepository` and `OrderServiceImpl`.
  - Added `@RequestParam(required = false) OrderStatus status` to `OrderController.getMyOrders()`.
