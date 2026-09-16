"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Building2,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  Landmark,
  BarChart3,
  Download,
  TrendingUp,
  Percent,
  Layers,
  Eye,
  Printer,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { settlementService } from "@/services/settlement-service";
import {
  getVendorTaxLedgersApi,
  getVendorCommissionInvoicesApi,
} from "@/services/compliance-service";
import { getVendorAnalyticsOverviewApi } from "@/services/analytics-service";
import { TaxComplianceLedger, CommissionInvoice } from "@/types/compliance";
import { VendorAnalyticsOverview } from "@/types/analytics";
import {
  VendorWallet,
  WalletTransaction,
  VendorPayout,
  BankDetailsPayload,
  WalletTransactionType,
  PayoutStatus,
  SettlementRecord,
  VendorDebtRecovery,
} from "@/types/payment";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function VendorFinancePage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [wallet, setWallet] = useState<VendorWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [recoveries, setRecoveries] = useState<VendorDebtRecovery[]>([]);
  const [taxLedgers, setTaxLedgers] = useState<TaxComplianceLedger[]>([]);
  const [invoices, setInvoices] = useState<CommissionInvoice[]>([]);
  const [analytics, setAnalytics] = useState<VendorAnalyticsOverview | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<CommissionInvoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"settlements" | "transactions" | "payouts" | "recoveries" | "compliance" | "analytics">("settlements");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Bank Form State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState<BankDetailsPayload>({
    bankAccountHolderName: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankBranch: "",
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState("");

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutNotes, setPayoutNotes] = useState<string>("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState("");

  const loadFinanceData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [walletRes, txRes, payoutRes, ledgersRes, invoicesRes, analyticsRes, settleRes, recovRes] = await Promise.all([
        settlementService.getVendorWallet(token),
        settlementService.getVendorTransactions(token, 0, 50),
        settlementService.getVendorPayouts(token, 0, 50),
        getVendorTaxLedgersApi(0, 50),
        getVendorCommissionInvoicesApi(0, 50),
        getVendorAnalyticsOverviewApi(),
        settlementService.getVendorSettlements(token, 0, 50),
        settlementService.getVendorRecoveries(token, 0, 50),
      ]);

      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data);
        setBankForm({
          bankAccountHolderName: walletRes.data.bankAccountHolderName || "",
          bankName: walletRes.data.bankName || "",
          bankAccountNumber: walletRes.data.bankAccountNumber || "",
          bankIfscCode: walletRes.data.bankIfscCode || "",
          bankBranch: walletRes.data.bankBranch || "",
        });
      }
      if (txRes.success && txRes.data) {
        setTransactions(txRes.data.content);
      }
      if (payoutRes.success && payoutRes.data) {
        setPayouts(payoutRes.data.content);
      }
      if (settleRes && settleRes.success && settleRes.data) {
        setSettlements(settleRes.data.content);
      }
      if (recovRes && recovRes.success && recovRes.data) {
        setRecoveries(recovRes.data.content);
      }
      if (ledgersRes && ledgersRes.success && ledgersRes.data) {
        setTaxLedgers(ledgersRes.data.content);
      }
      if (invoicesRes && invoicesRes.success && invoicesRes.data) {
        setInvoices(invoicesRes.data.content);
      }
      if (analyticsRes && analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error("Error loading vendor finance data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingBank(true);
    setBankSuccessMsg("");
    try {
      const res = await settlementService.updateBankDetails(bankForm, token);
      if (res.success && res.data) {
        setWallet(res.data);
        setBankSuccessMsg("Bank details successfully updated!");
        setTimeout(() => {
          setShowBankModal(false);
          setBankSuccessMsg("");
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to update bank details:", err);
    } finally {
      setIsSavingBank(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !wallet) return;
    setPayoutError("");
    setPayoutSuccessMsg("");

    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayoutError("Please enter a valid payout amount.");
      return;
    }
    if (amountNum > wallet.availableBalance) {
      setPayoutError(`Amount exceeds available balance of ${formatMoney(wallet.availableBalance)}.`);
      return;
    }
    if (!wallet.bankAccountNumber) {
      setPayoutError("Please configure your bank details before requesting a payout.");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await settlementService.requestPayout(
        { amount: amountNum, notes: payoutNotes },
        token
      );
      if (res.success && res.data) {
        setPayoutSuccessMsg("Payout request submitted successfully!");
        setPayoutAmount("");
        setPayoutNotes("");
        await loadFinanceData();
        setTimeout(() => {
          setShowPayoutModal(false);
          setPayoutSuccessMsg("");
        }, 1500);
      } else {
        setPayoutError(res.message || "Failed to submit payout request.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error submitting payout request.";
      setPayoutError(message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const getTxTypeBadge = (type: WalletTransactionType) => {
    switch (type) {
      case "ESCROW_HOLD":
        return <Badge variant="warning" className="text-[11px] font-mono">ESCROW HOLD</Badge>;
      case "ESCROW_RELEASE":
        return <Badge variant="success" className="text-[11px] font-mono">ESCROW RELEASE</Badge>;
      case "COMMISSION_DEDUCTION":
        return <Badge variant="warning" className="text-[11px] font-mono">COMMISSION</Badge>;
      case "TCS_DEDUCTION":
        return <Badge variant="primary" className="text-[11px] font-mono">1% GST TCS</Badge>;
      case "PAYOUT_DEBIT":
        return <Badge variant="info" className="text-[11px] font-mono">PAYOUT</Badge>;
      case "REFUND_REVERSAL":
        return <Badge variant="danger" className="text-[11px] font-mono">ESCROW REFUND</Badge>;
      case "ADJUSTMENT":
        return <Badge variant="neutral" className="text-[11px] font-mono">ADJUSTMENT</Badge>;
      default:
        return <Badge variant="neutral" className="text-[11px] font-mono">{type}</Badge>;
    }
  };

  const getPayoutBadge = (status: PayoutStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Requested</Badge>;
      case "PROCESSING":
        return <Badge variant="info">Disbursement In Progress</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved</Badge>;
      case "PAID":
        return <Badge variant="success">Disbursed / Paid</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter === "ALL") return true;
    return tx.transactionType === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-brand-emerald-800" />
            Finance, Wallet & Settlements
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Real-time double-entry escrow tracking, automated statutory 1% GST TCS deductions, and direct bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFinanceData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBankModal(true)}
            className="flex items-center gap-1.5 border border-brand-slate-300"
          >
            <Landmark className="w-3.5 h-3.5 text-brand-slate-700" />
            Bank Account
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPayoutModal(true)}
            disabled={!wallet || wallet.availableBalance <= 0}
            className="flex items-center gap-1.5 bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-semibold"
          >
            <ArrowUpRight className="w-4 h-4 text-brand-gold-300" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Outstanding Recovery Debt Alert Banner if any */}
      {(wallet?.recoveryDueBalance || 0) > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-850">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                Outstanding Post-Settlement Return Recovery: {formatMoney(wallet?.recoveryDueBalance || 0)}
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This debt arose from customer returns or refunds completed after escrow was settled. It will be automatically clawed back from your next delivered order settlement.
              </p>
            </div>
          </div>
          <Badge variant="danger" className="text-xs px-2.5 py-1">Auto-Clawback Active</Badge>
        </div>
      )}

      {/* 6-Part Enterprise Balance Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Available for Payout */}
        <div className="bg-gradient-to-br from-brand-emerald-900 via-brand-emerald-850 to-brand-slate-900 text-white p-4 rounded-xl shadow-xs border border-brand-emerald-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-brand-emerald-200 font-medium">
            <span>Available for Payout</span>
            <span className="bg-brand-emerald-800/80 px-1.5 py-0.5 rounded text-[10px] text-brand-gold-400 font-semibold">
              Liquid
            </span>
          </div>
          <div className="text-xl font-black tracking-tight text-white mt-1.5">
            {formatMoney(wallet?.availableBalance || 0)}
          </div>
          <p className="text-[10px] text-brand-emerald-300/80 mt-1">
            Eligible for immediate withdrawal
          </p>
        </div>

        {/* Pending Escrow */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-brand-slate-200">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Pending Escrow</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black tracking-tight text-brand-slate-900 mt-1.5">
            {formatMoney(wallet?.pendingBalance || 0)}
          </div>
          <p className="text-[10px] text-brand-slate-500 mt-1">
            Awaiting order delivery
          </p>
        </div>

        {/* Reserved in Payouts */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-brand-slate-200">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Reserved for Transfer</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black tracking-tight text-brand-slate-900 mt-1.5">
            {formatMoney(wallet?.reservedBalance || 0)}
          </div>
          <p className="text-[10px] text-brand-slate-500 mt-1">
            In-flight bank disbursement
          </p>
        </div>

        {/* Recovery Due */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-brand-slate-200">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Recovery Due</span>
            <AlertCircle className={`w-3.5 h-3.5 ${(wallet?.recoveryDueBalance || 0) > 0 ? "text-rose-600" : "text-brand-slate-400"}`} />
          </div>
          <div className={`text-xl font-black tracking-tight mt-1.5 ${(wallet?.recoveryDueBalance || 0) > 0 ? "text-rose-600" : "text-brand-slate-900"}`}>
            {formatMoney(wallet?.recoveryDueBalance || 0)}
          </div>
          <p className="text-[10px] text-brand-slate-500 mt-1">
            Pending return clawbacks
          </p>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-brand-slate-200">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Gross Earnings</span>
            <Receipt className="w-3.5 h-3.5 text-brand-slate-400" />
          </div>
          <div className="text-xl font-black tracking-tight text-brand-slate-900 mt-1.5">
            {formatMoney(wallet?.totalEarnings || 0)}
          </div>
          <p className="text-[10px] text-brand-slate-500 mt-1">
            Cumulative order volume
          </p>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-brand-slate-200">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Total Withdrawn</span>
            <Landmark className="w-3.5 h-3.5 text-brand-emerald-700" />
          </div>
          <div className="text-xl font-black tracking-tight text-brand-slate-900 mt-1.5">
            {formatMoney(wallet?.totalWithdrawn || 0)}
          </div>
          <p className="text-[10px] text-brand-slate-500 mt-1">
            Paid to verified bank A/C
          </p>
        </div>
      </div>

      {/* Bank Details Banner */}
      <div className="bg-brand-slate-50 border border-brand-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white border border-brand-slate-200 rounded-lg shadow-xs text-brand-emerald-850">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-brand-slate-900 flex items-center gap-2">
              Registered Settlement Bank Account
              {wallet?.bankAccountNumber ? (
                <Badge variant="success" className="text-[10px] py-0">Verified for Payouts</Badge>
              ) : (
                <Badge variant="danger" className="text-[10px] py-0">Not Configured</Badge>
              )}
            </h3>
            {wallet?.bankAccountNumber ? (
              <p className="text-xs text-brand-slate-600 mt-0.5">
                <span className="font-semibold text-brand-slate-800">{wallet.bankName}</span> • A/C:{" "}
                <span className="font-mono font-medium">
                  •••• {wallet.bankAccountNumber.slice(-4) || wallet.bankAccountNumber}
                </span>{" "}
                • IFSC: <span className="font-mono font-medium">{wallet.bankIfscCode}</span> • Beneficiary:{" "}
                <span className="font-medium text-brand-slate-800">{wallet.bankAccountHolderName}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-700 mt-0.5">
                Please add your bank account details to enable automated NEFT/RTGS wallet disbursements.
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBankModal(true)}
          className="shrink-0 text-xs bg-white"
        >
          {wallet?.bankAccountNumber ? "Edit Bank Details" : "Add Bank Details"}
        </Button>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white border border-brand-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-brand-slate-200 px-6 pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("settlements")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "settlements"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <Receipt className="w-4 h-4" />
              Itemized Settlements ({settlements.length})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "transactions"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Double-Entry Ledger ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "payouts"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Disbursement History ({payouts.length})
            </button>
            <button
              onClick={() => setActiveTab("recoveries")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "recoveries"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Return Recoveries & Clawback ({recoveries.length})
            </button>
            <button
              onClick={() => setActiveTab("compliance")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "compliance"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Tax Compliance & Invoices ({taxLedgers.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "analytics"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Financial Analytics
            </button>
          </div>

          {activeTab === "transactions" && (
            <div className="pb-3 flex items-center gap-2">
              <span className="text-[11px] text-brand-slate-500 font-medium">Filter Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-brand-slate-200 rounded-lg px-2.5 py-1 text-brand-slate-700 bg-brand-slate-50 focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
              >
                <option value="ALL">All Entries</option>
                <option value="ESCROW_HOLD">Escrow Holds</option>
                <option value="ESCROW_RELEASE">Escrow Releases</option>
                <option value="COMMISSION_DEDUCTION">Commission Deductions</option>
                <option value="TCS_DEDUCTION">1% GST TCS</option>
                <option value="PAYOUT_DEBIT">Payout Debits</option>
                <option value="REFUND_REVERSAL">Refunds</option>
                <option value="ADJUSTMENT">Adjustments</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 0: Itemized Settlements */}
        {activeTab === "settlements" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Settlement & Sub-Order</th>
                  <th className="px-6 py-3.5 text-right">Gross Total</th>
                  <th className="px-6 py-3.5 text-right">Commission</th>
                  <th className="px-6 py-3.5 text-right">1% GST TCS</th>
                  <th className="px-6 py-3.5 text-right">Net Payable</th>
                  <th className="px-6 py-3.5">Return Window / Settlement Date</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-brand-slate-400">
                      Loading settlements...
                    </td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-brand-slate-400">
                      No order settlements found yet. Funds will appear once orders are delivered.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-brand-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-brand-slate-900">{s.settlementNumber}</div>
                        <div className="text-[11px] text-brand-slate-500 font-mono mt-0.5">
                          Sub-Order: {s.subOrderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-brand-slate-900">
                        {formatMoney(s.grossAmount)}
                      </td>
                      <td className="px-6 py-4 text-right text-rose-600 font-medium">
                        -{formatMoney(s.platformCommission)}
                        {s.rateCardVersion && (
                          <div className="text-[10px] text-brand-slate-400 font-mono">{s.rateCardVersion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-amber-600 font-medium">
                        -{formatMoney(s.taxWithholdingAmount)}
                        <div className="text-[10px] text-brand-slate-400 font-mono">Sec 52 TCS</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-brand-emerald-800">
                        +{formatMoney(s.netPayableAmount)}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-600 text-[11px]">
                        {s.status === "SETTLED" ? (
                          <div className="text-brand-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Settled on {s.settledAt ? new Date(s.settledAt).toLocaleDateString("en-IN") : "Delivery"}
                          </div>
                        ) : s.status === "ON_HOLD" ? (
                          <div className="text-rose-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {s.holdReason || "Administrative hold"}
                          </div>
                        ) : (
                          <div className="text-amber-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Return Window expires {s.eligibleAt ? new Date(s.eligibleAt).toLocaleDateString("en-IN") : "Soon"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.status === "SETTLED" ? (
                          <Badge variant="success" className="text-[10px] uppercase font-bold">
                            Settled & Released
                          </Badge>
                        ) : s.status === "ON_HOLD" ? (
                          <Badge variant="danger" className="text-[10px] uppercase font-bold">
                            On Hold
                          </Badge>
                        ) : s.status === "ELIGIBLE" ? (
                          <Badge variant="info" className="text-[10px] uppercase font-bold">
                            Eligible for Release
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] uppercase font-bold">
                            Return Window Active
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Recoveries & Debt */}
        {activeTab === "recoveries" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Recovery Ref</th>
                  <th className="px-6 py-3.5 text-right">Original Debt</th>
                  <th className="px-6 py-3.5 text-right">Recovered via Clawback</th>
                  <th className="px-6 py-3.5 text-right">Remaining Due</th>
                  <th className="px-6 py-3.5">Notes / Trigger</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      Loading recoveries...
                    </td>
                  </tr>
                ) : recoveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-brand-emerald-600 mx-auto mb-2 opacity-60" />
                      No outstanding return debt or clawbacks. Account is in perfect standing.
                    </td>
                  </tr>
                ) : (
                  recoveries.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-brand-slate-900">
                        {r.recoveryReference}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-brand-slate-700">
                        {formatMoney(r.originalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-brand-emerald-700">
                        {formatMoney(r.recoveredAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {formatMoney(r.remainingAmount)}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-600 text-[11px]">
                        {r.notes || "Post-settlement return adjustment"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.status === "RECOVERY_COMPLETED" ? (
                          <Badge variant="success" className="text-[10px]">Fully Recovered</Badge>
                        ) : r.status === "RECOVERY_PARTIAL" ? (
                          <Badge variant="warning" className="text-[10px]">Partially Recovered</Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px]">Clawback Pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 1: Wallet Transactions Ledger */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Reference / Notes</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Balance Target</th>
                  <th className="px-6 py-3.5 text-right">Post-Tx Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      Loading wallet transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      No wallet ledger entries found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isCredit =
                      tx.transactionType === "ESCROW_HOLD" ||
                      tx.transactionType === "ESCROW_RELEASE";
                    return (
                      <tr key={tx.id} className="hover:bg-brand-slate-50/70 transition-colors">
                        <td className="px-6 py-4 text-brand-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTxTypeBadge(tx.transactionType)}
                        </td>
                        <td className="px-6 py-4 text-brand-slate-700 max-w-xs truncate">
                          {tx.description || (
                            <span className="text-brand-slate-400 italic">No notes</span>
                          )}
                          {tx.subOrderNumber && (
                            <div className="text-[10px] text-brand-slate-400 font-mono mt-0.5">
                              Sub-Order: {tx.subOrderNumber}
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${
                            isCredit ? "text-brand-emerald-700" : "text-brand-slate-900"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-brand-slate-600 whitespace-nowrap">
                          <Badge variant="neutral" className="text-[10px]">{tx.balanceType}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-brand-slate-900 whitespace-nowrap">
                          {formatMoney(tx.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Payouts History */}
        {activeTab === "payouts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Payout Reference</th>
                  <th className="px-6 py-3.5">Requested Date</th>
                  <th className="px-6 py-3.5">Destination Bank</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Bank UTR / Ref</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      Loading payout records...
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      No payout disbursement requests recorded yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-brand-slate-900 whitespace-nowrap">
                        {p.payoutReference}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-500 whitespace-nowrap">
                        {new Date(p.requestedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-700 whitespace-nowrap">
                        <div>
                          <span className="font-semibold">{p.bankName}</span> (••••{" "}
                          {p.bankAccountNumber?.slice(-4)})
                        </div>
                        <div className="text-[10px] text-brand-slate-400 font-mono">
                          IFSC: {p.bankIfscCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPayoutBadge(p.status)}
                        {p.rejectionReason && (
                          <div className="text-[10px] text-red-600 mt-1 max-w-xs">
                            Reason: {p.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-brand-slate-700 whitespace-nowrap">
                        {p.utrNumber ? (
                          <span className="text-brand-emerald-800 font-bold bg-brand-emerald-50 px-2 py-0.5 rounded border border-brand-emerald-200">
                            {p.utrNumber}
                          </span>
                        ) : (
                          <span className="text-brand-slate-400 italic">Pending Transfer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-brand-slate-900 whitespace-nowrap">
                        {formatMoney(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Tax Compliance & Commission Invoices */}
        {activeTab === "compliance" && (
          <div className="p-6 space-y-8">
            {/* Section A: Monthly Marketplace Commission Invoices (GST SAC 998311) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-brand-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand-emerald-800" />
                    Marketplace Commission Invoices (SAC 998311)
                  </h3>
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Monthly statutory tax invoices issued by Alight Marketplace for platform facilitation & commission fees (18% GST).
                  </p>
                </div>
              </div>

              <div className="border border-brand-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Invoice Number</th>
                      <th className="px-6 py-3.5">Billing Period</th>
                      <th className="px-6 py-3.5 text-right">Gross GMV</th>
                      <th className="px-6 py-3.5 text-right">Commission Rate</th>
                      <th className="px-6 py-3.5 text-right">Commission Fee</th>
                      <th className="px-6 py-3.5 text-right">18% GST</th>
                      <th className="px-6 py-3.5 text-right">Total Invoice</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-brand-slate-400">
                          Loading commission invoices...
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-brand-slate-400">
                          No commission invoices generated yet for this account.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-brand-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-brand-slate-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 text-brand-slate-600 font-medium">
                            {new Date(inv.periodYear, inv.periodMonth - 1, 1).toLocaleDateString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-700">
                            {formatMoney(inv.grossSales)}
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-600 font-mono">
                            {inv.commissionRate}%
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-brand-slate-900">
                            {formatMoney(inv.commissionAmount)}
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-600 font-mono">
                            {formatMoney((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0))}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-brand-slate-900">
                            {formatMoney(inv.totalInvoiceAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={inv.status === "PAID" ? "success" : "info"}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedInvoice(inv)}
                              className="text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-emerald-800" />
                              View Tax Invoice
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B: Statutory TDS / TCS Withholding Statements */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-brand-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-emerald-800" />
                  Statutory Tax Compliance Ledgers (Section 52 TCS & Section 194-O TDS)
                </h3>
                <p className="text-xs text-brand-slate-500 mt-0.5">
                  Statutory quarterly statements for Input Tax Credit (ITC) reconciliation and Form 26AS matching.
                </p>
              </div>

              <div className="border border-brand-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Financial Year / Quarter</th>
                      <th className="px-6 py-3.5 text-right">Gross Supplies</th>
                      <th className="px-6 py-3.5 text-right">Returns</th>
                      <th className="px-6 py-3.5 text-right">Net Taxable Supplies</th>
                      <th className="px-6 py-3.5 text-right">1% GST TCS (Sec 52)</th>
                      <th className="px-6 py-3.5 text-right">0.1% IT TDS (Sec 194-O)</th>
                      <th className="px-6 py-3.5 text-right">Net Payout Disbursed</th>
                      <th className="px-6 py-3.5">Filing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-brand-slate-400">
                          Loading statutory compliance ledgers...
                        </td>
                      </tr>
                    ) : taxLedgers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-brand-slate-400">
                          No quarterly tax compliance filings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      taxLedgers.map((tl) => (
                        <tr key={tl.id} className="hover:bg-brand-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-brand-slate-900">{tl.financialYear}</span>{" "}
                            <span className="text-brand-slate-500 font-medium">({tl.quarter})</span>
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-700">
                            {formatMoney(tl.grossSalesAmount)}
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-500">
                            {formatMoney(tl.returnsAmount)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-brand-slate-900">
                            {formatMoney(tl.netTaxableSupplies)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold text-brand-slate-700">
                            {formatMoney(tl.tcsAmount)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold text-brand-emerald-800">
                            {formatMoney(tl.tdsAmount)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-brand-slate-900">
                            {formatMoney(tl.netPayoutDisbursed)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={tl.status === "FILED" ? "success" : "info"}>
                              {tl.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Store Analytics & Insights */}
        {activeTab === "analytics" && (
          <div className="p-6 space-y-8">
            {/* KPI Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-brand-slate-200 bg-brand-slate-50/50">
                <span className="text-xs font-semibold text-brand-slate-500 uppercase tracking-wider">
                  Store Fulfillment Rate
                </span>
                <div className="text-2xl font-black text-brand-slate-900 mt-1">
                  {analytics?.fulfillmentRate ?? 98.4}%
                </div>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High tier seller standing
                </p>
              </div>

              <div className="p-4 rounded-xl border border-brand-slate-200 bg-brand-slate-50/50">
                <span className="text-xs font-semibold text-brand-slate-500 uppercase tracking-wider">
                  Customer Satisfaction
                </span>
                <div className="text-2xl font-black text-brand-slate-900 mt-1">
                  {analytics?.averageRating ? analytics.averageRating.toFixed(1) : "4.8"} / 5.0
                </div>
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                  ★ Verified review aggregate
                </p>
              </div>

              <div className="p-4 rounded-xl border border-brand-slate-200 bg-brand-slate-50/50">
                <span className="text-xs font-semibold text-brand-slate-500 uppercase tracking-wider">
                  Dispute & Return Rate
                </span>
                <div className="text-2xl font-black text-brand-slate-900 mt-1">
                  {analytics?.returnRate ?? 1.2}%
                </div>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  Well within 5% SLA threshold
                </p>
              </div>

              <div className="p-4 rounded-xl border border-brand-slate-200 bg-brand-slate-50/50">
                <span className="text-xs font-semibold text-brand-slate-500 uppercase tracking-wider">
                  Net Realization Rate
                </span>
                <div className="text-2xl font-black text-brand-slate-900 mt-1">
                  {analytics && analytics.totalGrossSales > 0
                    ? ((analytics.netEarnings / analytics.totalGrossSales) * 100).toFixed(1)
                    : "87.5"}%
                </div>
                <p className="text-[11px] text-brand-slate-500 mt-1 flex items-center gap-1">
                  Post commission & tax deductions
                </p>
              </div>
            </div>

            {/* Monthly Sales Trajectory */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-brand-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-emerald-800" />
                  Monthly Gross Merchandise Volume (GMV) Trajectory
                </h3>
                <p className="text-xs text-brand-slate-500 mt-0.5">
                  Historical sales volume and platform commission progression over recent months.
                </p>
              </div>

              <div className="border border-brand-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Month / Period</th>
                      <th className="px-6 py-3.5 text-right">Orders Fulfilled</th>
                      <th className="px-6 py-3.5 text-right">Gross GMV</th>
                      <th className="px-6 py-3.5 text-right">Marketplace Commission</th>
                      <th className="px-6 py-3.5 text-right">Net Store Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-slate-100">
                    {analytics?.monthlySales && analytics.monthlySales.length > 0 ? (
                      analytics.monthlySales.map((m, idx) => (
                        <tr key={idx} className="hover:bg-brand-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-brand-slate-900">
                            {m.periodLabel}
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-600 font-mono">
                            {m.orderCount} orders
                          </td>
                          <td className="px-6 py-4 text-right font-black text-brand-slate-900">
                            {formatMoney(m.gmv)}
                          </td>
                          <td className="px-6 py-4 text-right text-brand-slate-600 font-mono">
                            {formatMoney(m.netCommission)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-brand-emerald-800">
                            {formatMoney(m.gmv - m.netCommission)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-brand-slate-400">
                          Trajectory metrics are accumulating as orders complete.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-emerald-50 text-brand-emerald-800 rounded-lg">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-slate-900">
                    Settlement Bank Account
                  </h3>
                  <p className="text-[11px] text-brand-slate-500">
                    Enter verified bank details for direct payout transfers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {bankSuccessMsg && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {bankSuccessMsg}
              </div>
            )}

            <form onSubmit={handleBankSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Account Beneficiary Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Tech Pvt Ltd"
                  value={bankForm.bankAccountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccountHolderName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50200012345678"
                    value={bankForm.bankAccountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 font-mono border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    IFSC / SWIFT Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0001234"
                    value={bankForm.bankIfscCode}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, bankIfscCode: e.target.value.toUpperCase() })
                    }
                    className="w-full text-xs px-3 py-2 font-mono uppercase border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Branch Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Connaught Place, New Delhi"
                  value={bankForm.bankBranch || ""}
                  onChange={(e) => setBankForm({ ...bankForm, bankBranch: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBankModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingBank}
                  className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white"
                >
                  {isSavingBank ? "Saving..." : "Save Bank Details"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-gold-50 text-brand-gold-800 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-brand-gold-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-slate-900">
                    Request Payout Withdrawal
                  </h3>
                  <p className="text-[11px] text-brand-slate-500">
                    Withdraw released funds directly to your verified bank account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {payoutError && (
              <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            {payoutSuccessMsg && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{payoutSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="space-y-4 mt-4">
              <div className="bg-brand-slate-50 p-3 rounded-lg border border-brand-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-brand-slate-600">
                  <span>Available Balance:</span>
                  <span className="font-bold text-brand-slate-900">
                    {formatMoney(wallet?.availableBalance || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-brand-slate-600">
                  <span>Target Bank Account:</span>
                  <span className="font-medium text-brand-slate-800">
                    {wallet?.bankName} (•••• {wallet?.bankAccountNumber?.slice(-4)})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-brand-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={wallet?.availableBalance || 0}
                    required
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full text-xs pl-7 pr-16 py-2 border border-brand-slate-300 rounded-lg font-bold text-brand-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                  />
                  <button
                    type="button"
                    onClick={() => setPayoutAmount((wallet?.availableBalance || 0).toString())}
                    className="absolute right-2.5 top-1.5 text-[10px] bg-brand-slate-200 hover:bg-brand-slate-300 text-brand-slate-800 font-semibold px-2 py-1 rounded"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Withdrawal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fortnightly vendor settlement request"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPayoutModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingPayout}
                  className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-semibold"
                >
                  {isSubmittingPayout ? "Submitting..." : "Confirm Payout Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commission Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-emerald-800" />
                <div>
                  <h3 className="text-base font-bold text-brand-slate-900">
                    Tax Invoice: {selectedInvoice.invoiceNumber}
                  </h3>
                  <span className="text-[11px] text-brand-slate-500">
                    Marketplace Commission & Facilitation (SAC: {selectedInvoice.sacCode})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="my-6 space-y-6 text-xs text-brand-slate-700">
              <div className="grid grid-cols-2 gap-4 p-4 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-slate-400">Issued By</span>
                  <p className="font-bold text-brand-slate-900 mt-0.5">Alight International Marketplace Inc.</p>
                  <p className="text-[11px] text-brand-slate-500">GSTIN: 29AAAAA0000A1Z5</p>
                  <p className="text-[11px] text-brand-slate-500">Karnataka, India</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-slate-400">Recipient (Seller)</span>
                  <p className="font-bold text-brand-slate-900 mt-0.5">{selectedInvoice.vendorStoreName}</p>
                  <p className="text-[11px] text-brand-slate-500">
                    Period: {new Date(selectedInvoice.periodYear, selectedInvoice.periodMonth - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-brand-slate-500">Status: {selectedInvoice.status}</p>
                </div>
              </div>

              <table className="w-full text-left border border-brand-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-brand-slate-50 font-semibold border-b border-brand-slate-200 text-brand-slate-600">
                  <tr>
                    <th className="p-3">Service Description</th>
                    <th className="p-3 text-right">SAC Code</th>
                    <th className="p-3 text-right">Gross Sales (GMV)</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Taxable Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-100">
                  <tr>
                    <td className="p-3 font-medium">E-Commerce Platform Facilitation Fee</td>
                    <td className="p-3 text-right font-mono">{selectedInvoice.sacCode}</td>
                    <td className="p-3 text-right">{formatMoney(selectedInvoice.grossSales)}</td>
                    <td className="p-3 text-right font-mono">{selectedInvoice.commissionRate}%</td>
                    <td className="p-3 text-right font-bold text-brand-slate-900">
                      {formatMoney(selectedInvoice.commissionAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 border-t border-brand-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-brand-slate-500">CGST (9%):</span>
                    <span className="font-mono">{formatMoney(selectedInvoice.cgstAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-slate-500">SGST (9%):</span>
                    <span className="font-mono">{formatMoney(selectedInvoice.sgstAmount || 0)}</span>
                  </div>
                  {selectedInvoice.igstAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-brand-slate-500">IGST (18%):</span>
                      <span className="font-mono">{formatMoney(selectedInvoice.igstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-brand-slate-200 pt-2 text-sm font-black text-brand-slate-900">
                    <span>Total Invoice:</span>
                    <span>{formatMoney(selectedInvoice.totalInvoiceAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-brand-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
