"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Store,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Receipt,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Eye,
  FileCheck,
  AlertCircle,
  Percent,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getAdminAnalyticsOverviewApi } from "@/services/analytics-service";
import { AdminAnalyticsOverview } from "@/types/analytics";

type DateRange = "TODAY" | "7D" | "30D" | "90D";

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30D");
  const [chartMetric, setChartMetric] = useState<"GMV" | "REVENUE" | "ORDERS">("GMV");
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAnalyticsOverviewApi();
      if (res.success && res.data) {
        setOverview(res.data);
      } else {
        setError(res.message || "Failed to retrieve analytics");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to reach server. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const trajectory = overview?.revenueTrajectory || [];
  const maxVal = Math.max(
    1,
    ...trajectory.map((p) =>
      chartMetric === "GMV" ? p.gmv : chartMetric === "REVENUE" ? p.netCommission : p.orderCount
    )
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Executive Operations Command Center
          </h1>
          <p className="text-xs text-brand-slate-400">
            Authoritative marketplace telemetry, settlement reconciliation, and operational governance triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-slate-800 hover:bg-brand-slate-700 text-brand-slate-300 border border-brand-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOverview}
            className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary Financial Velocity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 relative overflow-hidden group hover:border-brand-emerald-600/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-slate-400 font-medium">Gross Merchandise Value</span>
            <div className="p-1.5 rounded-lg bg-brand-gold-500/10 text-brand-gold-400 border border-brand-gold-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {loading ? "..." : `₹${(overview?.grossMerchandiseValue ?? 0).toLocaleString("en-IN")}`}
            </span>
            <div className="text-[11px] text-brand-slate-400 mt-1">
              Authoritative order transaction volume
            </div>
          </div>
        </div>

        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 group hover:border-brand-emerald-600/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-slate-400 font-medium">Net Platform Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {loading ? "..." : `₹${(overview?.netPlatformRevenue ?? 0).toLocaleString("en-IN")}`}
            </span>
            <div className="text-[11px] text-brand-slate-400 mt-1">
              Earned marketplace commissions
            </div>
          </div>
        </div>

        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 group hover:border-brand-emerald-600/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-slate-400 font-medium">Total Orders Placed</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {loading ? "..." : (overview?.totalOrdersCount ?? 0).toLocaleString("en-IN")}
            </span>
            <div className="text-[11px] text-brand-slate-400 mt-1">
              {overview?.completedOrdersCount ?? 0} orders delivered / confirmed
            </div>
          </div>
        </div>

        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 group hover:border-brand-emerald-600/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-slate-400 font-medium">Active Ecosystem</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {loading ? "..." : `${overview?.activeVendorsCount ?? 0} Vendors`}
            </span>
            <div className="text-[11px] text-brand-slate-400 mt-1">
              {overview?.activeCustomersCount ?? 0} Registered Users
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Operational Health Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-brand-slate-850 border border-brand-slate-750 rounded-xl p-3">
          <div className="text-[11px] text-brand-slate-400">Average Order Value</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {loading ? "..." : `₹${Math.round(overview?.averageOrderValue ?? 0).toLocaleString("en-IN")}`}
          </div>
        </div>
        <div className="bg-brand-slate-850 border border-brand-slate-750 rounded-xl p-3">
          <div className="text-[11px] text-brand-slate-400">Escrow in Transit</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">
            {loading ? "..." : `₹${(overview?.escrowInTransit ?? 0).toLocaleString("en-IN")}`}
          </div>
        </div>
        <div className="bg-brand-slate-850 border border-brand-slate-750 rounded-xl p-3">
          <div className="text-[11px] text-brand-slate-400">Payouts Disbursed</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {loading ? "..." : `₹${(overview?.totalPayoutsDisbursed ?? 0).toLocaleString("en-IN")}`}
          </div>
        </div>
        <div className="bg-brand-slate-850 border border-brand-slate-750 rounded-xl p-3">
          <div className="text-[11px] text-brand-slate-400">Return & Dispute Rate</div>
          <div className="text-sm font-bold text-brand-slate-200 mt-0.5">
            {loading ? "..." : `${overview?.returnDisputeRate ?? 0}%`}
          </div>
        </div>
      </div>

      {/* Operations Triage Center */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-brand-slate-700/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              Operations Governance & Triage Center
            </h2>
          </div>
          <span className="text-xs text-brand-slate-400 font-medium">Direct Access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 bg-brand-slate-900/90 border border-brand-slate-750 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Vendor Onboarding</span>
              <p className="text-[11px] text-brand-slate-400">Review new seller applications</p>
            </div>
            <Link
              href="/admin/vendors"
              className="px-2.5 py-1 bg-brand-slate-800 hover:bg-brand-slate-700 text-brand-emerald-400 border border-brand-slate-700 rounded text-xs font-medium transition-colors"
            >
              Review
            </Link>
          </div>

          <div className="p-3.5 bg-brand-slate-900/90 border border-brand-slate-750 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">KYC & Document Audit</span>
              <p className="text-[11px] text-brand-slate-400">Statutory GST/PAN compliance</p>
            </div>
            <Link
              href="/admin/compliance"
              className="px-2.5 py-1 bg-brand-slate-800 hover:bg-brand-slate-700 text-brand-emerald-400 border border-brand-slate-700 rounded text-xs font-medium transition-colors"
            >
              Inspect
            </Link>
          </div>

          <div className="p-3.5 bg-brand-slate-900/90 border border-brand-slate-750 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Product Moderation</span>
              <p className="text-[11px] text-brand-slate-400">Catalog quality inspection</p>
            </div>
            <Link
              href="/admin/products"
              className="px-2.5 py-1 bg-brand-slate-800 hover:bg-brand-slate-700 text-brand-emerald-400 border border-brand-slate-700 rounded text-xs font-medium transition-colors"
            >
              Moderate
            </Link>
          </div>

          <div className="p-3.5 bg-brand-slate-900/90 border border-brand-slate-750 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Dispute Arbitration</span>
              <p className="text-[11px] text-brand-slate-400">Buyer-seller claims desk</p>
            </div>
            <Link
              href="/admin/disputes"
              className="px-2.5 py-1 bg-brand-slate-800 hover:bg-brand-slate-700 text-rose-400 border border-brand-slate-700 rounded text-xs font-medium transition-colors"
            >
              Mediate
            </Link>
          </div>

          <div className="p-3.5 bg-brand-slate-900/90 border border-brand-slate-750 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">RMA Returns Escalation</span>
              <p className="text-[11px] text-brand-slate-400">Reverse logistics governance</p>
            </div>
            <Link
              href="/admin/returns"
              className="px-2.5 py-1 bg-brand-slate-800 hover:bg-brand-slate-700 text-brand-emerald-400 border border-brand-slate-700 rounded text-xs font-medium transition-colors"
            >
              Resolve
            </Link>
          </div>

          <div className="p-3.5 bg-brand-slate-900/90 border border-brand-slate-750 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Escrow Settlement Release</span>
              <p className="text-[11px] text-brand-slate-400">Batch ledger disbursals</p>
            </div>
            <Link
              href="/admin/settlements"
              className="px-2.5 py-1 bg-brand-slate-800 hover:bg-brand-slate-700 text-brand-emerald-400 border border-brand-slate-700 rounded text-xs font-medium transition-colors"
            >
              Disburse
            </Link>
          </div>
        </div>
      </div>

      {/* Velocity Trend Chart & Marketplace Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales & Metric Velocity Chart */}
        <div className="lg:col-span-8 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Marketplace Sales Velocity & Trajectory
              </h3>
              <p className="text-xs text-brand-slate-400">
                Authoritative chronological order trajectory
              </p>
            </div>

            <div className="flex items-center gap-1 bg-brand-slate-900 border border-brand-slate-750 p-1 rounded-lg text-xs self-start sm:self-auto">
              {(["GMV", "REVENUE", "ORDERS"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    chartMetric === m
                      ? "bg-brand-emerald-800 text-white shadow"
                      : "text-brand-slate-400 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          {trajectory.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-brand-slate-500 text-xs border-b border-brand-slate-700 gap-1.5">
              <Activity className="w-6 h-6 text-brand-slate-600" />
              <span>Not enough historical order data for trendline.</span>
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-brand-slate-700">
              {trajectory.map((pt, idx) => {
                const val = chartMetric === "GMV" ? pt.gmv : chartMetric === "REVENUE" ? pt.netCommission : pt.orderCount;
                const heightPct = Math.max(15, Math.round((val / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] text-brand-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {chartMetric === "GMV"
                        ? `₹${pt.gmv.toLocaleString("en-IN")}`
                        : chartMetric === "REVENUE"
                        ? `₹${pt.netCommission.toLocaleString("en-IN")}`
                        : `${pt.orderCount} orders`}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-brand-emerald-900 to-brand-emerald-500 rounded-t-md group-hover:from-brand-gold-600 group-hover:to-brand-gold-400 transition-all cursor-pointer shadow"
                    />
                    <span className="text-[11px] text-brand-slate-400 font-semibold">{pt.periodLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Marketplace Overview / Top Performers */}
        <div className="lg:col-span-4 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Top Marketplace Anchors</h3>
            <span className="text-[10px] text-brand-gold-400 bg-brand-gold-500/10 border border-brand-gold-500/20 px-2 py-0.5 rounded-full font-semibold">
              Live Volume
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-2">
                Top Vendors by GMV
              </div>
              {overview?.topVendors && overview.topVendors.length > 0 ? (
                <div className="space-y-1.5">
                  {overview.topVendors.slice(0, 5).map((v) => (
                    <div key={v.vendorId} className="flex items-center justify-between p-2 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750">
                      <span className="font-medium text-white truncate max-w-[140px]">{v.storeName}</span>
                      <span className="font-mono text-emerald-400 font-semibold">₹{v.grossSales.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-brand-slate-900/40 rounded-lg border border-brand-slate-750 text-center text-brand-slate-500 text-[11px]">
                  No vendor orders recorded yet.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-brand-slate-700">
              <div className="text-[11px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-2">
                Top Product Categories
              </div>
              {overview?.topCategories && overview.topCategories.length > 0 ? (
                <div className="space-y-1.5">
                  {overview.topCategories.slice(0, 5).map((c) => (
                    <div key={c.categoryName} className="flex items-center justify-between p-2 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750">
                      <span className="font-medium text-brand-slate-300 truncate max-w-[160px]">{c.categoryName}</span>
                      <span className="font-mono text-brand-gold-400 font-semibold">{c.percentageShare}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-brand-slate-900/40 rounded-lg border border-brand-slate-750 text-center text-brand-slate-500 text-[11px]">
                  No category sales recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
