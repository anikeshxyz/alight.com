"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Percent,
  RefreshCw,
  AlertCircle,
  Activity,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getAdminAnalyticsOverviewApi } from "@/services/analytics-service";
import { AdminAnalyticsOverview } from "@/types/analytics";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAnalyticsOverviewApi();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Failed to load analytics");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to retrieve analytics from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const trajectory = data?.revenueTrajectory || [];
  const maxGmv = Math.max(1, ...trajectory.map((t) => t.gmv));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-emerald-400" />
            Marketplace Analytics & BI Intelligence
          </h1>
          <p className="text-xs text-brand-slate-400">
            Authoritative platform-wide GMV trajectory, category take rates, and transaction economics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-slate-800 hover:bg-brand-slate-700 border border-brand-slate-700 text-brand-slate-200 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Financial Unit Economics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <div className="text-xs text-brand-slate-400">Gross Merchandise Value (GMV)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {loading ? "..." : `₹${(data?.grossMerchandiseValue ?? 0).toLocaleString("en-IN")}`}
          </div>
          <div className="text-[11px] text-brand-slate-400 mt-1">
            Authoritative order total
          </div>
        </div>

        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <div className="text-xs text-brand-slate-400">Net Platform Revenue</div>
          <div className="text-2xl font-bold text-brand-gold-400 mt-1">
            {loading ? "..." : `₹${(data?.netPlatformRevenue ?? 0).toLocaleString("en-IN")}`}
          </div>
          <div className="text-[11px] text-brand-slate-400 mt-1">
            Net commission earned
          </div>
        </div>

        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <div className="text-xs text-brand-slate-400">Average Order Value (AOV)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {loading ? "..." : `₹${Math.round(data?.averageOrderValue ?? 0).toLocaleString("en-IN")}`}
          </div>
          <div className="text-[11px] text-brand-slate-400 mt-1">
            Across {data?.totalOrdersCount ?? 0} orders
          </div>
        </div>

        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4">
          <div className="text-xs text-brand-slate-400">Return & Dispute Rate</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {loading ? "..." : `${data?.returnDisputeRate ?? 0}%`}
          </div>
          <div className="text-[11px] text-brand-slate-400 mt-1">
            RMA & dispute escalations
          </div>
        </div>
      </div>

      {/* Primary Analytics Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trajectory Bar Chart */}
        <div className="lg:col-span-8 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly GMV & Net Commission Velocity</h3>
              <p className="text-xs text-brand-slate-400">Comparing gross transacted value against marketplace fees</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-brand-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-emerald-500" /> Gross GMV
              </div>
              <div className="flex items-center gap-1.5 text-brand-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-gold-400" /> Commission
              </div>
            </div>
          </div>

          {trajectory.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-brand-slate-500 text-xs border-b border-brand-slate-700 gap-1.5">
              <Activity className="w-6 h-6 text-brand-slate-600" />
              <span>Not enough data for this report.</span>
            </div>
          ) : (
            <div className="h-60 flex items-end justify-between gap-4 pt-6 px-4 border-b border-brand-slate-700">
              {trajectory.map((col, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-brand-slate-400 opacity-0 group-hover:opacity-100 font-mono">
                    ₹{col.gmv.toLocaleString("en-IN")}
                  </span>
                  <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                    <div
                      style={{ height: `${Math.max(10, Math.round((col.gmv / maxGmv) * 100))}%` }}
                      className="w-1/2 bg-brand-emerald-600 rounded-t group-hover:bg-brand-emerald-500 transition-all"
                    />
                    <div
                      style={{ height: `${Math.max(5, Math.round((col.netCommission / Math.max(1, col.gmv)) * 100))}%` }}
                      className="w-1/2 bg-brand-gold-500 rounded-t group-hover:bg-brand-gold-400 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-brand-slate-400 font-semibold">{col.periodLabel}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Contribution Distribution */}
        <div className="lg:col-span-4 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">GMV by Category</h3>
            <span className="text-[10px] text-brand-slate-400 font-semibold">Share of GMV</span>
          </div>

          {data?.topCategories && data.topCategories.length > 0 ? (
            <div className="space-y-3 text-xs">
              {data.topCategories.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white truncate max-w-[170px]">{item.categoryName}</span>
                    <span className="font-mono text-brand-slate-300">{item.percentageShare}%</span>
                  </div>
                  <div className="w-full bg-brand-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div style={{ width: `${item.percentageShare}%` }} className="h-full bg-brand-emerald-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-brand-slate-900/40 rounded-xl border border-brand-slate-750 text-center text-brand-slate-500 text-xs">
              No category sales recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
