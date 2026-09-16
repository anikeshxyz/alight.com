# Stage 7: Vendor Management & Multi-Tenancy Onboarding Specification

## Executive Overview
Stage 7 provides the multi-tenant seller foundation for the Alight International Multi-Vendor Marketplace. It enables vendor self-onboarding, KYC verification, store configuration, policies, custom domains, vacation mode, and administrative moderation.

---

## Key Features & Multi-Tenant Controls

### 1. Vendor Onboarding Lifecycle
- **Multi-Step Onboarding:** Tracks vendor progress across legal information, banking details, KYC documents, and warehouse pickup locations.
- **KYC Statuses:** `DRAFT` $\to$ `PENDING_VERIFICATION` $\to$ `APPROVED` / `REJECTED` / `SUSPENDED`.
- **Automatic Role Escalation:** When an application is approved by an administrator, the associated user profile is automatically granted `ROLE_VENDOR`.

### 2. Store Configuration & Custom Policies
- **Custom Branding:** Store logos, promotional banners, description, and contact info.
- **Store Policies:** Custom Markdown-supported shipping policies, return policies, and privacy policies.
- **Custom Domain & Subdomains:** Multi-tenant support for custom vendor storefront domains (e.g. `crafts.alightmarketplace.com`).
- **Store Vacation Mode:** Sellers can temporarily pause store operations and display custom notices to customers.
- **Order Handling:** Configuration for auto-accepting orders and setting store-specific minimum checkout amounts.

### 3. Banking & KYC Document Storage
- Legal business name, business entity type (`INDIVIDUAL`, `SOLE_PROPRIETORSHIP`, `PARTNERSHIP`, `PRIVATE_LIMITED`, `PUBLIC_LIMITED`).
- Tax identifiers (GSTIN, PAN, VAT, EIN).
- Bank account details (Account number, IFSC/routing code, Bank name, Account holder).
- Document verification URLs for business licenses, tax certificates, and identity proofs.

### 4. Admin Moderation & Commission Control
- Filter and search vendor applications across statuses and store names.
- Approve or reject applications (with mandatory rejection reasons).
- Granular commission rate adjustments per vendor (e.g. 10.00% default, customized per contract).
- In-memory domain event dispatch (`VendorStatusChangedEvent`) for auditing and notification workflows.

---

## Schema Changes (`V33__vendor_management_and_multi_tenancy.sql`)
1. **`vendors` Table Extensions:**
   - `is_vacation_mode BOOLEAN NOT NULL DEFAULT FALSE`
   - `vacation_message VARCHAR(500)`
   - `shipping_policy TEXT`
   - `refund_policy TEXT`
   - `privacy_policy TEXT`
   - `custom_domain VARCHAR(255)`
   - `onboarding_step VARCHAR(50) NOT NULL DEFAULT 'STEP_5_COMPLETED'`
   - `auto_accept_orders BOOLEAN NOT NULL DEFAULT FALSE`
   - `minimum_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00`
2. **`vendor_business_details` Table Extensions:**
   - `business_license_url VARCHAR(512)`
   - `tax_certificate_url VARCHAR(512)`
   - `id_proof_url VARCHAR(512)`

---

## API Endpoints (`VendorController.java` & `AdminVendorController.java`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/vendors/apply` | Submit vendor onboarding application | Authenticated |
| `GET` | `/api/v1/vendors/me` | Retrieve authenticated vendor profile | Vendor |
| `PUT` | `/api/v1/vendors/me` | Update store profile details | Vendor |
| `PUT` | `/api/v1/vendors/me/settings` | Update store policies, domain & order rules | Vendor |
| `PUT` | `/api/v1/vendors/me/business-details` | Update banking and tax identifiers | Vendor |
| `PUT` | `/api/v1/vendors/me/kyc-documents` | Update KYC verification document URLs | Vendor |
| `POST` | `/api/v1/vendors/me/vacation-mode` | Toggle vacation mode with custom notice | Vendor |
| `GET` | `/api/v1/vendors/me/pickup-addresses` | List warehouse pickup locations | Vendor |
| `POST` | `/api/v1/vendors/me/pickup-addresses` | Add new pickup location | Vendor |
| `PUT` | `/api/v1/vendors/me/pickup-addresses/{id}/primary` | Designate primary warehouse location | Vendor |
| `DELETE` | `/api/v1/vendors/me/pickup-addresses/{id}` | Remove pickup location | Vendor |
| `GET` | `/api/v1/vendors/stores/{slug}` | Public vendor storefront lookup | Public |
| `GET` | `/api/v1/admin/vendors` | Paginated vendor list & search | Admin |
| `GET` | `/api/v1/admin/vendors/{id}` | Inspect vendor details & KYC | Admin |
| `PUT` | `/api/v1/admin/vendors/{id}/status` | Approve, reject, or suspend vendor | Admin |
| `PUT` | `/api/v1/admin/vendors/{id}/commission` | Configure vendor commission rate | Admin |

---

## Integration Test Suite
- Tested in [`VendorManagementIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/vendor/VendorManagementIntegrationTest.java).
