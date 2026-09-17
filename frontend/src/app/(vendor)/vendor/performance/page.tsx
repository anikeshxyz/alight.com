"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  RefreshCw,
  Clock,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getVendorAnalyticsOverviewApi } from "@/services/analytics-service";
import { VendorAnalyticsOverview } from "@/types/analytics";

interface PerformanceMetric {
  id: string;
  name: string;
  current: string;
  target: string;
  status: "EXCELLENT" | "HEALTHY" | "NEEDS_ATTENTION" | "CRITICAL";
  impact: string;
  recommendation: string;
}

export default function VendorPerformancePage() {
  const [data, setData] = useState<VendorAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetric | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const res = await getVendorAnalyticsOverviewApi();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load performance metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const metricsList: PerformanceMetric[] = data && data.totalOrdersCount > 0
    ? [
        {
          id: "m-dispatch",
          name: "On-Time Dispatch Rate (SLA)",
          current: data.fulfillmentRate != null ? `${data.fulfillmentRate.toFixed(1)}%` : "N/A",
          target: "> 95.0%",
          status: data.fulfillmentRate != null && data.fulfillmentRate >= 95 ? "EXCELLENT" : data.fulfillmentRate != null && data.fulfillmentRate >= 85 ? "HEALTHY" : "NEEDS_ATTENTION",
          impact: "Guarantees same-day courier dispatch badges shown to buyers on product pages.",
          recommendation: "Maintain prompt packaging and courier handover routines at your facility.",
        },
        {
          id: "m-return",
          name: "Customer Return Rate (RMA)",
          current: data.returnRate != null ? `${data.returnRate.toFixed(1)}%` : "N/A",
          target: "< 3.0%",
          status: data.returnRate != null && data.returnRate <= 3.0 ? "HEALTHY" : "NEEDS_ATTENTION",
          impact: "Low return rate protects net settlement earnings and prevents escrow holds.",
          recommendation: "Ensure accurate technical specifications and dimensions in product listings.",
        },
        {
          id: "m-rating",
          name: "Verified Customer Rating",
          current: data.averageRating != null && data.averageRating > 0 ? `${data.averageRating.toFixed(1)} / 5.0` : "No ratings yet",
          target: "> 4.50",
          status: data.averageRating != null && data.averageRating >= 4.5 ? "EXCELLENT" : "HEALTHY",
          impact: "Qualifies vendor for Featured Brand spotlight and search prominence.",
          recommendation: "Deliver consistent product quality and respond promptly to buyer queries.",
        },
      ]
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & ACCOUNT HEALTH STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Seller Account Health & SLA Scorecard
            </h1>
            <Badge variant="brand" size="sm" className="bg-emerald-50 text-emerald-800 border-emerald-200">
              {data && data.totalOrdersCount > 0 ? "Active Seller Account" : "New Account"}
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Authoritative compliance telemetry based on actual order dispatches, returns, and customer ratings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 bg-brand-slate-50 border border-brand-slate-200 rounded-xl flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-emerald-800 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-slate-500 block">Total Orders</span>
              <span className="font-extrabold text-xs text-brand-slate-900">
                {data ? `${data.totalOrdersCount} Fulfilled` : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SLA BENCHMARK CARDS */}
      {metricsList.length === 0 ? (
        <Card className="p-12 border-brand-slate-200 text-center space-y-2">
          <Activity className="w-8 h-8 text-brand-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-brand-slate-800">
            Pending initial order deliveries to calculate score
          </h3>
          <p className="text-xs text-brand-slate-500 max-w-md mx-auto">
            Performance metrics, dispatch SLAs, and rating scores will automatically generate once orders are received and delivered to customers.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricsList.map((metric) => (
            <Card
              key={metric.id}
              onClick={() => setSelectedMetric(metric)}
              className={`p-5 border cursor-pointer transition-all space-y-3 shadow-2xs ${
                selectedMetric?.id === metric.id
                  ? "border-brand-emerald-600 bg-brand-emerald-50/20 shadow-md"
                  : "border-brand-slate-200 hover:border-brand-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-xs text-brand-slate-900">{metric.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {metric.status}
                </span>
              </div>

              <div>
                <span className="text-2xl font-black text-brand-slate-900">{metric.current}</span>
                <span className="text-xs text-brand-slate-500 ml-2 font-semibold">Target: {metric.target}</span>
              </div>

              <p className="text-[11px] text-brand-slate-600 leading-relaxed">{metric.impact}</p>

              <div className="pt-2 border-t border-brand-slate-100 flex items-center justify-between text-[11px] text-brand-emerald-800 font-bold">
                <span>View Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedMetric && (
        <Card className="p-6 border-brand-slate-200 space-y-3 bg-brand-slate-50">
          <h3 className="text-sm font-bold text-brand-slate-900">
            Operational Recommendation: {selectedMetric.name}
          </h3>
          <p className="text-xs text-brand-slate-700 leading-relaxed">
            {selectedMetric.recommendation}
          </p>
        </Card>
      )}
    </div>
  );
}
