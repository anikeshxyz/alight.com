"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Eye,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getVendorAnalyticsOverviewApi } from "@/services/analytics-service";
import { VendorAnalyticsOverview } from "@/types/analytics";

export default function VendorAnalyticsPage() {
  const [data, setData] = useState<VendorAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"30d" | "90d" | "1y">("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await getVendorAnalyticsOverviewApi();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load analytics overview", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeframe]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Business Intelligence & Sales Analytics
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Real-Time BI Engine
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Monitor store visit conversions, average order value expansion, customer repeat velocity, and inventory turnover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-brand-slate-100 p-1 rounded-xl border border-brand-slate-200 text-xs font-semibold">
            {(["30d", "90d", "1y"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === t
                    ? "bg-white text-brand-slate-900 shadow-2xs font-bold"
                    : "text-brand-slate-600 hover:text-brand-slate-900"
                }`}
              >
                {t === "30d" ? "Past Month" : t === "90d" ? "Quarterly (90D)" : "Past Year"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CORE BI METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Gross Merchandise Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-brand-slate-900">
              ₹{(data?.totalGrossSales ?? 0).toLocaleString("en-IN")}
            </span>
            <div className="text-[11px] text-brand-slate-500 mt-1">
              Authoritative sales volume
            </div>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Fulfillment Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-brand-slate-900">
              {data ? data.fulfillmentRate.toFixed(1) : "0.0"}%
            </span>
            <p className="text-[11px] text-brand-slate-500 mt-1">SLA Benchmark: 95.0%</p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Average Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-brand-slate-900">
              ₹{data && data.totalOrdersCount > 0 ? Math.round(data.totalGrossSales / data.totalOrdersCount).toLocaleString("en-IN") : "0"}
            </span>
            <p className="text-[11px] text-brand-slate-500 mt-1">Across {data?.totalOrdersCount ?? 0} orders</p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Merchant Store Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-brand-slate-900">
              {data && data.averageRating > 0 ? `${data.averageRating.toFixed(1)} / 5.0` : "No ratings yet"}
            </span>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">Direct Verified Buyer Feedback</p>
          </div>
        </Card>
      </div>

      {/* 3. CATEGORY & DEMAND VELOCITY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border-brand-slate-200 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-brand-slate-900">Monthly Sales Trajectory</h3>
            <p className="text-xs text-brand-slate-500">Chronological sales volume per calendar period</p>
          </div>

          {data?.monthlySales && data.monthlySales.length > 0 ? (
            <div className="space-y-3 pt-1">
              {data.monthlySales.map((m, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-slate-900">{m.periodLabel}</span>
                    <span className="text-brand-slate-700">₹{m.gmv.toLocaleString("en-IN")} ({m.orderCount} orders)</span>
                  </div>
                  <div className="w-full bg-brand-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-emerald-800 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, (m.gmv / Math.max(1, data.totalGrossSales)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-brand-slate-400">
              Not enough historical sales data for trajectory.
            </div>
          )}
        </Card>

        <Card className="p-5 border-brand-slate-200 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-brand-slate-900">Inventory Turnover & Aging Health</h3>
            <p className="text-xs text-brand-slate-500">Days of inventory on-hand vs stockout velocity</p>
          </div>

          <div className="py-12 text-center text-xs text-brand-slate-400">
            UNAVAILABLE — BACKEND DATA REQUIRED
          </div>
        </Card>
      </div>
    </div>
  );
}
