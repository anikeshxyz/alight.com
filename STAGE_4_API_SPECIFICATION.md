# Stage 4: Production API Specification & Swagger Documentation
**Alight International Multi-Vendor Marketplace**  
*Document Version:* 4.0.0 (Production-Ready)  
*API Standard:* RESTful JSON v1.0.0 (`/api/v1/*`)  
*OpenAPI Specification URL:* `GET /v3/api-docs`  
*Interactive Swagger UI:* `http://localhost:8080/swagger-ui.html`  

---

## 1. Global API Standards

### Base URLs by Environment
| Environment | Base URL | Protocol |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:8080` | HTTP |
| **Staging** | `https://api-staging.alight.com` | HTTPS |
| **Production** | `https://api.alight.com` | HTTPS (TLS 1.3) |

### Authentication Header
All authenticated endpoints require an HTTP `Authorization` header containing a valid JWT access token:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Standard Unified Response Envelope (`ApiResponse<T>`)
Every API endpoint returns a deterministic JSON envelope:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "error": null,
  "timestamp": "2026-09-12T07:45:00Z",
  "traceId": "c4b9-8e21-4f10-91ab",
  "path": "/api/v1/products"
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "message": "Validation failed on 1 field",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid SKU format",
    "status": 400,
    "details": [
      {
        "field": "sku",
        "message": "SKU must not be empty"
      }
    ]
  },
  "timestamp": "2026-09-12T07:45:00Z",
  "traceId": "c4b9-8e21-4f10-91ab",
  "path": "/api/v1/products"
}
```

---

## 2. Complete Endpoint Catalog by Domain Group

### Group 1: Authentication & Session (`/api/v1/auth/*`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new customer or vendor account | `201`, `400`, `409` |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user credentials & issue JWT tokens | `200`, `401`, `403` |
| `POST` | `/api/v1/auth/refresh-token` | Public | Refresh expired JWT access token via rotated refresh token | `200`, `401` |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke active refresh tokens | `200` |
| `GET` | `/api/v1/auth/me` | Authenticated | Get current authenticated user profile | `200`, `401` |

---

### Group 2: User Account & RBAC Permissions
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/profile` | Authenticated | Retrieve customer personal profile | `200`, `401` |
| `PUT` | `/api/v1/users/profile` | Authenticated | Update personal profile details | `200`, `400` |
| `GET` | `/api/v1/users/addresses` | Authenticated | List user saved shipping & billing addresses | `200` |
| `POST` | `/api/v1/users/addresses` | Authenticated | Add a new shipping address | `201`, `400` |
| `PUT` | `/api/v1/users/addresses/{id}/default` | Authenticated | Set address as primary default | `200`, `404` |
| `DELETE`| `/api/v1/users/addresses/{id}` | Authenticated | Delete saved shipping address | `200`, `404` |
| `GET` | `/api/v1/users/me/permissions` | Authenticated | Introspect active roles, 45 permissions, and vendor ID | `200` |
| `GET` | `/api/v1/admin/rbac/roles` | `ROLE_ADMIN` | List all 4 roles and their bound permissions | `200`, `403` |
| `GET` | `/api/v1/admin/rbac/permissions`| `ROLE_ADMIN` | List all 45 fine-grained system permissions | `200`, `403` |
| `GET` | `/api/v1/admin/rbac/users/{userId}/roles` | `ROLE_ADMIN` | View target user's active roles & effective permissions | `200`, `404` |
| `PUT` | `/api/v1/admin/rbac/users/{userId}/roles` | `ROLE_SUPER_ADMIN` | Assign or modify user roles | `200`, `400`, `403` |
| `PUT` | `/api/v1/admin/rbac/roles/{roleName}/permissions` | `ROLE_SUPER_ADMIN` | Update permissions assigned to a role | `200`, `403` |

---

### Group 3: Product Catalog, Taxonomy & Search
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | List hierarchical category tree | `200` |
| `GET` | `/api/v1/categories/{slug}` | Public | Get category details by slug | `200`, `404` |
| `GET` | `/api/v1/brands` | Public | List active manufacturer & designer brands | `200` |
| `GET` | `/api/v1/products` | Public | Search and filter catalog (keyword, category, price, rating) | `200` |
| `GET` | `/api/v1/products/{slug}` | Public | Get complete product detail with variants, images & attributes | `200`, `404` |
| `GET` | `/api/v1/products/featured` | Public | Get curated high-rating featured products | `200` |
| `POST` | `/api/v1/vendor/products` | `ROLE_VENDOR` | Create draft hardware product | `201`, `400` |
| `PUT` | `/api/v1/vendor/products/{id}` | `ROLE_VENDOR` (Tenant) | Update owned vendor product | `200`, `403`, `404` |
| `PUT` | `/api/v1/admin/products/{id}/status` | `ROLE_ADMIN` | Approve or reject vendor product submission | `200`, `403` |
| `GET` | `/api/v1/search/autocomplete` | Public | Sub-10ms trigram autocomplete search suggestions | `200` |
| `GET` | `/api/v1/bundles` | Public | List curated hardware kits & modular package sets | `200` |
| `POST` | `/api/v1/quotes` | Public / Customer | Submit B2B architectural hardware RFQ with BOQ items | `201`, `400` |

---

### Group 4: Inventory & Warehouse Reservations
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/inventory/products/{productId}/stock` | Public | Check available stock across all warehouses | `200`, `404` |
| `POST` | `/api/v1/inventory/reservations` | Public / Customer | Create temporary checkout stock reservation lock (TTL 15m) | `201`, `409` |
| `DELETE`| `/api/v1/inventory/reservations/{reservationId}` | Public / Customer | Release reserved stock on cart cancellation | `200` |
| `GET` | `/api/v1/vendor/warehouses` | `ROLE_VENDOR` | List fulfillment warehouses and stock allocations | `200` |
| `POST` | `/api/v1/vendor/inventory/adjust` | `ROLE_VENDOR` | Reconcile stock counts & safety stock thresholds | `200`, `400` |

---

### Group 5: Shopping Cart, Multi-Vendor Checkout & Orders
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Public / Session | Fetch active multi-vendor cart with subtotal & tax preview | `200` |
| `POST` | `/api/v1/cart/items` | Public / Session | Add item or variant to shopping cart | `200`, `400`, `409` |
| `PUT` | `/api/v1/cart/items/{itemId}` | Public / Session | Update item quantity in cart | `200`, `404` |
| `DELETE`| `/api/v1/cart/items/{itemId}` | Public / Session | Remove line item from cart | `200`, `404` |
| `POST` | `/api/v1/checkout/process` | Authenticated | Create multi-vendor split order (`#10001` -> `#10001-A`, `#10001-B`) | `201`, `400` |
| `GET` | `/api/v1/orders` | Authenticated | List customer personal order history | `200` |
| `GET` | `/api/v1/orders/{orderNumber}` | Authenticated (Owner) | Get master order summary & vendor breakdown | `200`, `404` |
| `GET` | `/api/v1/vendor/orders` | `ROLE_VENDOR` | List assigned vendor fulfillment sub-orders | `200` |
| `PUT` | `/api/v1/vendor/orders/{subOrderNumber}/status` | `ROLE_VENDOR` (Tenant) | Update sub-order fulfillment (PROCESSING, SHIPPED, DELIVERED) | `200`, `403` |

---

### Group 6: Payments, Webhooks & Settlements
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/create-intent` | Authenticated | Initialize Razorpay / Stripe payment transaction intent | `200`, `400` |
| `POST` | `/api/v1/payments/verify` | Authenticated | Verify cryptographic payment signature | `200`, `400` |
| `POST` | `/api/v1/payments/webhook` | Public (Signature Verified) | Idempotent gateway webhook callback | `200` |
| `GET` | `/api/v1/vendor/wallet` | `ROLE_VENDOR` (Tenant) | Get vendor wallet balance, pending escrow & earnings | `200` |
| `POST` | `/api/v1/vendor/wallet/payouts` | `ROLE_VENDOR` | Request payout withdrawal to verified bank account | `201`, `400` |
| `GET` | `/api/v1/admin/settlements/cycles` | `ROLE_ADMIN` | View settlement cycles and payout batches | `200`, `403` |
| `POST` | `/api/v1/admin/settlements/payouts/{id}/approve` | `ROLE_ADMIN` | Approve vendor payout request | `200`, `403` |

---

### Group 7: Logistics, Returns, Reviews & Support
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/logistics/calculate-rate` | Public | Calculate shipping fee matrix by weight slab & pincode zone | `200` |
| `GET` | `/api/v1/logistics/track/{trackingNumber}` | Public | Real-time carrier checkpoint tracking history | `200`, `404` |
| `POST` | `/api/v1/returns` | Authenticated (Customer) | Submit 7-day return request with proof photos | `201`, `400` |
| `PUT` | `/api/v1/vendor/returns/{id}/decision` | `ROLE_VENDOR` (Tenant) | Accept or reject vendor return request | `200`, `403` |
| `GET` | `/api/v1/reviews/product/{productId}` | Public | List verified purchase reviews & helpful counts | `200` |
| `POST` | `/api/v1/reviews` | Authenticated (Customer) | Post verified product review with 1-5 rating & photos | `201`, `400` |
| `POST` | `/api/v1/support/tickets` | Authenticated | Create customer or vendor support dispute ticket | `201`, `400` |
| `POST` | `/api/v1/support/tickets/{id}/messages` | Authenticated (Owner) | Post reply message in support dispute thread | `201`, `403` |

---

### Group 8: System Observability & Audit
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Live database connectivity and memory diagnostic probe | `200`, `503` |
| `GET` | `/actuator/health` | Public | Spring Boot Actuator liveness & readiness probes | `200` |
| `GET` | `/api/v1/admin/audit-logs` | `ROLE_ADMIN` | Inspect tamper-evident audit trail logs | `200`, `403` |

---

## 3. Swagger UI Interactive Groups

The Swagger UI on `/swagger-ui.html` provides 6 pre-configured drop-down exploration groups:
1. `01-All-Marketplace-APIs`: Complete OpenAPI document encompassing all endpoints.
2. `02-Storefront-Public-APIs`: Consumer shopping experience, instant search, and reviews.
3. `03-Customer-Account-APIs`: Auth, profile, cart, checkout, payments, and personal orders.
4. `04-Vendor-Portal-APIs`: Seller dashboard, catalog creation, sub-order dispatch, and wallets.
5. `05-Admin-Operations-APIs`: Platform moderation, KYC approvals, and RBAC governance.
6. `06-System-Diagnostics-APIs`: Currencies, taxes, pricing matrix, and audit logs.
