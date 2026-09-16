"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getCustomerDashboardApi } from "@/services/user-service";
import { CustomerDashboardData } from "@/types/dashboard";
import { Button } from "@/components/ui/Button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function CustomerWalletPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getCustomerDashboardApi(token)
        .then((res) => {
          if (res.success && res.data) {
            setDashboardData(res.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const balance = dashboardData?.metrics?.walletBalance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Wallet & Store Credits
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View available store credits, instant refund balances, and ledger adjustments
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-950 rounded-2xl p-6 text-white shadow-sm border border-emerald-700/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-xs font-semibold text-emerald-200/90 uppercase tracking-wider block">
              Available Store Credit Balance
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
              {formatMoney(balance)}
            </div>
            <p className="text-xs text-emerald-200/80 mt-1">
              Authoritative backend ledger balance • Instant checkout clearance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button
                variant="primary"
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none text-xs"
              >
                Use at Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Credit Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <RotateCcw className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-700">Refund Credits</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {formatMoney(0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Instant RMA returns credited to store balance
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CreditCard className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-700">Promotional Credits</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {formatMoney(0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Seasonal marketing incentives and vouchers
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-700">Escrow Holds</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {formatMoney(0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Protected escrow holds during RMA inspection
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Wallet Transactions</h2>
          <span className="text-xs text-slate-400">All historical adjustments</span>
        </div>

        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Transactions Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When you receive refunds or promotional credits, full double-entry debit and credit records will appear here.
          </p>
        </div>
      </div>

      {/* Policy Guarantee */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs text-slate-600 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">How Wallet Credits Work:</span> Store credits never expire
          and can be redeemed automatically during checkout alongside credit cards or UPI. If an order purchased
          with wallet credits is cancelled, the funds are instantly refunded back to your wallet.
        </div>
      </div>
    </div>
  );
}
