import React from "react";
import Link from "next/link";
import { AlertTriangle, AlertCircle, Clock, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export interface ActionItem {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  count: number;
  actionText: string;
  href: string;
}

export interface VendorActionCenterProps {
  items: ActionItem[];
  className?: string;
}

export const VendorActionCenter: React.FC<VendorActionCenterProps> = ({
  items,
  className = "",
}) => {
  return (
    <Card
      className={`p-5 border-brand-slate-200/90 shadow-xs relative overflow-hidden ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-slate-900 tracking-tight">
              Operational Action Required
            </h2>
            <p className="text-[11px] text-brand-slate-500">
              Immediate fulfillment, stock, and return tasks needing merchant attention
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            items.length > 0
              ? "bg-amber-100 text-amber-900 border border-amber-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {items.length} {items.length === 1 ? "Task" : "Tasks"}
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="p-6 bg-brand-slate-50/70 border border-brand-slate-200/60 rounded-xl text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-brand-slate-800">All Operations Current</p>
            <p className="text-[11px] text-brand-slate-500">
              No orders awaiting dispatch, out-of-stock items, or pending returns.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all hover:shadow-2xs ${
                item.type === "CRITICAL"
                  ? "bg-rose-50/60 border-rose-200/90 text-rose-950"
                  : item.type === "WARNING"
                  ? "bg-amber-50/60 border-amber-200/90 text-amber-950"
                  : "bg-blue-50/60 border-blue-200/90 text-blue-950"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold">
                  {item.type === "CRITICAL" && (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  {item.type === "WARNING" && (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  {item.type === "INFO" && (
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <span className="leading-snug">{item.title}</span>
                </div>
                <span className="font-mono font-bold bg-white/90 px-2 py-0.5 rounded-md border border-black/5 text-[11px] shrink-0 text-brand-slate-900 shadow-2xs">
                  {item.count}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-brand-slate-600">
                {item.description}
              </p>
              <div className="pt-0.5 flex justify-end">
                <Link
                  href={item.href}
                  className="font-bold text-[11px] text-brand-emerald-800 hover:text-brand-emerald-950 flex items-center gap-1 hover:underline"
                >
                  <span>{item.actionText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
