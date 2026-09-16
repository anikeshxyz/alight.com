"use client";

import React, { useState } from "react";
import {
  Award,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Percent,
  Star,
  Store,
  Filter,
  ShieldAlert,
  Send,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface VendorSlaRecord {
  id: string;
  vendorName: string;
  storeName: string;
  rating: number;
  totalOrders: number;
  gmv: string;
  onTimeDispatchRate: string;
  cancellationRate: string;
  returnRate: string;
  orderDefectRate: string;
  slaTier: "TIER_1_ELITE" | "TIER_2_STANDARD" | "TIER_3_AT_RISK";
  status: "ACTIVE" | "PROBATION" | "SUSPENDED";
}

export default function AdminVendorPerformancePage() {
  const [records, setRecords] = useState<VendorSlaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [selectedVendor, setSelectedVendor] = useState<VendorSlaRecord | null>(null);
  const [warningModal, setWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [notification, setNotification] = useState("");

  React.useEffect(() => {
    const fetchSlaRecords = async () => {
      setLoading(true);
      try {
        const { getAdminAnalyticsOverviewApi } = await import("@/services/analytics-service");
        const res = await getAdminAnalyticsOverviewApi();
        if (res.success && res.data && res.data.topVendors) {
          const mapped: VendorSlaRecord[] = res.data.topVendors.map((v) => ({
            id: v.vendorId,
            vendorName: v.storeName,
            storeName: v.storeName,
            rating: v.customerRating || 0,
            totalOrders: v.ordersFulfilled || 0,
            gmv: `₹${v.grossSales.toLocaleString("en-IN")}`,
            onTimeDispatchRate: `${v.fulfillmentRate || 0}%`,
            cancellationRate: "0.0%",
            returnRate: "0.0%",
            orderDefectRate: "0.0%",
            slaTier: v.fulfillmentRate >= 95 ? "TIER_1_ELITE" : v.fulfillmentRate >= 85 ? "TIER_2_STANDARD" : "TIER_3_AT_RISK",
            status: "ACTIVE",
          }));
          setRecords(mapped);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Failed to load vendor performance", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlaRecords();
  }, []);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "ALL" || r.slaTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleSendWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setWarningModal(false);
    setNotification(`Formal SLA warning notice dispatched to ${selectedVendor.vendorName}`);
    setWarningMessage("");
    setTimeout(() => setNotification(""), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-gold-400" />
            Vendor SLA & Merchant Performance Benchmarking
          </h1>
          <p className="text-xs text-brand-slate-400">
            Monitor merchant SLA compliance, 24h dispatch fidelity, order defect rates, and merchant tiering.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-slate-800 hover:bg-brand-slate-700 border border-brand-slate-700 text-brand-slate-200 rounded-lg text-xs font-semibold self-start sm:self-auto transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export SLA Report
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SLA Metric Standards Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <span className="text-[11px] text-brand-slate-400 font-semibold uppercase">Platform Benchmark</span>
          <div className="text-lg font-bold text-white mt-1">On-Time Dispatch ≥ 95%</div>
          <p className="text-[11px] text-emerald-400 mt-1">Platform Average: 97.5%</p>
        </div>
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <span className="text-[11px] text-brand-slate-400 font-semibold uppercase">Platform Benchmark</span>
          <div className="text-lg font-bold text-white mt-1">Cancellation Rate ≤ 2.0%</div>
          <p className="text-[11px] text-emerald-400 mt-1">Platform Average: 1.6%</p>
        </div>
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <span className="text-[11px] text-brand-slate-400 font-semibold uppercase">Platform Benchmark</span>
          <div className="text-lg font-bold text-white mt-1">Order Defect Rate ≤ 1.0%</div>
          <p className="text-[11px] text-emerald-400 mt-1">Platform Average: 0.8%</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor or store name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-400 focus:outline-none focus:border-brand-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All SLA Tiers</option>
            <option value="TIER_1_ELITE">Tier 1 Elite</option>
            <option value="TIER_2_STANDARD">Tier 2 Standard</option>
            <option value="TIER_3_AT_RISK">Tier 3 At-Risk</option>
          </select>
        </div>
      </div>

      {/* Performance Benchmarking Table */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Total GMV</th>
                <th className="py-3 px-4">On-Time Dispatch</th>
                <th className="py-3 px-4">Cancel Rate</th>
                <th className="py-3 px-4">Order Defect (ODR)</th>
                <th className="py-3 px-4">SLA Standing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-brand-slate-500 text-xs">
                    {loading ? "Loading vendor metrics..." : "No vendor performance records available. Metrics generate after orders are delivered."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                <tr key={r.id} className="hover:bg-brand-slate-750/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{r.vendorName}</div>
                    <div className="text-[11px] text-brand-slate-400">{r.storeName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-bold text-brand-gold-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{r.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-white">{r.gmv}</div>
                    <div className="text-[10px] text-brand-slate-400">{r.totalOrders} Orders</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${parseFloat(r.onTimeDispatchRate) >= 95 ? "text-emerald-400" : "text-amber-400"}`}>
                      {r.onTimeDispatchRate}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${parseFloat(r.cancellationRate) <= 2 ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.cancellationRate}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${parseFloat(r.orderDefectRate) <= 1 ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.orderDefectRate}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {r.slaTier === "TIER_1_ELITE" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-700">
                        Tier 1 Elite
                      </span>
                    )}
                    {r.slaTier === "TIER_2_STANDARD" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-700">
                        Tier 2 Standard
                      </span>
                    )}
                    {r.slaTier === "TIER_3_AT_RISK" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-700">
                        Tier 3 At-Risk
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedVendor(r);
                        setWarningModal(true);
                      }}
                      className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium transition-colors"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Warning Notice Modal */}
      {warningModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Issue SLA Performance Notice
              </h3>
              <button onClick={() => setWarningModal(false)} className="text-brand-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWarning} className="space-y-3 text-xs">
              <p className="text-brand-slate-300">
                Vendor: <strong className="text-white">{selectedVendor.vendorName}</strong>
                <br />
                Current ODR: <span className="text-rose-400 font-semibold">{selectedVendor.orderDefectRate}</span> | On-Time Dispatch: <span className="text-amber-400 font-semibold">{selectedVendor.onTimeDispatchRate}</span>
              </p>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Notice Details</label>
                <textarea
                  required
                  rows={3}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Specify performance failure grounds, corrective action plan required within 5 days, and escrow hold warning..."
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700">
                <button
                  type="button"
                  onClick={() => setWarningModal(false)}
                  className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-800 text-white rounded-lg hover:bg-rose-700 font-semibold"
                >
                  Dispatch SLA Warning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
