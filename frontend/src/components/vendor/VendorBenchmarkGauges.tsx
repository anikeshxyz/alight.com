import React from "react";
import { Star, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";

export interface VendorBenchmarkGaugesProps {
  sellerRating?: number | null;
  fulfillmentRate?: number | null;
  returnRate?: number | null;
  cancellationRate?: number | null;
  className?: string;
}

export const VendorBenchmarkGauges: React.FC<VendorBenchmarkGaugesProps> = ({
  sellerRating,
  fulfillmentRate,
  returnRate,
  cancellationRate,
  className = "",
}) => {
  return (
    <div
      className={`grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-brand-slate-200/90 shadow-2xs ${className}`}
    >
      {/* 1. Seller Rating */}
      <div className="p-3 bg-brand-slate-50/80 rounded-xl border border-brand-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
            Seller Rating
          </span>
          <p className="text-sm font-black text-brand-slate-900 leading-snug">
            {sellerRating !== null && sellerRating !== undefined && sellerRating > 0
              ? `${sellerRating.toFixed(1)} / 5.0`
              : "No ratings yet"}
          </p>
          <span className="text-[10px] text-brand-slate-500 font-medium truncate block">
            Buyer reviews
          </span>
        </div>
      </div>

      {/* 2. On-Time Dispatch / Fulfillment Rate */}
      <div className="p-3 bg-brand-slate-50/80 rounded-xl border border-brand-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
            Fulfillment Rate
          </span>
          <p className="text-sm font-black text-emerald-800 leading-snug">
            {fulfillmentRate !== null && fulfillmentRate !== undefined
              ? `${fulfillmentRate.toFixed(1)}%`
              : "N/A"}
          </p>
          <span className="text-[10px] text-brand-slate-500 font-medium truncate block">
            Delivered orders
          </span>
        </div>
      </div>

      {/* 3. Return Rate */}
      <div className="p-3 bg-brand-slate-50/80 rounded-xl border border-brand-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
          <RotateCcw className="w-4 h-4 text-blue-700" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
            Return Rate
          </span>
          <p className="text-sm font-black text-brand-slate-900 leading-snug">
            {returnRate !== null && returnRate !== undefined
              ? `${returnRate.toFixed(1)}%`
              : "N/A"}
          </p>
          <span className="text-[10px] text-brand-slate-500 font-medium truncate block">
            RMA customer returns
          </span>
        </div>
      </div>

      {/* 4. Cancellation Rate */}
      <div className="p-3 bg-brand-slate-50/80 rounded-xl border border-brand-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
          <AlertCircle className="w-4 h-4 text-purple-700" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
            Cancellation Rate
          </span>
          <p className="text-sm font-black text-brand-slate-900 leading-snug">
            {cancellationRate !== null && cancellationRate !== undefined
              ? `${cancellationRate.toFixed(1)}%`
              : "N/A"}
          </p>
          <span className="text-[10px] text-brand-slate-500 font-medium truncate block">
            Cancelled orders
          </span>
        </div>
      </div>
    </div>
  );
};
