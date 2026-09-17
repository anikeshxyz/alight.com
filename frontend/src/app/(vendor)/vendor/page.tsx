"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getVendorAnalyticsOverviewApi } from "@/services/analytics-service";
import { VendorAnalyticsOverview } from "@/types/analytics";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Modular Vendor Components
import {
  VendorDashboardHeader,
  DateRange,
} from "@/components/vendor/VendorDashboardHeader";
import { VendorKpiGrid } from "@/components/vendor/VendorKpiGrid";
import {
  VendorActionCenter,
  ActionItem,
} from "@/components/vendor/VendorActionCenter";
import { VendorSalesChart } from "@/components/vendor/VendorSalesChart";
import { VendorBenchmarkGauges } from "@/components/vendor/VendorBenchmarkGauges";
import { VendorTopProductsTable } from "@/components/vendor/VendorTopProductsTable";
import { VendorQuickActions } from "@/components/vendor/VendorQuickActions";
import { VendorSkeleton } from "@/components/vendor/VendorSkeleton";

export default function VendorDashboardPage() {
  const { user, isVendor } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdatingRange, setIsUpdatingRange] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [liveAnalytics, setLiveAnalytics] = useState<VendorAnalyticsOverview | null>(null);

  // Guard against race conditions when switching date ranges quickly
  const latestRequestIdRef = useRef(0);

  const fetchDashboardData = useCallback(async (targetRange: DateRange, isRefresh = false) => {
    const requestId = ++latestRequestIdRef.current;
    if (isRefresh) {
      setIsUpdatingRange(true);
    } else {
      setIsUpdatingRange(true);
    }
    setAnalyticsError(null);

    try {
      const res = await getVendorAnalyticsOverviewApi(targetRange);

      // Verify this is still the most recent request
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      if (res.success && res.data) {
        setLiveAnalytics(res.data);
      } else {
        setAnalyticsError(
          res.message || "Unable to load sales analytics. Please try again."
        );
      }
    } catch (err: unknown) {
      if (requestId !== latestRequestIdRef.current) return;
      console.error("Failed to load vendor analytics overview", err);
      setAnalyticsError("Unable to load sales analytics for this period. Please check your network connection and retry.");
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setInitialLoading(false);
        setIsUpdatingRange(false);
      }
    }
  }, []);

  // Fetch when dateRange changes
  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange, fetchDashboardData]);

  const handleDateRangeChange = (newRange: DateRange) => {
    if (newRange === dateRange) return;
    setDateRange(newRange);
  };

  const handleManualRefresh = () => {
    fetchDashboardData(dateRange, true);
  };

  if (initialLoading) {
    return <VendorSkeleton />;
  }

  // Authentic operational telemetry from database
  const liveGross = liveAnalytics?.totalGrossSales ?? 0;
  const liveOrdersCount = liveAnalytics?.totalOrdersCount ?? 0;
  const aov =
    liveGross > 0 && liveOrdersCount > 0
      ? Math.round(liveGross / liveOrdersCount)
      : 0;

  const awaitingDispatchCount = liveAnalytics?.awaitingDispatchCount ?? 0;
  const activeShipmentsCount = liveAnalytics?.activeShipmentsCount ?? 0;
  const lowStockCount = liveAnalytics?.lowStockCount ?? 0;
  const pendingRmaCount = liveAnalytics?.pendingRmaCount ?? 0;
  const pendingQuoteCount = liveAnalytics?.pendingQuoteCount ?? 0;

  // Build authentic action items (only if backend reports > 0, zero fabricated alerts)
  const actionItems: ActionItem[] = [];
  if (awaitingDispatchCount > 0) {
    actionItems.push({
      id: "act-dispatch",
      type: "CRITICAL",
      title: "Orders Awaiting Dispatch SLA",
      description: `${awaitingDispatchCount} order(s) require packaging and courier handover.`,
      count: awaitingDispatchCount,
      actionText: "Process Orders",
      href: "/vendor/orders",
    });
  }
  if (lowStockCount > 0) {
    actionItems.push({
      id: "act-stock",
      type: "WARNING",
      title: "Low Stock Warehouse Alerts",
      description: `${lowStockCount} catalog SKU(s) have fallen below safety inventory thresholds.`,
      count: lowStockCount,
      actionText: "Restock Inventory",
      href: "/vendor/inventory",
    });
  }
  if (pendingRmaCount > 0) {
    actionItems.push({
      id: "act-rma",
      type: "WARNING",
      title: "Pending RMA Return Inspections",
      description: `${pendingRmaCount} customer return(s) awaiting inspection or receipt.`,
      count: pendingRmaCount,
      actionText: "Inspect RMA",
      href: "/vendor/returns",
    });
  }
  if (pendingQuoteCount > 0) {
    actionItems.push({
      id: "act-quote",
      type: "INFO",
      title: "Pending Wholesale RFQ Inquiries",
      description: `${pendingQuoteCount} custom price quotation request(s) awaiting your response.`,
      count: pendingQuoteCount,
      actionText: "Respond to RFQ",
      href: "/vendor/quotes",
    });
  }

  const timeframeLabel =
    dateRange === "7d"
      ? "prev. 7 days"
      : dateRange === "30d"
      ? "prev. 30 days"
      : "prev. 90 days";

  const periodDisplayName =
    dateRange === "7d"
      ? "Last 7 Days"
      : dateRange === "30d"
      ? "Last 30 Days"
      : "Last 90 Days";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Timeframe Filter & Action */}
      <VendorDashboardHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        storeName={user?.firstName ? `${user.firstName}'s Store` : undefined}
        isVerified={isVendor}
        onRefresh={handleManualRefresh}
        refreshing={isUpdatingRange}
      />

      {/* Error Alert Banner if Analytics Failed */}
      {analyticsError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{analyticsError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="h-7 px-2.5 text-rose-900 border-rose-300 hover:bg-rose-100 text-xs font-bold"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Period Transition Indicator */}
      <div className={`transition-opacity duration-200 ${isUpdatingRange ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <div className="space-y-6">
          {/* 2. Primary Financial & Operational KPIs */}
          <VendorKpiGrid
            grossSales={liveGross}
            grossSalesDelta={liveAnalytics?.grossSalesDelta ?? null}
            orderVolume={liveOrdersCount}
            orderVolumeDelta={liveAnalytics?.orderVolumeDelta ?? null}
            aov={aov}
            pendingOrders={awaitingDispatchCount}
            activeShipments={activeShipmentsCount}
            pendingSettlement={liveAnalytics?.pendingEscrow ?? 0}
            availableBalance={liveAnalytics?.availableBalance ?? 0}
            timeframeLabel={timeframeLabel}
          />

          {/* 3. Operational Command Center: Priority Action Required & Quick Shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <VendorActionCenter items={actionItems} />
            </div>
            <div>
              <VendorQuickActions />
            </div>
          </div>

          {/* 4. Sales Trajectory & Account Health Benchmarks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <VendorSalesChart
                data={liveAnalytics?.monthlySales || []}
                dateRange={dateRange}
                totalGross={liveGross}
                isLoading={isUpdatingRange}
                error={analyticsError}
                onRetry={handleManualRefresh}
              />
            </div>
            <div>
              <VendorBenchmarkGauges
                sellerRating={liveAnalytics?.averageRating ?? null}
                fulfillmentRate={liveAnalytics?.fulfillmentRate ?? null}
                returnRate={liveAnalytics?.returnRate ?? null}
                cancellationRate={liveAnalytics?.cancellationRate ?? null}
              />
            </div>
          </div>

          {/* 5. Authentic Top Selling Products & Real Sales Revenue */}
          <VendorTopProductsTable
            topProducts={liveAnalytics?.topProducts || []}
            periodLabel={periodDisplayName}
          />
        </div>
      </div>
    </div>
  );
}
