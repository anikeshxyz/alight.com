import React from "react";
import Link from "next/link";
import { Plus, RefreshCw, Store } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type DateRange = "7d" | "30d" | "90d";

export interface VendorDashboardHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  storeName?: string;
  isVerified?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const VendorDashboardHeader: React.FC<VendorDashboardHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  storeName,
  isVerified = true,
  onRefresh,
  refreshing = false,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-brand-slate-200/90 shadow-2xs">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-extrabold text-brand-slate-900 tracking-tight">
            Merchant Operating Dashboard
          </h1>
          {isVerified ? (
            <Badge
              variant="brand"
              size="sm"
              className="bg-brand-emerald-50 text-brand-emerald-800 border-brand-emerald-200"
            >
              Verified Merchant
            </Badge>
          ) : (
            <Badge
              variant="warning"
              size="sm"
              className="bg-amber-50 text-amber-800 border-amber-200"
            >
              Pending Verification
            </Badge>
          )}
          {storeName && (
            <span className="text-xs font-semibold text-brand-slate-600 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-brand-slate-400" />
              <span>{storeName}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-brand-slate-500 mt-1">
          Multi-warehouse operations, sub-order fulfillment velocity, stock telemetry, and financial settlements.
        </p>
      </div>

      {/* Date Filter & Actions */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="min-h-[40px] min-w-[40px] px-2.5 text-brand-slate-600 hover:text-brand-slate-900 border-brand-slate-200 text-xs focus-visible:ring-2 focus-visible:ring-brand-emerald-700"
            title="Refresh Data"
            aria-label="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        )}

        <div
          role="radiogroup"
          aria-label="Select Date Range"
          className="inline-flex bg-brand-slate-100 p-1 rounded-xl border border-brand-slate-200 text-xs font-semibold"
        >
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => {
            const isSelected = dateRange === r;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onDateRangeChange(r)}
                className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 ${
                  isSelected
                    ? "bg-white text-brand-slate-900 shadow-2xs font-bold"
                    : "text-brand-slate-600 hover:text-brand-slate-900"
                }`}
              >
                {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </button>
            );
          })}
        </div>

        <Link href="/vendor/products/new">
          <Button
            variant="primary"
            size="sm"
            className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 shadow-sm text-xs min-h-[40px] px-3.5 flex items-center focus-visible:ring-2 focus-visible:ring-brand-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
