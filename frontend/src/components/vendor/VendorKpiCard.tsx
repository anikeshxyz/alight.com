import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";

export interface VendorKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
  delta?: {
    value: string;
    isPositive?: boolean;
    comparisonPeriod?: string;
  } | null;
  secondaryMetric?: {
    label: string;
    value: string;
  };
  className?: string;
}

export const VendorKpiCard: React.FC<VendorKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-brand-emerald-50",
  iconColor = "text-brand-emerald-800",
  delta,
  secondaryMetric,
  className = "",
}) => {
  const isNeutral = delta?.value === "0.0%" || delta?.value === "0%" || delta?.value === "+0.0%";

  return (
    <Card
      className={`p-4 border-brand-slate-200/90 hover:border-brand-emerald-500/30 transition-all shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-slate-500">{title}</span>
        <div
          className={`w-8 h-8 rounded-lg ${iconBgColor} ${iconColor} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-lg sm:text-xl xl:text-2xl font-black text-brand-slate-900 tracking-tight tabular-nums truncate min-w-0">
            {value}
          </span>
          {secondaryMetric && (
            <span className="text-xs font-semibold text-brand-slate-600 shrink-0 whitespace-nowrap">
              <span className="text-brand-slate-400 font-normal mr-1">{secondaryMetric.label}</span>
              <strong className="font-bold text-brand-slate-800 tabular-nums">{secondaryMetric.value}</strong>
            </span>
          )}
        </div>

        {/* Real Delta if available from backend */}
        {delta && delta.value ? (
          <div
            className={`flex items-center gap-1 text-[11px] mt-1 font-semibold ${
              isNeutral
                ? "text-brand-slate-500"
                : delta.isPositive
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3.5 h-3.5 shrink-0 text-brand-slate-400" />
            ) : delta.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{delta.value}</span>
            {delta.comparisonPeriod && (
              <span className="text-brand-slate-400 font-normal">vs {delta.comparisonPeriod}</span>
            )}
          </div>
        ) : subtitle ? (
          <p className="text-[11px] text-brand-slate-400 mt-1 truncate">{subtitle}</p>
        ) : null}
      </div>
    </Card>
  );
};
