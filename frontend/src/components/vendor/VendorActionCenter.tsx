import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  PackageX,
  Package,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface ActionItem {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  count: number;
  actionText: string;
  href: string;
  category?: "DISPATCH" | "OUT_OF_STOCK" | "LOW_STOCK" | "RMA" | "QUOTE" | "GENERAL";
}

export interface VendorActionCenterProps {
  items: ActionItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const VendorActionCenter: React.FC<VendorActionCenterProps> = ({
  items,
  isLoading = false,
  error = null,
  onRetry,
  className = "",
}) => {
  const totalTasks = items.reduce((acc, item) => acc + item.count, 0);

  const getCategoryIcon = (item: ActionItem) => {
    switch (item.category) {
      case "DISPATCH":
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case "OUT_OF_STOCK":
        return <PackageX className="w-4 h-4 text-rose-600 shrink-0" />;
      case "LOW_STOCK":
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case "RMA":
        return <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />;
      case "QUOTE":
        return <Receipt className="w-4 h-4 text-blue-600 shrink-0" />;
      default:
        if (item.type === "CRITICAL") return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
        if (item.type === "WARNING") return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
        return <Clock className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <Card
      className={`p-5 border-brand-slate-200/90 shadow-2xs relative overflow-hidden bg-white ${className}`}
      role="region"
      aria-label="Operational Command Center"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3 mb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              items.length > 0 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {items.length > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-slate-900 tracking-tight">
              Action Required
            </h2>
            <p className="text-[11px] text-brand-slate-500">
              Immediate fulfillment, inventory thresholds, and buyer customer requests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              items.length > 0
                ? "bg-rose-100 text-rose-900 border border-rose-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {items.length} {items.length === 1 ? "Queue Active" : "Queues Active"}
          </span>
          <Link
            href="/vendor/orders"
            className="text-xs font-bold text-brand-emerald-800 hover:text-brand-emerald-950 flex items-center gap-1 hover:underline min-h-[40px] px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Task List / State Views */}
      <div className="space-y-2.5">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="space-y-2.5 animate-pulse" aria-busy="true">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-brand-slate-200/70 bg-brand-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-brand-slate-200/80 rounded w-1/3" />
                  <div className="h-4 bg-brand-slate-200/60 rounded w-8" />
                </div>
                <div className="h-3 bg-brand-slate-200/50 rounded w-2/3" />
                <div className="flex justify-end pt-1">
                  <div className="h-4 bg-brand-slate-200/60 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-5 bg-rose-50/60 border border-rose-200/80 rounded-xl text-center space-y-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-rose-950">Unable to load action items</p>
            <p className="text-[11px] text-rose-700">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="min-h-[40px] px-3.5 text-xs border-rose-300 text-rose-900 hover:bg-rose-100 font-bold focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="p-6 bg-brand-slate-50/70 border border-brand-slate-200/60 rounded-xl text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-xs font-black text-brand-slate-900 tracking-tight">All caught up</p>
            <p className="text-[11px] text-brand-slate-500 max-w-sm mx-auto">
              No orders, inventory alerts, returns, or quotes require your attention right now.
            </p>
          </div>
        ) : (
          /* Active Semantic Action Items */
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-xl border text-xs space-y-2.5 transition-all hover:shadow-2xs ${
                item.type === "CRITICAL"
                  ? "bg-rose-50/60 border-rose-200/90 text-rose-950"
                  : item.type === "WARNING"
                  ? "bg-amber-50/60 border-amber-200/90 text-amber-950"
                  : "bg-blue-50/60 border-blue-200/90 text-blue-950"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  {getCategoryIcon(item)}
                  <span className="leading-snug text-xs sm:text-sm">{item.title}</span>
                </div>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-md border text-[11px] shrink-0 shadow-2xs ${
                    item.type === "CRITICAL"
                      ? "bg-rose-100 text-rose-900 border-rose-200"
                      : item.type === "WARNING"
                      ? "bg-amber-100 text-amber-900 border-amber-200"
                      : "bg-blue-100 text-blue-900 border-blue-200"
                  }`}
                >
                  {item.count}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-brand-slate-600">
                {item.description}
              </p>
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-black/5">
                <span className="text-[10px] text-brand-slate-400 font-medium hidden sm:inline">
                  Immediate action required
                </span>
                <Link
                  href={item.href}
                  className="font-bold text-xs text-brand-emerald-800 hover:text-brand-emerald-950 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/90 hover:bg-white border border-brand-slate-200/80 shadow-2xs transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 ml-auto"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
