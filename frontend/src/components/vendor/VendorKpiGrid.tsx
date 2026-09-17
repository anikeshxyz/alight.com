import React from "react";
import { DollarSign, ShoppingBag, Truck, Receipt } from "lucide-react";
import { VendorKpiCard } from "./VendorKpiCard";

export interface VendorKpiGridProps {
  grossSales: number;
  grossSalesDelta?: number | null;
  orderVolume: number;
  orderVolumeDelta?: number | null;
  aov: number;
  pendingOrders: number;
  activeShipments: number;
  pendingSettlement: number;
  availableBalance: number;
  timeframeLabel?: string;
}

export const VendorKpiGrid: React.FC<VendorKpiGridProps> = ({
  grossSales,
  grossSalesDelta,
  orderVolume,
  orderVolumeDelta,
  aov,
  pendingOrders,
  activeShipments,
  pendingSettlement,
  availableBalance,
  timeframeLabel = "prev. period",
}) => {
  const formatDelta = (val: number | null | undefined) => {
    if (val === null || val === undefined) return null;
    const sign = val > 0 ? "+" : "";
    return {
      value: `${sign}${val.toFixed(1)}%`,
      isPositive: val >= 0,
      comparisonPeriod: timeframeLabel,
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Gross Sales (GMV) */}
      <VendorKpiCard
        title="Gross Sales (GMV)"
        value={`₹${grossSales.toLocaleString("en-IN")}`}
        subtitle="Gross merchandise value"
        delta={formatDelta(grossSalesDelta)}
        icon={DollarSign}
        iconBgColor="bg-emerald-50"
        iconColor="text-emerald-700"
      />

      {/* 2. Order Volume & AOV */}
      <VendorKpiCard
        title="Sub-Orders & AOV"
        value={`${orderVolume} Orders`}
        secondaryMetric={{
          label: "AOV",
          value: `₹${aov.toLocaleString("en-IN")}`,
        }}
        subtitle="Order velocity & average order value"
        delta={formatDelta(orderVolumeDelta)}
        icon={ShoppingBag}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-700"
      />

      {/* 3. Dispatch & In-Transit */}
      <VendorKpiCard
        title="Dispatch & In-Transit"
        value={`${pendingOrders} Pending`}
        secondaryMetric={{
          label: "Active",
          value: `${activeShipments} In-Transit`,
        }}
        subtitle="Orders awaiting dispatch & active transit"
        icon={Truck}
        iconBgColor="bg-amber-50"
        iconColor="text-amber-700"
      />

      {/* 4. Escrow & Settlement */}
      <VendorKpiCard
        title="Settlement & Escrow"
        value={`₹${pendingSettlement.toLocaleString("en-IN")}`}
        secondaryMetric={{
          label: "Available",
          value: `₹${availableBalance.toLocaleString("en-IN")}`,
        }}
        subtitle="Pending escrow & withdrawable balance"
        icon={Receipt}
        iconBgColor="bg-purple-50"
        iconColor="text-purple-700"
      />
    </div>
  );
};
