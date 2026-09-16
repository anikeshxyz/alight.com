"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  FileText,
  Percent,
  PackageCheck,
  Wallet,
  Check,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { settlementService } from "@/services/settlement-service";
import { paymentService } from "@/services/payment-service";
import {
  SettlementOverview,
  VendorPayout,
  PaymentTransaction,
  PayoutStatus,
  PaymentTransactionStatus,
  PaymentGatewayType,
  DeliveredSettlement,
  VendorWallet,
  SettlementRecord,
  SettlementPolicy,
  SettlementRateCard,
  VendorDebtRecovery,
  ReconciliationRecord,
  SettlementDomainStatus,
} from "@/types/payment";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  runAutoSettlementApi,
  getPayoutBatchesApi,
  processPayoutBatchApi,
} from "@/services/compliance-service";
import { PayoutBatch, AutoSettlementResult } from "@/types/compliance";

export default function AdminSettlementsPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [overview, setOverview] = useState<SettlementOverview | null>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [deliveredSettlements, setDeliveredSettlements] = useState<DeliveredSettlement[]>([]);
  const [wallets, setWallets] = useState<VendorWallet[]>([]);
  const [settlementQueue, setSettlementQueue] = useState<SettlementRecord[]>([]);
  const [policies, setPolicies] = useState<SettlementPolicy[]>([]);
  const [rateCards, setRateCards] = useState<SettlementRateCard[]>([]);
  const [recoveries, setRecoveries] = useState<VendorDebtRecovery[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "delivered" | "queue" | "wallets" | "payouts" | "recoveries" | "reconciliation" | "transactions" | "batches"
  >("queue");
  const [autoSettlementRunning, setAutoSettlementRunning] = useState(false);
  const [autoSettlementResult, setAutoSettlementResult] = useState<AutoSettlementResult | null>(null);

  // Filters
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>("ALL");
  const [txSearchTerm, setTxSearchTerm] = useState<string>("");
  const [deliveredSearchTerm, setDeliveredSearchTerm] = useState<string>("");
  const [deliveredStatusFilter, setDeliveredStatusFilter] = useState<string>("ALL");
  const [queueSearchTerm, setQueueSearchTerm] = useState<string>("");
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>("ALL");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [releaseFeedback, setReleaseFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);

  // Settlement Hold Modal
  const [holdModal, setHoldModal] = useState<{ open: boolean; settlement: SettlementRecord | null; reason: string }>({
    open: false,
    settlement: null,
    reason: "",
  });
  const [isProcessingHold, setIsProcessingHold] = useState(false);

  // Manual Adjustment Modal
  const [adjustmentModal, setAdjustmentModal] = useState<{
    open: boolean;
    vendorId: string;
    amount: string;
    type: "CREDIT" | "DEBIT";
    description: string;
  }>({
    open: false,
    vendorId: "",
    amount: "",
    type: "CREDIT",
    description: "",
  });
  const [isProcessingAdjustment, setIsProcessingAdjustment] = useState(false);

  // Reconciliation actions
  const [reconRunning, setReconRunning] = useState(false);
  const [reconFeedback, setReconFeedback] = useState<string | null>(null);

  // Payout Approval Modal
  const [selectedPayout, setSelectedPayout] = useState<VendorPayout | null>(null);
  const [payoutModalType, setPayoutModalType] = useState<"approve" | "reject" | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Offline Bank Transfer Approve Modal
  const [selectedBankTx, setSelectedBankTx] = useState<PaymentTransaction | null>(null);
  const [bankApprovalNotes, setBankApprovalNotes] = useState("");
  const [isApprovingBank, setIsApprovingBank] = useState(false);

  // Refund Modal
  const [selectedRefundTx, setSelectedRefundTx] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [
        overviewRes,
        payoutsRes,
        txRes,
        batchRes,
        deliveredRes,
        walletsRes,
        queueRes,
        policiesRes,
        rateCardsRes,
        recoveriesRes,
        reconRes,
      ] = await Promise.all([
        settlementService.getAdminOverview(token),
        settlementService.getAdminPayouts(
          token,
          payoutStatusFilter !== "ALL" ? (payoutStatusFilter as PayoutStatus) : undefined,
          0,
          50
        ),
        paymentService.getAdminTransactions(token, 0, 50),
        getPayoutBatchesApi(0, 50),
        settlementService.getDeliveredSettlements(token),
        settlementService.getAllWallets(token),
        settlementService.getSettlementsQueue(token, undefined, 0, 50),
        settlementService.getPolicies(token),
        settlementService.getRateCards(token),
        settlementService.getRecoveries(token, 0, 50),
        settlementService.getReconciliationRecords(token, undefined, 0, 50),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (payoutsRes.success && payoutsRes.data) {
        setPayouts(payoutsRes.data.content);
      }
      if (txRes.success && txRes.data) {
        setTransactions(txRes.data.content);
      }
      if (batchRes && batchRes.success && batchRes.data) {
        setBatches(batchRes.data.content);
      }
      if (deliveredRes && deliveredRes.success && deliveredRes.data) {
        setDeliveredSettlements(deliveredRes.data);
      }
      if (walletsRes && walletsRes.success && walletsRes.data) {
        setWallets(walletsRes.data);
      }
      if (queueRes && queueRes.success && queueRes.data) {
        setSettlementQueue(queueRes.data.content || []);
      }
      if (policiesRes && policiesRes.success && policiesRes.data) {
        setPolicies(policiesRes.data);
      }
      if (rateCardsRes && rateCardsRes.success && rateCardsRes.data) {
        setRateCards(rateCardsRes.data);
      }
      if (recoveriesRes && recoveriesRes.success && recoveriesRes.data) {
        setRecoveries(recoveriesRes.data.content || []);
      }
      if (reconRes && reconRes.success && reconRes.data) {
        setReconciliations(reconRes.data.content || []);
      }
    } catch (err) {
      console.error("Error loading admin settlement data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, payoutStatusFilter]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleReleaseEscrow = async (vendorOrderId: string, subOrderNumber: string) => {
    if (!token) return;
    setReleasingId(vendorOrderId);
    setReleaseFeedback(null);
    try {
      const res = await settlementService.releaseEscrow(vendorOrderId, token);
      if (res.success) {
        setReleaseFeedback({ id: vendorOrderId, message: `Escrow released for ${subOrderNumber}! Funds credited to vendor wallet.` });
        await loadAllData();
      } else {
        setReleaseFeedback({ id: vendorOrderId, message: res.message || "Failed to release escrow.", isError: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error releasing escrow.";
      setReleaseFeedback({ id: vendorOrderId, message, isError: true });
    } finally {
      setReleasingId(null);
    }
  };

  const handleApprovePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPayout) return;
    if (!utrNumber.trim()) {
      setActionError("Please enter the Bank UTR / NEFT reference number.");
      return;
    }

    setIsProcessingAction(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await settlementService.approvePayout(
        selectedPayout.id,
        utrNumber,
        adminNotes,
        token
      );
      if (res.success) {
        setActionSuccess("Payout marked as DISBURSED successfully!");
        await loadAllData();
        setTimeout(() => {
          setPayoutModalType(null);
          setSelectedPayout(null);
          setUtrNumber("");
          setAdminNotes("");
          setActionSuccess("");
        }, 1200);
      } else {
        setActionError(res.message || "Failed to approve payout.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error approving payout.";
      setActionError(message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPayout) return;
    if (!rejectionReason.trim()) {
      setActionError("Please state a clear rejection reason for the vendor.");
      return;
    }

    setIsProcessingAction(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await settlementService.rejectPayout(
        selectedPayout.id,
        rejectionReason,
        adminNotes,
        token
      );
      if (res.success) {
        setActionSuccess("Payout REJECTED and funds refunded to vendor wallet.");
        await loadAllData();
        setTimeout(() => {
          setPayoutModalType(null);
          setSelectedPayout(null);
          setRejectionReason("");
          setAdminNotes("");
          setActionSuccess("");
        }, 1200);
      } else {
        setActionError(res.message || "Failed to reject payout.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error rejecting payout.";
      setActionError(message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleApproveBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedBankTx) return;

    setIsApprovingBank(true);
    try {
      const res = await paymentService.approveBankTransfer(
        selectedBankTx.id,
        token,
        bankApprovalNotes
      );
      if (res.success) {
        setSelectedBankTx(null);
        setBankApprovalNotes("");
        await loadAllData();
      } else {
        alert(res.message || "Failed to approve bank transfer.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving bank transfer.");
    } finally {
      setIsApprovingBank(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedRefundTx) return;

    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid refund amount.");
      return;
    }

    setIsRefunding(true);
    try {
      const res = await paymentService.processRefund(
        selectedRefundTx.id,
        amountNum,
        refundReason || "Customer request / Admin initiated refund",
        token
      );
      if (res.success) {
        setSelectedRefundTx(null);
        setRefundAmount("");
        setRefundReason("");
        await loadAllData();
      } else {
        alert(res.message || "Failed to process refund.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing refund.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRunAutoSettlement = async () => {
    setAutoSettlementRunning(true);
    try {
      const res = await runAutoSettlementApi();
      if (res.success && res.data) {
        setAutoSettlementResult(res.data);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAutoSettlementRunning(false);
    }
  };

  const handleProcessBatch = async (batchId: string) => {
    try {
      const res = await processPayoutBatchApi(batchId);
      if (res.success) {
        const batchRes = await getPayoutBatchesApi(0, 50);
        if (batchRes.success && batchRes.data) {
          setBatches(batchRes.data.content);
        }
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPayoutBadge = (status: PayoutStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "PROCESSING":
        return <Badge variant="info">In Progress</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved</Badge>;
      case "PAID":
        return <Badge variant="success">Disbursed</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getTxStatusBadge = (status: PaymentTransactionStatus) => {
    switch (status) {
      case "CAPTURED":
        return <Badge variant="success">CAPTURED</Badge>;
      case "AUTHORIZED":
        return <Badge variant="warning">AUTHORIZED / PENDING APPROVAL</Badge>;
      case "INITIATED":
        return <Badge variant="neutral">INITIATED</Badge>;
      case "FAILED":
        return <Badge variant="danger">FAILED</Badge>;
      case "REFUNDED":
        return <Badge variant="danger">REFUNDED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getGatewayBadge = (gateway: PaymentGatewayType) => {
    switch (gateway) {
      case "RAZORPAY":
        return <Badge variant="info" className="font-mono text-[10px]">RAZORPAY</Badge>;
      case "STRIPE":
        return <Badge variant="primary" className="font-mono text-[10px]">STRIPE</Badge>;
      case "BANK_TRANSFER":
        return <Badge variant="warning" className="font-mono text-[10px]">BANK / NEFT</Badge>;
      case "MOCK":
        return <Badge variant="neutral" className="font-mono text-[10px]">MOCK SANDBOX</Badge>;
      default:
        return <Badge variant="neutral" className="font-mono text-[10px]">{gateway}</Badge>;
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (!txSearchTerm) return true;
    const term = txSearchTerm.toLowerCase();
    return (
      tx.transactionReference?.toLowerCase().includes(term) ||
      tx.gatewayOrderId?.toLowerCase().includes(term) ||
      tx.gatewayPaymentId?.toLowerCase().includes(term) ||
      tx.orderNumber?.toLowerCase().includes(term) ||
      tx.orderId?.toLowerCase().includes(term)
    );
  });

  const filteredDelivered = deliveredSettlements.filter((item) => {
    const isSettled = Boolean(item.isSettled || item.settled);
    if (deliveredStatusFilter === "SETTLED" && !isSettled) return false;
    if (deliveredStatusFilter === "PENDING" && isSettled) return false;
    if (!deliveredSearchTerm) return true;
    const term = deliveredSearchTerm.toLowerCase();
    return (
      Boolean(item.subOrderNumber && item.subOrderNumber.toLowerCase().includes(term)) ||
      Boolean(item.masterOrderNumber && item.masterOrderNumber.toLowerCase().includes(term)) ||
      Boolean(item.vendorStoreName && item.vendorStoreName.toLowerCase().includes(term))
    );
  });

  const handleHoldSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !holdModal.settlement) return;
    if (!holdModal.reason.trim()) {
      alert("Please enter a valid hold reason.");
      return;
    }
    setIsProcessingHold(true);
    try {
      const res = await settlementService.holdSettlement(holdModal.settlement.id, holdModal.reason, token);
      if (res.success) {
        setHoldModal({ open: false, settlement: null, reason: "" });
        await loadAllData();
      } else {
        alert(res.message || "Failed to place hold.");
      }
    } catch (err) {
      console.error(err);
      alert("Error placing settlement hold.");
    } finally {
      setIsProcessingHold(false);
    }
  };

  const handleReleaseSettlementHold = async (settlementId: string) => {
    if (!token) return;
    if (!confirm("Release hold on this settlement? It will resume standard eligibility evaluation.")) return;
    try {
      const res = await settlementService.releaseSettlementHold(settlementId, token);
      if (res.success) {
        await loadAllData();
      } else {
        alert(res.message || "Failed to release hold.");
      }
    } catch (err) {
      console.error(err);
      alert("Error releasing settlement hold.");
    }
  };

  const handleApproveSettlement = async (settlementId: string) => {
    if (!token) return;
    try {
      const res = await settlementService.approveSettlement(settlementId, token);
      if (res.success) {
        await loadAllData();
      } else {
        alert(res.message || "Failed to approve settlement.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving settlement.");
    }
  };

  const handleTriggerGatewayRecon = async () => {
    if (!token) return;
    setReconRunning(true);
    setReconFeedback(null);
    try {
      const res = await settlementService.runGatewayReconciliation(token);
      if (res.success) {
        setReconFeedback(res.message || "Gateway reconciliation completed.");
        await loadAllData();
      } else {
        setReconFeedback(res.message || "Gateway reconciliation failed.");
      }
    } catch (err) {
      console.error(err);
      setReconFeedback("Error triggering gateway reconciliation.");
    } finally {
      setReconRunning(false);
    }
  };

  const handleTriggerPayoutRecon = async () => {
    if (!token) return;
    setReconRunning(true);
    setReconFeedback(null);
    try {
      const res = await settlementService.runPayoutReconciliation(token);
      if (res.success) {
        setReconFeedback(res.message || "Payout reconciliation completed.");
        await loadAllData();
      } else {
        setReconFeedback(res.message || "Payout reconciliation failed.");
      }
    } catch (err) {
      console.error(err);
      setReconFeedback("Error triggering payout reconciliation.");
    } finally {
      setReconRunning(false);
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const amountNum = parseFloat(adjustmentModal.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid adjustment amount.");
      return;
    }
    if (!adjustmentModal.description.trim()) {
      alert("Please state a mandatory reason/description for this ledger adjustment.");
      return;
    }
    setIsProcessingAdjustment(true);
    try {
      const res = await settlementService.applyManualAdjustment(
        {
          vendorId: adjustmentModal.vendorId,
          amount: amountNum,
          type: adjustmentModal.type,
          description: adjustmentModal.description,
        },
        token
      );
      if (res.success) {
        setAdjustmentModal({ open: false, vendorId: "", amount: "", type: "CREDIT", description: "" });
        await loadAllData();
      } else {
        alert(res.message || "Failed to create manual adjustment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating manual adjustment.");
    } finally {
      setIsProcessingAdjustment(false);
    }
  };

  const getSettlementStatusBadge = (status: SettlementDomainStatus) => {
    switch (status) {
      case "SETTLED":
        return <Badge variant="success">SETTLED & CREDITED</Badge>;
      case "APPROVED":
        return <Badge variant="success">APPROVED</Badge>;
      case "ELIGIBLE":
        return <Badge variant="info">ELIGIBLE (READY)</Badge>;
      case "ELIGIBILITY_EVALUATION":
        return <Badge variant="warning">RETURN WINDOW ACTIVE</Badge>;
      case "CREATED":
        return <Badge variant="neutral">ESCROW HELD (TRANSIT)</Badge>;
      case "CALCULATED":
        return <Badge variant="info">CALCULATED</Badge>;
      case "ON_HOLD":
        return <Badge variant="danger">ADMIN RISK HOLD</Badge>;
      case "REVERSED":
        return <Badge variant="danger">ESCROW REVERSED</Badge>;
      case "ADJUSTED":
        return <Badge variant="warning">POST-RETURN ADJUSTED</Badge>;
      case "DISPUTED":
        return <Badge variant="danger">DISPUTED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredQueue = settlementQueue.filter((s) => {
    if (queueStatusFilter !== "ALL" && s.status !== queueStatusFilter) return false;
    if (!queueSearchTerm) return true;
    const term = queueSearchTerm.toLowerCase();
    return (
      (s.subOrderNumber && s.subOrderNumber.toLowerCase().includes(term)) ||
      (s.settlementNumber && s.settlementNumber.toLowerCase().includes(term)) ||
      (s.vendorStoreName && s.vendorStoreName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-brand-emerald-800" />
            Payments, Escrow & Settlements Control Center
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Global marketplace treasury, multi-gateway transaction auditing, and vendor payout disbursement authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAutoSettlement}
            disabled={autoSettlementRunning}
            className="flex items-center gap-1.5 bg-brand-emerald-800 text-white text-xs"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${autoSettlementRunning ? "animate-spin" : ""}`} />
            <span>{autoSettlementRunning ? "Settling Orders..." : "Run Escrow Auto-Settlement"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Global Escrow & Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-slate-900 text-white p-5 rounded-xl border border-brand-slate-800 shadow-xs relative overflow-hidden">
          <div className="text-xs text-brand-slate-400 font-medium flex justify-between">
            <span>Total In Escrow</span>
            <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white mt-2">
            {formatMoney(overview?.totalPlatformEscrowHold || 0)}
          </div>
          <p className="text-[11px] text-brand-slate-400 mt-2">
            Held in marketplace custody awaiting customer delivery & return window
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-brand-slate-200 shadow-xs">
          <div className="text-xs text-brand-slate-500 font-medium flex justify-between">
            <span>Vendor Available Balances</span>
            <Building2 className="w-4 h-4 text-brand-emerald-700" />
          </div>
          <div className="text-2xl font-black tracking-tight text-brand-slate-900 mt-2">
            {formatMoney(overview?.totalAvailableForPayout || 0)}
          </div>
          <p className="text-[11px] text-brand-slate-500 mt-2">
            Released to sellers, eligible for withdrawal
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-brand-slate-200 shadow-xs">
          <div className="text-xs text-brand-slate-500 font-medium flex justify-between">
            <span>Marketplace Commissions</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black tracking-tight text-brand-slate-900 mt-2">
            {formatMoney(overview?.totalCommissionsCollected || 0)}
          </div>
          <p className="text-[11px] text-brand-slate-500 mt-2">
            Total gross commission revenue earned
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-brand-slate-200 shadow-xs">
          <div className="text-xs text-brand-slate-500 font-medium flex justify-between">
            <span>GST TCS Deductions</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black tracking-tight text-brand-slate-900 mt-2">
            {formatMoney(overview?.totalTcsDeducted || 0)}
          </div>
          <p className="text-[11px] text-brand-slate-500 mt-2">
            Statutory tax remitted under Sec 52 CGST Act
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-brand-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="border-b border-brand-slate-200 px-6 pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("queue")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "queue"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <Scale className="w-4 h-4" />
              Settlement Queue & Policies ({settlementQueue.length})
            </button>
            <button
              onClick={() => setActiveTab("recoveries")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "recoveries"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Debt Recoveries & Clawbacks ({recoveries.length})
            </button>
            <button
              onClick={() => setActiveTab("reconciliation")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "reconciliation"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Reconciliation Engine ({reconciliations.length})
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "delivered"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              Delivered Orders & Escrow ({deliveredSettlements.length})
            </button>
            <button
              onClick={() => setActiveTab("wallets")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "wallets"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Vendor Balances & Wallets ({wallets.length})
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
              Vendor Payout Authorizations ({payouts.length})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "transactions"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Gateway Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "batches"
                  ? "border-brand-emerald-800 text-brand-emerald-900"
                  : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Payout Batches ({batches.length})
            </button>
          </div>

          {activeTab === "queue" && (
            <div className="pb-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-brand-slate-500 font-medium">Status:</span>
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="text-xs border border-brand-slate-200 rounded-lg px-2.5 py-1 text-brand-slate-700 bg-brand-slate-50 focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="RETURN_WINDOW_ACTIVE">Return Window Active</option>
                  <option value="ELIGIBLE">Eligible (Ready)</option>
                  <option value="SETTLED">Settled & Credited</option>
                  <option value="ON_HOLD">Admin Risk Hold</option>
                  <option value="PENDING_DELIVERY">In Transit</option>
                  <option value="ADJUSTED">Adjusted</option>
                </select>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-brand-slate-400" />
                <input
                  type="text"
                  placeholder="Search Sub-Order / Store / Ref..."
                  value={queueSearchTerm}
                  onChange={(e) => setQueueSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1 border border-brand-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {activeTab === "recoveries" && (
            <div className="pb-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdjustmentModal({ open: true, vendorId: "", amount: "", type: "CREDIT", description: "" })}
                className="flex items-center gap-1 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand-emerald-800" />
                <span>Create Manual Adjustment</span>
              </Button>
            </div>
          )}

          {activeTab === "reconciliation" && (
            <div className="pb-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerGatewayRecon}
                disabled={reconRunning}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reconRunning ? "animate-spin" : ""}`} />
                <span>Reconcile Gateway vs Escrow</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerPayoutRecon}
                disabled={reconRunning}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reconRunning ? "animate-spin" : ""}`} />
                <span>Reconcile Bank vs Payouts</span>
              </Button>
            </div>
          )}

          {activeTab === "delivered" && (
            <div className="pb-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-brand-slate-500 font-medium">Status:</span>
                <select
                  value={deliveredStatusFilter}
                  onChange={(e) => setDeliveredStatusFilter(e.target.value)}
                  className="text-xs border border-brand-slate-200 rounded-lg px-2.5 py-1 text-brand-slate-700 bg-brand-slate-50 focus:outline-hidden"
                >
                  <option value="ALL">All Delivered Orders</option>
                  <option value="SETTLED">Settled (Released to Wallet)</option>
                  <option value="PENDING">Pending Escrow Release</option>
                </select>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-brand-slate-400" />
                <input
                  type="text"
                  placeholder="Search Sub-Order / Store..."
                  value={deliveredSearchTerm}
                  onChange={(e) => setDeliveredSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1 border border-brand-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="pb-3 flex items-center gap-2">
              <span className="text-[11px] text-brand-slate-500 font-medium">Status:</span>
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="text-xs border border-brand-slate-200 rounded-lg px-2.5 py-1 text-brand-slate-700 bg-brand-slate-50 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="PROCESSING">Processing</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Disbursed (Paid)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="pb-3 flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-brand-slate-400" />
                <input
                  type="text"
                  placeholder="Search Tx / Order Ref..."
                  value={txSearchTerm}
                  onChange={(e) => setTxSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1 border border-brand-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Release Feedback Banner */}
        {releaseFeedback && (
          <div
            className={`px-6 py-3 flex items-center justify-between text-xs font-semibold ${
              releaseFeedback.isError
                ? "bg-red-50 text-red-700 border-b border-red-200"
                : "bg-emerald-50 text-brand-emerald-900 border-b border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {releaseFeedback.isError ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-700" />
              )}
              <span>{releaseFeedback.message}</span>
            </div>
            <button
              onClick={() => setReleaseFeedback(null)}
              className="text-brand-slate-400 hover:text-brand-slate-600 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab: Settlement Queue & Policies */}
        {activeTab === "queue" && (
          <div>
            {/* Policy & Rate Card Context Header */}
            <div className="p-4 bg-brand-slate-50 border-b border-brand-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-brand-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate-400">Configured Policy</span>
                <div className="font-bold text-brand-slate-900 mt-1">
                  {policies[0]?.policyName || "Default Standard Marketplace Policy"}
                </div>
                <div className="text-brand-slate-500 text-[11px] mt-0.5">
                  Return Window: <strong className="text-brand-emerald-800">{policies[0]?.returnWindowDays || 7} Days</strong> after confirmed delivery
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-brand-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate-400">Rate Card Engine</span>
                <div className="font-bold text-brand-slate-900 mt-1">
                  {rateCards[0]?.rateCardCode || "RC-DEFAULT"} (v{rateCards[0]?.version || 1})
                </div>
                <div className="text-brand-slate-500 text-[11px] mt-0.5">
                  Commission: <strong>{rateCards[0]?.commissionRate || 10}%</strong> • Logistics: ₹{rateCards[0]?.logisticsFeeFixed || 0}
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-brand-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate-400">Statutory Tax Engine</span>
                <div className="font-bold text-brand-slate-900 mt-1">
                  Sec 52 CGST Act (TCS)
                </div>
                <div className="text-brand-slate-500 text-[11px] mt-0.5">
                  Statutory Withholding: <strong>1.00%</strong> of Net Taxable Supply
                </div>
              </div>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Sub-Order / Ref</th>
                    <th className="px-6 py-3.5">Vendor Store</th>
                    <th className="px-6 py-3.5">Return Window Expiry</th>
                    <th className="px-6 py-3.5 text-right">Gross Sales</th>
                    <th className="px-6 py-3.5 text-right">Deductions</th>
                    <th className="px-6 py-3.5 text-right">Net Payable</th>
                    <th className="px-6 py-3.5 text-center">Settlement Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-brand-slate-400">
                        Loading settlement queue...
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-brand-slate-400">
                        No settlements in queue matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-brand-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-brand-slate-900">
                            {item.subOrderNumber}
                          </div>
                          <div className="text-[10px] text-brand-slate-400 font-mono mt-0.5">
                            Ref: {item.settlementNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-brand-slate-900">
                            {item.vendorStoreName || "Marketplace Seller"}
                          </div>
                          <div className="text-[10px] text-brand-slate-400 font-mono">
                            ID: {item.vendorId?.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-brand-slate-600">
                          {item.eligibleAt ? (
                            <>
                              <div className="font-medium text-brand-slate-800">
                                {new Date(item.eligibleAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-[10px] text-brand-slate-400">
                                {new Date(item.eligibleAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </>
                          ) : (
                            <span className="text-brand-slate-400 italic">Pending Delivery</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-brand-slate-700">
                          {formatMoney(item.grossAmount)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-brand-slate-600">
                          <div className="font-medium text-red-600">
                            -{formatMoney(Number(item.platformCommission || 0) + Number(item.taxWithholdingAmount || 0))}
                          </div>
                          <div className="text-[10px] text-brand-slate-400">
                            Comm: {formatMoney(item.platformCommission)} • TCS: {formatMoney(item.taxWithholdingAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="text-sm font-black text-brand-emerald-800">
                            {formatMoney(item.netPayableAmount)}
                          </div>
                          <div className="text-[10px] text-brand-slate-400">Liquid Release</div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getSettlementStatusBadge(item.status)}
                          {item.holdReason && (
                            <div className="text-[10px] text-red-600 font-mono mt-0.5 max-w-[150px] truncate mx-auto" title={item.holdReason}>
                              Hold: {item.holdReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-1.5">
                          {item.status === "ON_HOLD" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReleaseSettlementHold(item.id)}
                              className="text-xs text-brand-emerald-800 border-brand-emerald-300 hover:bg-emerald-50 py-1 px-2"
                            >
                              <PlayCircle className="w-3.5 h-3.5 mr-1" />
                              Release Hold
                            </Button>
                          ) : item.status === "ELIGIBLE" ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApproveSettlement(item.id)}
                              className="text-xs bg-brand-emerald-800 text-white hover:bg-brand-emerald-900 py-1 px-2.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Settle Now
                            </Button>
                          ) : item.status !== "SETTLED" && item.status !== "REVERSED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setHoldModal({ open: true, settlement: item, reason: "" })}
                              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 py-1 px-2"
                            >
                              <PauseCircle className="w-3.5 h-3.5 mr-1" />
                              Hold
                            </Button>
                          ) : (
                            <span className="text-[11px] text-brand-slate-400 italic">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Debt Recoveries & Clawbacks */}
        {activeTab === "recoveries" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Recovery Ref</th>
                  <th className="px-6 py-3.5">Vendor Store</th>
                  <th className="px-6 py-3.5">Originating Sub-Order / RMA</th>
                  <th className="px-6 py-3.5 text-right">Initial Debt</th>
                  <th className="px-6 py-3.5 text-right">Clawback Recovered</th>
                  <th className="px-6 py-3.5 text-right">Remaining Due</th>
                  <th className="px-6 py-3.5 text-center">Recovery Status</th>
                  <th className="px-6 py-3.5">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-brand-slate-400">
                      Loading debt recoveries...
                    </td>
                  </tr>
                ) : recoveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-brand-slate-400">
                      No active vendor debt recoveries recorded. All sellers in good standing.
                    </td>
                  </tr>
                ) : (
                  recoveries.map((rec) => (
                    <tr key={rec.id} className="hover:bg-brand-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-brand-slate-900">
                          {rec.recoveryReference}
                        </div>
                        <div className="text-[10px] text-brand-slate-400">
                          {rec.notes || "Post-Settlement Customer Return Clawback"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-brand-slate-900">
                          {rec.vendorStoreName || "Marketplace Seller"}
                        </div>
                        <div className="text-[10px] text-brand-slate-400 font-mono">
                          ID: {rec.vendorId?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-brand-slate-700">
                        <div>Ref: {rec.recoveryReference}</div>
                        <div className="text-[10px] text-brand-slate-400">{rec.notes || "Clawback against future settlements"}</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-red-600">
                        {formatMoney(rec.originalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-semibold text-brand-emerald-700">
                        +{formatMoney(rec.recoveredAmount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-sm font-black text-red-700">
                          {formatMoney(rec.remainingAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {rec.status === "COMPLETED" ? (
                          <Badge variant="success">RECOVERED</Badge>
                        ) : rec.status === "PARTIALLY_RECOVERED" ? (
                          <Badge variant="warning">PARTIAL CLAWBACK</Badge>
                        ) : (
                          <Badge variant="danger">RECOVERY PENDING</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-slate-500">
                        {new Date(rec.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Reconciliation Engine */}
        {activeTab === "reconciliation" && (
          <div>
            {reconFeedback && (
              <div className="p-3 bg-brand-slate-900 text-white text-xs flex items-center justify-between border-b border-brand-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold-400" />
                  <span>{reconFeedback}</span>
                </div>
                <button
                  onClick={() => setReconFeedback(null)}
                  className="text-brand-slate-400 hover:text-white text-xs font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Reconciliation Type</th>
                    <th className="px-6 py-3.5">Batch / Transaction Ref</th>
                    <th className="px-6 py-3.5 text-right">Expected Amount</th>
                    <th className="px-6 py-3.5 text-right">Actual Provider Amt</th>
                    <th className="px-6 py-3.5 text-right">Variance / Discrepancy</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5">Audit Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-brand-slate-400">
                        Loading reconciliation audit records...
                      </td>
                    </tr>
                  ) : reconciliations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-brand-slate-400">
                        No reconciliation records available. Click one of the Reconcile buttons above to run an automated balance audit.
                      </td>
                    </tr>
                  ) : (
                    reconciliations.map((rec) => (
                      <tr key={rec.id} className="hover:bg-brand-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-brand-slate-900 font-mono">
                            {rec.reconciliationType}
                          </div>
                          <div className="text-[10px] text-brand-slate-400">
                            Secured Three-Way Match
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-brand-slate-700">
                          {rec.recordReference || rec.externalReference || rec.ledgerReference || rec.id}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-brand-slate-900">
                          {formatMoney(rec.expectedAmount)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-brand-slate-900">
                          {formatMoney(rec.actualAmount)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div
                            className={`font-black ${
                              Number(rec.differenceAmount || 0) === 0 ? "text-brand-emerald-700" : "text-red-600"
                            }`}
                          >
                            {formatMoney(rec.differenceAmount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {rec.status === "MATCHED" ? (
                            <Badge variant="success">MATCHED 100%</Badge>
                          ) : rec.status === "DISCREPANCY" ? (
                            <Badge variant="danger">DISCREPANCY DETECTED</Badge>
                          ) : (
                            <Badge variant="warning">{rec.status}</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-brand-slate-500">
                          {new Date(rec.reconciledAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Delivered Orders & Settlements */}
        {activeTab === "delivered" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Sub-Order / Order</th>
                  <th className="px-6 py-3.5">Vendor Store</th>
                  <th className="px-6 py-3.5">Delivered At</th>
                  <th className="px-6 py-3.5 text-right">Gross Total</th>
                  <th className="px-6 py-3.5 text-right">Commission</th>
                  <th className="px-6 py-3.5 text-right">GST TCS (1%)</th>
                  <th className="px-6 py-3.5 text-right">Net Settlement</th>
                  <th className="px-6 py-3.5 text-center">Settlement Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-brand-slate-400">
                      Loading delivered settlements...
                    </td>
                  </tr>
                ) : filteredDelivered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-brand-slate-400">
                      No delivered orders matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDelivered.map((item) => (
                    <tr key={item.vendorOrderId} className="hover:bg-brand-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-brand-slate-900">
                          {item.subOrderNumber}
                        </div>
                        <div className="text-[10px] text-brand-slate-400 font-mono mt-0.5">
                          Order #{item.masterOrderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-brand-slate-900">
                          {item.vendorStoreName || "Marketplace Seller"}
                        </div>
                        <div className="text-[10px] text-brand-slate-400 font-mono">
                          ID: {item.vendorId?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-slate-600">
                        {item.deliveredAt ? (
                          <>
                            <div className="font-medium text-brand-slate-800">
                              {new Date(item.deliveredAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[10px] text-brand-slate-400">
                              {new Date(item.deliveredAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </>
                        ) : (
                          <span className="text-brand-slate-400 italic">Delivered recently</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-brand-slate-700">
                        {formatMoney(item.grossAmount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-brand-slate-600">
                        <div className="font-medium text-red-600">-{formatMoney(item.commissionAmount)}</div>
                        <div className="text-[10px] text-brand-slate-400">({item.commissionRate}%)</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-brand-slate-600">
                        <div className="font-medium text-amber-600">-{formatMoney(item.tcsAmount)}</div>
                        <div className="text-[10px] text-brand-slate-400">Sec 52</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-sm font-black text-brand-emerald-800">
                          {formatMoney(item.netSettlementAmount)}
                        </div>
                        <div className="text-[10px] text-brand-slate-400">Net to Seller</div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {Boolean(item.isSettled || item.settled) ? (
                          <Badge variant="success" className="font-bold flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" />
                            SETTLED & RELEASED
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="font-bold flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            IN ESCROW HOLD
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {Boolean(item.isSettled || item.settled) ? (
                          <span className="text-[11px] font-semibold text-brand-emerald-700 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In Available Balance
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleReleaseEscrow(item.vendorOrderId, item.subOrderNumber)}
                            disabled={releasingId === item.vendorOrderId}
                            className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white text-xs px-2.5 py-1"
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 mr-1 ${releasingId === item.vendorOrderId ? "animate-spin" : ""}`} />
                            {releasingId === item.vendorOrderId ? "Releasing..." : "Release to Wallet"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Vendor Wallets & Balances */}
        {activeTab === "wallets" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Vendor Store</th>
                  <th className="px-6 py-3.5 text-right">Available Balance (Withdrawable)</th>
                  <th className="px-6 py-3.5 text-right">Pending Escrow Hold</th>
                  <th className="px-6 py-3.5 text-right">Total Earnings</th>
                  <th className="px-6 py-3.5 text-right">Total Disbursed</th>
                  <th className="px-6 py-3.5 text-right">Commissions Paid</th>
                  <th className="px-6 py-3.5">Bank Details</th>
                  <th className="px-6 py-3.5 text-center">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-brand-slate-400">
                      Loading vendor wallets...
                    </td>
                  </tr>
                ) : wallets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-brand-slate-400">
                      No vendor wallets registered.
                    </td>
                  </tr>
                ) : (
                  wallets.map((w) => (
                    <tr key={w.id} className="hover:bg-brand-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-brand-slate-900 text-sm">
                          {w.vendorStoreName || "Store"}
                        </div>
                        <div className="text-[10px] text-brand-slate-400 font-mono">
                          Vendor ID: {w.vendorId?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-base font-black text-brand-emerald-800">
                          {formatMoney(w.availableBalance)}
                        </div>
                        <div className="text-[10px] text-brand-emerald-600 font-medium">Eligible for Payout</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-bold text-amber-700">
                          {formatMoney(w.pendingBalance)}
                        </div>
                        <div className="text-[10px] text-brand-slate-400">Awaiting Delivery</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-brand-slate-800">
                        {formatMoney(w.totalEarnings)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-brand-slate-600">
                        {formatMoney(w.totalWithdrawn)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-brand-slate-600">
                        <div>{formatMoney(w.totalCommissionPaid)}</div>
                        <div className="text-[10px] text-brand-slate-400">TCS: {formatMoney(w.totalTcsPaid)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-slate-700">
                        {w.bankAccountNumber ? (
                          <>
                            <div className="font-semibold text-brand-slate-800">{w.bankName || "Bank"}</div>
                            <div className="font-mono text-[11px] text-brand-slate-500">
                              A/C: {w.bankAccountNumber} • {w.bankIfscCode}
                            </div>
                            <div className="text-[10px] text-brand-slate-400">{w.bankAccountHolderName}</div>
                          </>
                        ) : (
                          <span className="text-brand-slate-400 italic">No bank account linked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {w.isPayoutEnabled ? (
                          <Badge variant="success">ENABLED</Badge>
                        ) : (
                          <Badge variant="danger">DISABLED</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 1: Payout Requests */}
        {activeTab === "payouts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Vendor</th>
                  <th className="px-6 py-3.5">Bank Information</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      Loading vendor payout requests...
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      No payout requests found.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-brand-slate-900">
                          {p.payoutReference}
                        </div>
                        <div className="text-[10px] text-brand-slate-400 mt-0.5">
                          {new Date(p.requestedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-brand-slate-900">
                          {p.vendorStoreName || "Vendor"}
                        </div>
                        <div className="text-[10px] text-brand-slate-400 font-mono">
                          ID: {p.vendorId?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-slate-700">
                        <div className="font-semibold text-brand-slate-800">{p.bankName}</div>
                        <div className="text-[11px] font-mono text-brand-slate-600">
                          A/C: {p.bankAccountNumber} • IFSC: {p.bankIfscCode}
                        </div>
                        <div className="text-[10px] text-brand-slate-400">
                          Beneficiary: {p.bankAccountHolderName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPayoutBadge(p.status)}
                        {p.utrNumber && (
                          <div className="text-[10px] font-mono text-brand-emerald-800 mt-0.5 font-bold">
                            UTR: {p.utrNumber}
                          </div>
                        )}
                        {p.rejectionReason && (
                          <div className="text-[10px] text-red-600 mt-0.5 max-w-xs truncate">
                            {p.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-brand-slate-900 whitespace-nowrap text-sm">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        {p.status === "PENDING" ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedPayout(p);
                                setPayoutModalType("approve");
                                setUtrNumber(`UTR${Date.now()}`);
                              }}
                              className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white text-xs px-2.5 py-1"
                            >
                              Disburse
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayout(p);
                                setPayoutModalType("reject");
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2.5 py-1"
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] text-brand-slate-400 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Customer Transactions */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Gateway & Ref</th>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Payment Method</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      Loading customer gateway transactions...
                    </td>
                  </tr>
                ) : filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brand-slate-400">
                      No customer transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getGatewayBadge(tx.gatewayType)}
                        </div>
                        <div className="text-[11px] font-mono text-brand-slate-800 font-semibold mt-1">
                          {tx.transactionReference || tx.gatewayPaymentId || tx.id.substring(0, 8)}
                        </div>
                        <div className="text-[10px] text-brand-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-brand-slate-700 whitespace-nowrap">
                        {tx.orderNumber || tx.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTxStatusBadge(tx.transactionStatus)}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-600 whitespace-nowrap">
                        {tx.paymentMethod || "CARD / UPI"}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-brand-slate-900 whitespace-nowrap text-sm">
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        {tx.gatewayType === "BANK_TRANSFER" && tx.transactionStatus === "AUTHORIZED" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedBankTx(tx)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1"
                          >
                            Approve NEFT
                          </Button>
                        )}
                        {tx.transactionStatus === "CAPTURED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefundTx(tx);
                              setRefundAmount(tx.amount.toString());
                            }}
                            className="text-xs text-brand-slate-600 px-2.5 py-1"
                          >
                            Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Payout Batches */}
        {activeTab === "batches" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-500 uppercase tracking-wider font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Batch Reference</th>
                  <th className="px-6 py-3.5">Payouts Count</th>
                  <th className="px-6 py-3.5">Gateway / Bank Ref</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Total Amount</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-brand-slate-400">
                      Loading automated payout batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-brand-slate-400">
                      No automated settlement batches generated yet. Click &quot;Run Automated Settlement Engine&quot; above.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-brand-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-brand-slate-900">
                        {b.batchReference}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-600">
                        <span className="font-semibold text-brand-slate-900">{b.payoutCount}</span> payouts bundled
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-brand-slate-500">
                        {b.bankBatchId || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {b.status === "COMPLETED" ? (
                          <Badge variant="success">Completed</Badge>
                        ) : b.status === "PROCESSING" ? (
                          <Badge variant="info">Processing</Badge>
                        ) : b.status === "PENDING" ? (
                          <Badge variant="warning">Pending Disbursal</Badge>
                        ) : (
                          <Badge variant="danger">{b.status}</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-brand-slate-500">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-brand-slate-900">
                        {formatMoney(b.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {b.status === "PENDING" ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleProcessBatch(b.id)}
                            className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-[11px] py-1 px-2.5"
                          >
                            Disburse Batch
                          </Button>
                        ) : (
                          <span className="text-[11px] text-brand-slate-400 font-medium">
                            {b.status === "COMPLETED" ? "Disbursed" : "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Approval / Reject Modal */}
      {payoutModalType && selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <h3 className="text-base font-bold text-brand-slate-900">
                {payoutModalType === "approve"
                  ? "Authorize & Record Bank Disbursement"
                  : "Reject Vendor Payout"}
              </h3>
              <button
                onClick={() => setPayoutModalType(null)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="bg-brand-slate-50 p-3 rounded-lg border border-brand-slate-200 text-xs space-y-1.5 my-4">
              <div className="flex justify-between">
                <span className="text-brand-slate-500">Vendor:</span>
                <span className="font-bold text-brand-slate-900">{selectedPayout.vendorStoreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-slate-500">Payout Amount:</span>
                <span className="font-black text-brand-slate-900">
                  {formatMoney(selectedPayout.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-slate-500">Bank Account:</span>
                <span className="font-medium text-brand-slate-800">
                  {selectedPayout.bankName} (A/C: {selectedPayout.bankAccountNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-slate-500">IFSC Code:</span>
                <span className="font-mono font-medium text-brand-slate-800">
                  {selectedPayout.bankIfscCode}
                </span>
              </div>
            </div>

            {payoutModalType === "approve" ? (
              <form onSubmit={handleApprovePayout} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Bank UTR / NEFT / IMPS Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFCN123456789"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 font-mono uppercase border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Internal Settlement Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Batch #402 NEFT processed via corporate netbanking"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-emerald-800"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPayoutModalType(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isProcessingAction}
                    className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-semibold"
                  >
                    {isProcessingAction ? "Authorizing..." : "Authorize Payout"}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRejectPayout} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Rejection Reason (Visible to Vendor) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Bank account IFSC is invalid, please update bank details and re-apply."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-red-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPayoutModalType(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isProcessingAction}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {isProcessingAction ? "Rejecting..." : "Confirm Rejection & Refund"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Offline Bank Transfer Approval Modal */}
      {selectedBankTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <h3 className="text-base font-bold text-brand-slate-900">
                Confirm B2B Bank Transfer / NEFT Receipt
              </h3>
              <button
                onClick={() => setSelectedBankTx(null)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-slate-600 mt-3">
              Confirming this transaction will mark the customer&apos;s order as <strong>CONFIRMED</strong> and credit the escrow balance for vendor fulfillment.
            </p>

            <div className="bg-brand-slate-50 p-3 rounded-lg border border-brand-slate-200 text-xs space-y-1 my-3 font-mono">
              <div>Order: {selectedBankTx.orderNumber || selectedBankTx.orderId}</div>
              <div>Amount: {formatMoney(selectedBankTx.amount)}</div>
              <div>Transfer Ref: {selectedBankTx.transactionReference}</div>
            </div>

            <form onSubmit={handleApproveBankTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Confirmation Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified in ICICI Corporate Current A/C"
                  value={bankApprovalNotes}
                  onChange={(e) => setBankApprovalNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBankTx(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isApprovingBank}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isApprovingBank ? "Verifying..." : "Approve & Credit Escrow"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {selectedRefundTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <h3 className="text-base font-bold text-brand-slate-900">
                Process Payment Refund
              </h3>
              <button
                onClick={() => setSelectedRefundTx(null)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRefund} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Refund Amount (Max {formatMoney(selectedRefundTx.amount)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedRefundTx.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Refund Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer return approved / Out of stock item"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRefundTx(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isRefunding}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {isRefunding ? "Processing..." : "Confirm Refund"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hold Settlement Modal */}
      {holdModal.open && holdModal.settlement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <h3 className="text-base font-bold text-brand-slate-900 flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-600" />
                Place Settlement on Administrative Hold
              </h3>
              <button
                onClick={() => setHoldModal({ open: false, settlement: null, reason: "" })}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-slate-600 mt-3">
              Placing this settlement on hold blocks automated maturity release to the vendor&apos;s available wallet balance.
            </p>

            <div className="bg-brand-slate-50 p-3 rounded-lg border border-brand-slate-200 text-xs space-y-1 my-3 font-mono">
              <div>Sub-Order: {holdModal.settlement.subOrderNumber}</div>
              <div>Vendor: {holdModal.settlement.vendorStoreName || holdModal.settlement.vendorId}</div>
              <div>Net Payable: {formatMoney(holdModal.settlement.netPayableAmount)}</div>
            </div>

            <form onSubmit={handleHoldSettlement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Reason for Administrative Hold *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Active RMA dispute investigation / Chargeback query / Fraud suspicion"
                  value={holdModal.reason}
                  onChange={(e) => setHoldModal({ ...holdModal, reason: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHoldModal({ open: false, settlement: null, reason: "" })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isProcessingHold}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isProcessingHold ? "Placing Hold..." : "Confirm Hold"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {adjustmentModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-100">
              <h3 className="text-base font-bold text-brand-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-brand-emerald-800" />
                Post Immutable Ledger Adjustment
              </h3>
              <button
                onClick={() => setAdjustmentModal({ open: false, vendorId: "", amount: "", type: "CREDIT", description: "" })}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-slate-600 mt-2">
              Creates a double-entry ledger entry affecting the seller&apos;s liquid payable balance. Every adjustment requires an auditable justification.
            </p>

            <form onSubmit={handleManualAdjustment} className="space-y-3.5 mt-3">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Vendor *
                </label>
                <select
                  required
                  value={adjustmentModal.vendorId}
                  onChange={(e) => setAdjustmentModal({ ...adjustmentModal, vendorId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden"
                >
                  <option value="">Select Vendor Store</option>
                  {wallets.map((w) => (
                    <option key={w.vendorId} value={w.vendorId}>
                      {w.vendorStoreName || "Store"} ({w.vendorId.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={adjustmentModal.type}
                    onChange={(e) => setAdjustmentModal({ ...adjustmentModal, type: e.target.value as "CREDIT" | "DEBIT" })}
                    className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="CREDIT">SELLER_CREDIT (+)</option>
                    <option value="DEBIT">SELLER_DEBIT (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 500.00"
                    value={adjustmentModal.amount}
                    onChange={(e) => setAdjustmentModal({ ...adjustmentModal, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Mandatory Justification / Ledger Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Compensation for lost carrier transit shipment #SUB-10492 approved by Finance Director"
                  value={adjustmentModal.description}
                  onChange={(e) => setAdjustmentModal({ ...adjustmentModal, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-brand-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustmentModal({ open: false, vendorId: "", amount: "", type: "CREDIT", description: "" })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isProcessingAdjustment}
                  className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-semibold"
                >
                  {isProcessingAdjustment ? "Posting..." : "Post Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
