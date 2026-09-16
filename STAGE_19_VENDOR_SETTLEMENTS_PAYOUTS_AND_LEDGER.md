# Stage 19: Production-Grade Vendor Settlements, Payouts, Ledger & Reconciliation Architecture

## 1. Architectural Overview

The **Enterprise Settlement, Payout, Ledger & Financial Reconciliation Engine** provides an institutional-grade financial workflow for the Alight International Multi-Vendor Marketplace. It decouples immediate physical delivery from liquid financial settlement, supports multi-tier return window countdown policies, enforces strict double-entry bookkeeping with idempotency keys, manages post-settlement returns with automatic debt clawback, and abstracts payment/payout providers with automated three-way reconciliation.

```
                              +--------------------------+
                              |    Sub-Order Delivered   |
                              +------------+-------------+
                                           |
                                           v
                             +-----------------------------+
                             | SettlementEligibilityService|
                             |  Rate Card & Tax Resolvers  |
                             +--------------+--------------+
                                            |
                                            v
                             +-----------------------------+
                             |  ELIGIBILITY_EVALUATION     |
                             |  (Return Window Countdown,   |
                             |   Active RMA Dispute Holds) |
                             +--------------+--------------+
                                            |
                                (Return Window Expired)
                                            v
                             +-----------------------------+
                             |  Settlement Execution       |
                             |  (Rate Card + Tax Deduction)|
                             +--------------+--------------+
                                            |
                                            v
                             +-----------------------------+
                             |  Auto-Debt Recovery /       |
                             |  Clawback against Negative  |
                             +--------------+--------------+
                                            |
                                            v
      +-------------------------------------+-------------------------------------+
      |                                     |                                     |
      v                                     v                                     v
+-------------------+             +-------------------+                 +-------------------+
| Escrow Release    |             | Rate Card Fees    |                 | Statutory Tax     |
| Net Credit to     |             | (Commission,      |                 | Withholding       |
| Available Balance |             | Logistics, Gate)  |                 | (TCS, TDS)        |
+---------+---------+             +---------+---------+                 +---------+---------+
          |                                 |                                     |
          +---------------------------------+-------------------------------------+
                                            |
                                            v
                              +---------------------------+
                              | WalletTransaction Ledger  |
                              | (Double-Entry Debit/Credit|
                              |  & Unique Idempotency)    |
                              +---------------------------+
```

---

## 2. Core Entities & Database Structure (`V48__stage19_settlement_payout_and_ledger_architecture_upgrade.sql`)

### 2.1 Configurable Policies, Rate Cards & Tax Rules
- **`settlement_policies`**: Dynamic return window countdowns (e.g. 7 days, 15 days, 30 days) and cooling periods configurable by category, vendor, or marketplace default. Automatically holds settlements if active RMA requests or disputes exist.
- **`settlement_rate_cards`**: Versioned commission rate schedules, logistics fees, gateway fees, and marketplace fixed charges with effective date ranges.
- **`settlement_tax_rules`**: Statutory withholding rules (Section 52 GST TCS 1%, Section 194-O TDS 1%, VAT) calculated against net taxable supplies.

### 2.2 Granular Settlements & Order Items
- **`settlements`**: Domain settlement records storing immutable calculation snapshots, rate card references, tax rule references, lifecycle timestamps (`eligible_at`, `approved_at`, `settled_at`), and status (`ELIGIBILITY_EVALUATION`, `ELIGIBLE`, `ON_HOLD`, `SETTLED`, `CANCELLED`).
- **`settlement_items`**: Order-item level audit records tracking gross revenue, itemized commission, itemized tax, and item net payable for partial returns and dispute resolution.

### 2.3 Post-Settlement Adjustments & Vendor Debt Recovery
- **`settlement_adjustments`**: Tracks manual debits/credits, post-payout return refunds, penalties, and corrections.
- **`vendor_debt_recoveries`**: When a post-settlement return or clawback exceeds a vendor's liquid available balance, remaining liabilities are registered as `RECOVERY_PENDING` debt and tracked in `recovery_due_balance`.
- **Automated Clawback**: Subsequent order settlement credits automatically deduct outstanding debt liabilities until fully recovered.

### 2.4 Enterprise 6-Part Wallet Balance Model (`vendor_wallets`)
1. **`available_balance`**: Liquid funds ready for vendor payout withdrawal.
2. **`pending_balance`**: Escrow hold awaiting return window maturity or fulfillment.
3. **`reserved_balance`**: Funds locked during pending payout requests to prevent double withdrawals.
4. **`on_hold_balance`**: Funds placed on fraud/dispute/compliance hold.
5. **`recovery_due_balance`**: Outstanding negative debt owed by vendor from post-settlement refunds.
6. **`total_withdrawn`**: Cumulative successfully disbursed bank transfers.

### 2.5 True Double-Entry Transaction Ledger (`wallet_transactions`)
- Explicit `debit_amount` and `credit_amount` on every entry.
- Unique `idempotency_key` ensuring strict deduplication.
- Foreign key ties to `settlement_id`, `order_item_id`, and `payout_id`.
- Complete balance snapshot (`balance_after` and `balance_type`).

### 2.6 Payout Provider Abstraction & Three-Way Reconciliation
- **`PayoutProvider` interface**: Abstracted disbursement pipeline supporting `BankTransferProvider` with extensible adapters for automated bank webhooks/APIs.
- **`reconciliation_records`**: Automated three-way reconciliation matching Gateway vs. Escrow and Bank vs. Payout UTR with discrepancy detection.

---

## 3. Financial Lifecycle & State Transitions

### 3.1 Order Placed & Escrow Hold
- Full customer payment is held in escrow (`pending_balance`).
- Immutable `ESCROW_HOLD` ledger entry created.

### 3.2 Delivery & Eligibility Evaluation
- Order delivered does **not** instantly release liquid money.
- Order transitions into `SettlementStatus.ELIGIBILITY_EVALUATION`.
- Return window timer counts down based on applicable `SettlementPolicy`.
- Open RMA or customer disputes automatically transition settlement to `ON_HOLD`.

### 3.3 Return Window Maturity & Settlement Execution
- When `eligible_at` passes and no active RMAs exist, `SettlementEligibilityService` finalizes the settlement:
  1. Resolves active `SettlementRateCard` and `SettlementTaxRule`.
  2. Applies automated clawback against any existing `vendor_debt_recoveries`.
  3. Releases net credit to `available_balance` and decrements `pending_balance`.
  4. Records double-entry ledger transactions: `ESCROW_RELEASE`, `COMMISSION_DEDUCTION`, and `TCS_DEDUCTION`.

### 3.4 Payout Withdrawal Pipeline
- Vendor requests payout: funds atomically move from `available_balance` to `reserved_balance` with pessimistic DB locking.
- Admin reviews and approves payout: `PayoutProvider` disburses funds, records Bank UTR, clears `reserved_balance`, and increments `total_withdrawn`.
- Admin rejects payout: funds restore from `reserved_balance` back to `available_balance`.

### 3.5 Post-Settlement Return & Debt Recovery
- Customer returns an item after funds were already settled/withdrawn.
- `VendorRecoveryService` attempts to debit `available_balance`.
- Any shortfall is recorded in `vendor_debt_recoveries` and flagged in `recovery_due_balance`.
- Next settlement for that vendor automatically claws back the balance before crediting liquid funds.

---

## 4. Frontend Portals

### 4.1 Vendor Finance Portal (`/vendor/finance`)
- Real-time 6-part balance cards (`Available`, `Pending Escrow`, `Reserved`, `On Hold`, `Recovery Debt`, `Total Disbursed`).
- Active debt recovery alert banner when clawback is pending.
- Tabs for Settlements Queue (with return window countdowns), Wallet Ledger, and Payout History.
- Modal for requesting payouts with validation against unconfigured bank accounts or recovery debt.

### 4.2 Admin Settlement Center (`/admin/settlements`)
- Comprehensive overview metrics across the marketplace.
- Queue tab with real-time return window countdown badges, policy tags, and manual hold/release actions.
- Settlements audit tab with itemized fee breakdowns.
- Rate Cards & Tax Rules configuration viewers.
- Debt Recoveries tab tracking unrecovered post-settlement clawbacks.
- Manual Adjustment modal for issuing administrative debits, credits, or penalties.
- Three-Way Reconciliation tab executing live Gateway vs. Escrow and Bank vs. Ledger audits.

---

## 5. Automated Verification & Integration Suite

Verified via [`SettlementArchitectureUpgradeIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/settlement/SettlementArchitectureUpgradeIntegrationTest.java):
- [x] **Return Window Countdown Hold**: Sub-orders transition to `ELIGIBILITY_EVALUATION` upon delivery and do NOT release liquid funds prematurely.
- [x] **Maturity Auto-Release & Double-Entry Ledger**: Matured return windows automatically finalize, credit available balance, debit pending balance, and record `ESCROW_RELEASE`, `COMMISSION_DEDUCTION`, and `TCS_DEDUCTION`.
- [x] **Post-Settlement Return & Clawback**: Insufficient balance creates `VendorDebtRecovery` with status `RECOVERY_PENDING`, updates `recovery_due_balance`, and automatically claws back from subsequent settlement credits.
- [x] **Payout Reservation & Disbursement Concurrency**: Payout request locks funds in `reserved_balance`, admin approval with bank UTR disburses funds via `BankTransferProvider` and updates `totalWithdrawn`.
- [x] **Three-Way Reconciliation Engine**: Gateway vs. Escrow and Bank vs. Payout audits execute with discrepancy tracking and persistent audit trails.
- [x] **Unit Test Suite**: [`SettlementServiceTest`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/settlement/service/SettlementServiceTest.java) and [`EscrowAutomationServiceTest`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/settlement/service/EscrowAutomationServiceTest.java) passing with 100% success.
- [x] **Frontend TypeScript Validation**: `npx tsc --noEmit` executed with 0 errors.
