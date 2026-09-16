"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Percent,
  Receipt,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getAdminAnalyticsOverviewApi } from "@/services/analytics-service";
import {
  getAdminTaxLedgersApi,
  getGstr8SummaryApi,
  getAdminCommissionInvoicesApi,
} from "@/services/compliance-service";
import { AdminAnalyticsOverview } from "@/types/analytics";
import {
  CommissionInvoice,
  Gstr8Summary,
  TaxComplianceLedger,
} from "@/types/compliance";

export default function AdminReportsPage() {
  const { formatMoney } = useCurrency();
  const [activeTab, setActiveTab] = useState<"overview" | "gstr8" | "invoices">("overview");
  const [loading, setLoading] = useState(true);

  // Analytics state
  const [analytics, setAnalytics] = useState<AdminAnalyticsOverview | null>(null);

  // GSTR-8 & Tax Ledgers state
  const [financialYear, setFinancialYear] = useState("2025-2026");
  const [quarter, setQuarter] = useState("Q4");
  const [gstr8, setGstr8] = useState<Gstr8Summary | null>(null);
  const [taxLedgers, setTaxLedgers] = useState<TaxComplianceLedger[]>([]);

  // Commission Invoices state
  const [invoices, setInvoices] = useState<CommissionInvoice[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, gstr8Res, ledgersRes, invoicesRes] = await Promise.all([
        getAdminAnalyticsOverviewApi(),
        getGstr8SummaryApi(financialYear, quarter),
        getAdminTaxLedgersApi(0, 50),
        getAdminCommissionInvoicesApi(0, 50),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (gstr8Res.success && gstr8Res.data) {
        setGstr8(gstr8Res.data);
      }
      if (ledgersRes.success && ledgersRes.data) {
        setTaxLedgers(ledgersRes.data.content);
      }
      if (invoicesRes.success && invoicesRes.data) {
        setInvoices(invoicesRes.data.content);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [financialYear, quarter]);

  const handleExportGstr8 = () => {
    if (!gstr8) return;
    const jsonStr = JSON.stringify(gstr8, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR8_${financialYear}_${quarter}_Alight.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-gold-500/10 text-brand-gold-400 rounded-lg border border-brand-gold-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Executive Analytics & Statutory Tax Compliance Hub
            </h1>
          </div>
          <p className="text-xs text-brand-slate-400 mt-0.5">
            Platform GMV intelligence, seller revenue trajectory, GSTR-8 TCS returns, and platform commission billing.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-brand-slate-850 border border-brand-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-brand-emerald-800 text-white font-semibold shadow-xs"
                : "text-brand-slate-400 hover:text-white"
            }`}
          >
            GMV & Growth Analytics
          </button>
          <button
            onClick={() => setActiveTab("gstr8")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "gstr8"
                ? "bg-brand-emerald-800 text-white font-semibold shadow-xs"
                : "text-brand-slate-400 hover:text-white"
            }`}
          >
            GSTR-8 & Tax Ledgers
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "invoices"
                ? "bg-brand-emerald-800 text-white font-semibold shadow-xs"
                : "text-brand-slate-400 hover:text-white"
            }`}
          >
            Commission Invoices
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Top Level Executive KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-brand-slate-400">
                <span>Gross Merchandise Value (GMV)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">
                {formatMoney(analytics?.grossMerchandiseValue ?? 0)}
              </p>
              <div className="text-[11px] text-brand-slate-400 mt-1">
                Authoritative transacted volume
              </div>
            </div>

            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-brand-slate-400">
                <span>Net Platform Revenue</span>
                <Percent className="w-4 h-4 text-brand-gold-400" />
              </div>
              <p className="text-2xl font-black text-brand-gold-400 mt-1">
                {formatMoney(analytics?.netPlatformRevenue ?? 0)}
              </p>
              <span className="text-[11px] text-brand-slate-400 block mt-1">
                Total marketplace commission earned
              </span>
            </div>

            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-brand-slate-400">
                <span>Escrow in Transit</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {formatMoney(analytics?.escrowInTransit ?? 0)}
              </p>
              <span className="text-[11px] text-brand-slate-400 block mt-1">
                Pending escrow balances
              </span>
            </div>

            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-brand-slate-400">
                <span>Settlements Disbursed</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {formatMoney(analytics?.totalPayoutsDisbursed ?? 0)}
              </p>
              <span className="text-[11px] text-brand-slate-400 block mt-1">
                Net credited to vendor bank accounts
              </span>
            </div>
          </div>

          {/* Monthly Trajectory & Category Share */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-8 bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Monthly GMV Trajectory</h2>
                  <p className="text-[11px] text-brand-slate-400">Monthly sales volume and platform fees</p>
                </div>
              </div>

              {/* Bar visualization */}
              {analytics?.revenueTrajectory && analytics.revenueTrajectory.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {analytics.revenueTrajectory.map((t) => {
                    const maxGmv = Math.max(1, ...analytics.revenueTrajectory.map((tr) => tr.gmv));
                    const pct = Math.min(100, Math.round((Number(t.gmv) / maxGmv) * 100));

                    return (
                      <div key={t.periodLabel} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-brand-slate-300 w-24">{t.periodLabel}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-brand-slate-400 text-[11px]">{t.orderCount} orders</span>
                            <span className="font-bold text-white">{formatMoney(t.gmv)}</span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-brand-slate-900 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-brand-emerald-700 to-brand-gold-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-brand-slate-500">
                  Not enough historical order data for report.
                </div>
              )}
            </div>

            {/* Category Share */}
            <div className="lg:col-span-4 bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-bold text-white mb-1">Category Sales Share</h2>
              <p className="text-[11px] text-brand-slate-400 mb-4">Distribution across key marketplace verticals</p>

              {analytics?.topCategories && analytics.topCategories.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topCategories.map((c) => (
                    <div key={c.categoryName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-brand-slate-300 font-medium">{c.categoryName}</span>
                        <span className="font-bold text-brand-gold-400">{c.percentageShare}%</span>
                      </div>
                      <div className="w-full h-2 bg-brand-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-emerald-600 rounded-full"
                          style={{ width: `${c.percentageShare}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-brand-slate-500 block">
                        {formatMoney(c.salesAmount)} • {c.itemsSold} items sold
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-brand-slate-500">
                  No category sales recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Top Vendors Leaderboard */}
          <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-brand-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Vendor Performance Matrix</h2>
                <p className="text-[11px] text-brand-slate-400">Top sellers sorted by revenue, fulfillment SLAs, and buyer feedback</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-brand-slate-300">
                <thead className="bg-brand-slate-900 text-brand-slate-400 uppercase tracking-wider text-[10px] border-b border-brand-slate-800">
                  <tr>
                    <th className="px-4 py-3">Store Name</th>
                    <th className="px-4 py-3">Gross Sales</th>
                    <th className="px-4 py-3">Orders Fulfilled</th>
                    <th className="px-4 py-3">Fulfillment SLA</th>
                    <th className="px-4 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-800">
                  {analytics?.topVendors && analytics.topVendors.length > 0 ? (
                    analytics.topVendors.map((v) => (
                      <tr key={v.vendorId} className="hover:bg-brand-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-brand-gold-400" />
                          <span>{v.storeName}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{formatMoney(v.grossSales)}</td>
                        <td className="px-4 py-3 text-brand-slate-300">{v.ordersFulfilled} orders</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">{v.fulfillmentRate}%</td>
                        <td className="px-4 py-3 text-brand-gold-400 font-bold">★ {v.customerRating}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-500">
                        No vendor transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "gstr8" && (
        <div className="space-y-6">
          {/* Filter & Export Bar */}
          <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase text-brand-slate-400 font-bold mb-1">
                  Financial Year
                </label>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="text-xs bg-brand-slate-900 border border-brand-slate-750 text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-emerald-800"
                >
                  <option value="2025-2026">FY 2025-2026</option>
                  <option value="2024-2025">FY 2024-2025</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-brand-slate-400 font-bold mb-1">
                  Quarter
                </label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  className="text-xs bg-brand-slate-900 border border-brand-slate-750 text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-emerald-800"
                >
                  <option value="Q1">Q1 (Apr - Jun)</option>
                  <option value="Q2">Q2 (Jul - Sep)</option>
                  <option value="Q3">Q3 (Oct - Dec)</option>
                  <option value="Q4">Q4 (Jan - Mar)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleExportGstr8}
              variant="primary"
              className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GSTR-8 Filing JSON</span>
            </Button>
          </div>

          {/* GSTR-8 Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase text-brand-slate-400 block font-semibold">Gross Supplies</span>
              <p className="text-base font-bold text-white mt-1">
                {formatMoney(gstr8?.totalGrossSupplies ?? 0)}
              </p>
            </div>
            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase text-brand-slate-400 block font-semibold">Returns Reversals</span>
              <p className="text-base font-bold text-amber-400 mt-1">
                {formatMoney(gstr8?.totalReturnedSupplies ?? 0)}
              </p>
            </div>
            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase text-brand-slate-400 block font-semibold">Net Taxable Supplies</span>
              <p className="text-base font-bold text-emerald-400 mt-1">
                {formatMoney(gstr8?.totalNetTaxableSupplies ?? 0)}
              </p>
            </div>
            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase text-brand-slate-400 block font-semibold">1% GST TCS Collected</span>
              <p className="text-base font-bold text-brand-gold-400 mt-1">
                {formatMoney(gstr8?.totalTcsCollected ?? 0)}
              </p>
            </div>
            <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase text-brand-slate-400 block font-semibold">0.1% TDS 194-O Deducted</span>
              <p className="text-base font-bold text-blue-400 mt-1">
                {formatMoney(gstr8?.totalTdsDeducted ?? 0)}
              </p>
            </div>
          </div>

          {/* Detailed Tax Ledgers Table */}
          <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-brand-slate-800">
              <h3 className="text-sm font-bold text-white">Vendor Tax Ledgers (Section 52 TCS & Section 194-O TDS)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-brand-slate-300">
                <thead className="bg-brand-slate-900 text-brand-slate-400 uppercase tracking-wider text-[10px] border-b border-brand-slate-800">
                  <tr>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">GSTIN / PAN</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Net Taxable</th>
                    <th className="px-4 py-3">1% TCS</th>
                    <th className="px-4 py-3">0.1% TDS</th>
                    <th className="px-4 py-3">Net Disbursed</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-800">
                  {taxLedgers.map((l) => (
                    <tr key={l.id} className="hover:bg-brand-slate-800/50">
                      <td className="px-4 py-3 font-semibold text-white">{l.vendorStoreName}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-brand-slate-400">
                        {l.vendorGstin || "N/A"} / {l.vendorPan || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        Month {l.month} ({l.quarter})
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{formatMoney(l.netTaxableSupplies)}</td>
                      <td className="px-4 py-3 text-brand-gold-400 font-semibold">{formatMoney(l.tcsAmount)}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{formatMoney(l.tdsAmount)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{formatMoney(l.netPayoutDisbursed)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-brand-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Platform Commission Tax Invoices (SAC 998311)</h3>
              <p className="text-[11px] text-brand-slate-400">B2B GST invoices issued to vendors for marketplace facilitation services</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-brand-slate-300">
              <thead className="bg-brand-slate-900 text-brand-slate-400 uppercase tracking-wider text-[10px] border-b border-brand-slate-800">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Gross Sales</th>
                  <th className="px-4 py-3">Commission (ex-tax)</th>
                  <th className="px-4 py-3">18% GST</th>
                  <th className="px-4 py-3">Total Invoice</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-brand-gold-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{inv.vendorStoreName}</td>
                    <td className="px-4 py-3 text-brand-slate-300">{inv.periodMonth}/{inv.periodYear}</td>
                    <td className="px-4 py-3">{formatMoney(inv.grossSales)}</td>
                    <td className="px-4 py-3 font-medium text-white">{formatMoney(inv.commissionAmount)}</td>
                    <td className="px-4 py-3 text-brand-slate-400">
                      {formatMoney(Number(inv.cgstAmount) + Number(inv.sgstAmount) + Number(inv.igstAmount))}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{formatMoney(inv.totalInvoiceAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
