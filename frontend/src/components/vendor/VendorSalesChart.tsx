"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VendorEmptyState } from "./VendorEmptyState";
import { RevenueTrajectory } from "@/types/analytics";
import { useCurrency } from "@/context/CurrencyContext";

export type ChartMetricMode = "ALL" | "GMV" | "NET" | "ORDERS";

export interface VendorSalesChartProps {
  data: RevenueTrajectory[];
  dateRange?: "7d" | "30d" | "90d";
  totalGross?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const VendorSalesChart: React.FC<VendorSalesChartProps> = ({
  data = [],
  dateRange = "30d",
  totalGross,
  isLoading = false,
  error = null,
  onRetry,
  className = "",
}) => {
  const { formatMoney, currentCurrency } = useCurrency();
  const [metricMode, setMetricMode] = useState<ChartMetricMode>("ALL");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if netSettlement is available from backend
  const hasNetSettlement = useMemo(() => {
    return data.some(
      (d) => d.netSettlement !== undefined && d.netSettlement !== null
    );
  }, [data]);

  // Aggregate totals for the active data view
  const aggregatedGmv = useMemo(() => {
    return totalGross !== undefined
      ? totalGross
      : data.reduce((sum, d) => sum + (d.gmv || 0), 0);
  }, [data, totalGross]);

  const aggregatedOrders = useMemo(() => {
    return data.reduce((sum, d) => sum + (d.orderCount || 0), 0);
  }, [data]);

  const aggregatedNet = useMemo(() => {
    return data.reduce((sum, d) => sum + (d.netSettlement || 0), 0);
  }, [data]);

  // Chart dimensions in SVG coordinates
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 55, bottom: 45, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Max values for scaling
  const maxGmv = useMemo(() => {
    const rawMax = Math.max(...data.map((d) => Math.max(d.gmv || 0, d.netSettlement || 0)), 100);
    // Round up to clean multiple
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    return Math.ceil((rawMax * 1.15) / magnitude) * magnitude;
  }, [data]);

  const maxOrders = useMemo(() => {
    const rawMax = Math.max(...data.map((d) => d.orderCount || 0), 5);
    return Math.ceil(rawMax * 1.2);
  }, [data]);

  // Coordinates mapping
  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth / 2;

    return data.map((d, i) => {
      const x = data.length === 1 ? padding.left + plotWidth / 2 : padding.left + i * stepX;
      const gmvRatio = Math.min(1, Math.max(0, (d.gmv || 0) / maxGmv));
      const netRatio = Math.min(1, Math.max(0, (d.netSettlement || 0) / maxGmv));
      const orderRatio = Math.min(1, Math.max(0, (d.orderCount || 0) / maxOrders));

      const yGmv = padding.top + plotHeight - gmvRatio * plotHeight;
      const yNet = padding.top + plotHeight - netRatio * plotHeight;
      const yOrders = padding.top + plotHeight - orderRatio * plotHeight;

      return {
        ...d,
        x,
        yGmv,
        yNet,
        yOrders,
        index: i,
      };
    });
  }, [data, maxGmv, maxOrders, plotWidth, plotHeight, padding.left, padding.top]);

  // Smooth SVG Path Generator
  const createSmoothPath = useCallback((coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }, []);

  const gmvPath = useMemo(() => {
    return createSmoothPath(points.map((p) => ({ x: p.x, y: p.yGmv })));
  }, [points, createSmoothPath]);

  const netPath = useMemo(() => {
    return createSmoothPath(points.map((p) => ({ x: p.x, y: p.yNet })));
  }, [points, createSmoothPath]);

  const ordersPath = useMemo(() => {
    return createSmoothPath(points.map((p) => ({ x: p.x, y: p.yOrders })));
  }, [points, createSmoothPath]);

  // Area under GMV curve
  const gmvAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const bottom = padding.top + plotHeight;
    return `${gmvPath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [points, gmvPath, padding.top, plotHeight]);

  // Y-axis tick divisions (4 tiers)
  const yTicks = useMemo(() => {
    return [0, 0.33, 0.66, 1].map((ratio) => {
      const gmvVal = Math.round(maxGmv * ratio);
      const ordersVal = Math.round(maxOrders * ratio);
      const y = padding.top + plotHeight - ratio * plotHeight;
      return { ratio, gmvVal, ordersVal, y };
    });
  }, [maxGmv, maxOrders, padding.top, plotHeight]);

  // Helper for clean currency labels on left Y-axis
  const formatAxisCurrency = useCallback((val: number) => {
    const symbol = currentCurrency.symbol || "₹";
    if (val === 0) return `${symbol}0`;
    if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000 && currentCurrency.code === "INR") return `${symbol}${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${symbol}${(val / 1000).toFixed(0)}k`;
    return `${symbol}${val}`;
  }, [currentCurrency]);

  // Keyboard navigation across data points
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHoveredIndex((prev) => (prev === null || prev >= points.length - 1 ? 0 : prev + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHoveredIndex((prev) => (prev === null || prev <= 0 ? points.length - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setHoveredIndex(null);
    }
  };

  // Hovered item details
  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <Card
      className={`p-5 border-brand-slate-200/90 shadow-2xs space-y-4 bg-white ${className}`}
      role="region"
      aria-label="Sales and Revenue Analytics Chart"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Header & Metric Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-brand-slate-900 tracking-tight">
              Sales & Order Trajectory
            </h3>
            <Badge
              variant="brand"
              size="sm"
              className="bg-brand-emerald-50 text-brand-emerald-800 text-[10px] font-semibold"
            >
              {dateRange === "7d" ? "7 Days" : dateRange === "30d" ? "30 Days" : "90 Days"}
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Verified order volume, gross merchandise value, and net payout velocity
          </p>
        </div>

        {/* Metric Mode Toggle */}
        <div
          role="radiogroup"
          aria-label="Select Active Chart Metric"
          className="inline-flex bg-brand-slate-100 p-1 rounded-xl border border-brand-slate-200 text-xs font-semibold shrink-0 self-start sm:self-auto"
        >
          <button
            type="button"
            role="radio"
            aria-checked={metricMode === "ALL"}
            onClick={() => setMetricMode("ALL")}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
              metricMode === "ALL"
                ? "bg-white text-brand-slate-900 shadow-2xs font-bold"
                : "text-brand-slate-600 hover:text-brand-slate-900"
            }`}
          >
            All
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={metricMode === "GMV"}
            onClick={() => setMetricMode("GMV")}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
              metricMode === "GMV"
                ? "bg-white text-brand-emerald-900 shadow-2xs font-bold"
                : "text-brand-slate-600 hover:text-brand-slate-900"
            }`}
          >
            GMV
          </button>
          {hasNetSettlement && (
            <button
              type="button"
              role="radio"
              aria-checked={metricMode === "NET"}
              onClick={() => setMetricMode("NET")}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                metricMode === "NET"
                  ? "bg-white text-teal-900 shadow-2xs font-bold"
                  : "text-brand-slate-600 hover:text-brand-slate-900"
              }`}
            >
              Net Settlement
            </button>
          )}
          <button
            type="button"
            role="radio"
            aria-checked={metricMode === "ORDERS"}
            onClick={() => setMetricMode("ORDERS")}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
              metricMode === "ORDERS"
                ? "bg-white text-blue-900 shadow-2xs font-bold"
                : "text-brand-slate-600 hover:text-brand-slate-900"
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* 2. Cumulative Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-0.5">
        <div className="p-2.5 rounded-xl bg-brand-slate-50/70 border border-brand-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
              Period Gross (GMV)
            </span>
            <span className="text-xs sm:text-sm font-black text-brand-slate-900 truncate block">
              {formatMoney(aggregatedGmv)}
            </span>
          </div>
        </div>

        {hasNetSettlement && (
          <div className="p-2.5 rounded-xl bg-brand-slate-50/70 border border-brand-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
                Net Settlement
              </span>
              <span className="text-xs sm:text-sm font-black text-brand-slate-900 truncate block">
                {formatMoney(aggregatedNet)}
              </span>
            </div>
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-brand-slate-50/70 border border-brand-slate-100 flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-800 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-brand-slate-400 block truncate">
              Orders Fulfilled
            </span>
            <span className="text-xs sm:text-sm font-black text-brand-slate-900 truncate block">
              {aggregatedOrders} {aggregatedOrders === 1 ? "Order" : "Orders"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Chart Canvas / States */}
      <div className="relative min-h-[280px]" ref={containerRef}>
        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="w-full h-[280px] bg-brand-slate-50/80 rounded-xl border border-brand-slate-200/60 p-6 flex flex-col justify-between animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-brand-slate-200/80 rounded-md w-1/4" />
              <div className="h-3 bg-brand-slate-200/50 rounded-md w-1/3" />
            </div>
            <div className="flex items-end justify-between gap-3 h-36">
              {[40, 65, 30, 85, 55, 75, 45].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-brand-slate-200/60 rounded-t-lg"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-slate-200/60">
              <div className="h-3 bg-brand-slate-200/60 rounded w-12" />
              <div className="h-3 bg-brand-slate-200/60 rounded w-12" />
              <div className="h-3 bg-brand-slate-200/60 rounded w-12" />
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="w-full h-[280px] rounded-xl border border-rose-200 bg-rose-50/50 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-rose-950">Unable to load sales analytics</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8 px-3 text-rose-900 border-rose-300 hover:bg-rose-100 text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        ) : data.length === 0 ? (
          /* Empty State */
          <div className="w-full h-[280px] flex items-center justify-center">
            <VendorEmptyState
              icon={TrendingUp}
              title="No sales data yet"
              description="Your sales trend will appear here once orders are recorded."
            />
          </div>
        ) : (
          /* Interactive SVG Chart */
          <div className="relative overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible"
              aria-hidden="true"
            >
              <defs>
                {/* Gradient for GMV area fill */}
                <linearGradient id="gmvAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.01" />
                </linearGradient>
                {/* Gradient for Net Settlement area fill */}
                <linearGradient id="netAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines & Y-Axis labels */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={svgWidth - padding.right}
                    y2={tick.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? undefined : "3 3"}
                  />
                  {/* Left Y-axis (Currency: GMV / Net) */}
                  {(metricMode === "ALL" || metricMode === "GMV" || metricMode === "NET") && (
                    <text
                      x={padding.left - 8}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      className="fill-brand-slate-400 font-mono text-[10px] select-none"
                    >
                      {formatAxisCurrency(tick.gmvVal)}
                    </text>
                  )}
                  {/* Right Y-axis (Orders Volume) */}
                  {(metricMode === "ALL" || metricMode === "ORDERS") && (
                    <text
                      x={svgWidth - padding.right + 8}
                      y={tick.y + 3.5}
                      textAnchor="start"
                      className="fill-blue-500 font-mono text-[10px] select-none"
                    >
                      {tick.ordersVal}
                    </text>
                  )}
                </g>
              ))}

              {/* Bottom X-axis line */}
              <line
                x1={padding.left}
                y1={padding.top + plotHeight}
                x2={svgWidth - padding.right}
                y2={padding.top + plotHeight}
                stroke="#e2e8f0"
                strokeWidth="1.2"
              />

              {/* GMV Area Fill */}
              {(metricMode === "ALL" || metricMode === "GMV") && (
                <path d={gmvAreaPath} fill="url(#gmvAreaGradient)" />
              )}

              {/* Net Settlement Line */}
              {(metricMode === "ALL" || metricMode === "NET") && hasNetSettlement && (
                <path
                  d={netPath}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Primary GMV Line */}
              {(metricMode === "ALL" || metricMode === "GMV") && (
                <path
                  d={gmvPath}
                  fill="none"
                  stroke="#047857"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Orders Line (Dashed) */}
              {(metricMode === "ALL" || metricMode === "ORDERS") && (
                <path
                  d={ordersPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Active Hover Crosshair Line */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={padding.top + plotHeight}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data points & X-Axis labels */}
              {points.map((p, i) => {
                const isHovered = hoveredIndex === i;
                // Avoid overcrowding X-axis on dense periods
                const showXLabel =
                  points.length <= 8 ||
                  i === 0 ||
                  i === points.length - 1 ||
                  i % Math.ceil(points.length / 6) === 0;

                return (
                  <g key={i}>
                    {/* X-axis tick label */}
                    {showXLabel && (
                      <text
                        x={p.x}
                        y={padding.top + plotHeight + 18}
                        textAnchor="middle"
                        className={`text-[10px] select-none font-medium ${
                          isHovered
                            ? "fill-brand-slate-900 font-bold"
                            : "fill-brand-slate-500"
                        }`}
                      >
                        {p.periodLabel}
                      </text>
                    )}

                    {/* GMV Node Dot */}
                    {(metricMode === "ALL" || metricMode === "GMV") && (
                      <circle
                        cx={p.x}
                        cy={p.yGmv}
                        r={isHovered ? 5 : 3}
                        fill="#ffffff"
                        stroke="#047857"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Net Settlement Node Dot */}
                    {(metricMode === "ALL" || metricMode === "NET") && hasNetSettlement && (
                      <circle
                        cx={p.x}
                        cy={p.yNet}
                        r={isHovered ? 4.5 : 2.5}
                        fill="#ffffff"
                        stroke="#0d9488"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Orders Node Dot */}
                    {(metricMode === "ALL" || metricMode === "ORDERS") && (
                      <circle
                        cx={p.x}
                        cy={p.yOrders}
                        r={isHovered ? 4.5 : 2.5}
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Invisible Wide Hit Area for Mouse / Touch Interaction */}
                    <rect
                      x={
                        i === 0
                          ? padding.left
                          : (p.x + (points[i - 1]?.x || p.x)) / 2
                      }
                      y={padding.top}
                      width={
                        points.length === 1
                          ? plotWidth
                          : i === points.length - 1
                          ? svgWidth - padding.right - p.x + (p.x - (points[i - 1]?.x || p.x)) / 2
                          : ((points[i + 1]?.x || p.x) - (points[i - 1]?.x || p.x)) / 2
                      }
                      height={plotHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onTouchStart={() => setHoveredIndex(i)}
                      onClick={() => setHoveredIndex(i)}
                      aria-label={`${p.periodLabel}: GMV ${formatMoney(p.gmv)}, ${p.orderCount} orders`}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Floating Tooltip */}
            {activePoint && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
                style={{
                  left: `${(activePoint.x / svgWidth) * 100}%`,
                  top: "12px",
                  transform:
                    activePoint.x > svgWidth * 0.7
                      ? "translateX(-105%)"
                      : activePoint.x < svgWidth * 0.3
                      ? "translateX(5%)"
                      : "translateX(-50%)",
                }}
              >
                <div className="bg-brand-slate-900/95 text-white backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/10 text-xs min-w-[170px] space-y-2">
                  <div className="border-b border-white/10 pb-1.5 flex items-center justify-between gap-2">
                    <span className="font-bold text-white tracking-wide">
                      {activePoint.periodLabel}
                    </span>
                    <span className="text-[10px] text-brand-slate-400 font-mono">
                      Telemetry
                    </span>
                  </div>

                  <div className="space-y-1.5 font-medium">
                    {/* GMV Metric */}
                    <div className="flex items-center justify-between gap-3 text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-brand-slate-300">GMV</span>
                      </div>
                      <span className="font-bold font-mono">
                        {formatMoney(activePoint.gmv)}
                      </span>
                    </div>

                    {/* Net Settlement (Only if backend provided) */}
                    {activePoint.netSettlement !== undefined && (
                      <div className="flex items-center justify-between gap-3 text-teal-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-300" />
                          <span className="text-brand-slate-300">Net Settlement</span>
                        </div>
                        <span className="font-bold font-mono">
                          {formatMoney(activePoint.netSettlement)}
                        </span>
                      </div>
                    )}

                    {/* Orders Metric */}
                    <div className="flex items-center justify-between gap-3 text-blue-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-brand-slate-300">Orders</span>
                      </div>
                      <span className="font-bold font-mono">
                        {activePoint.orderCount}{" "}
                        <span className="text-[10px] font-normal text-brand-slate-400">
                          {activePoint.orderCount === 1 ? "order" : "orders"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Chart Legend */}
      {data.length > 0 && !isLoading && !error && (
        <div className="flex items-center justify-center flex-wrap gap-5 pt-1 text-xs text-brand-slate-600 border-t border-brand-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-brand-emerald-700 rounded-full inline-block" />
            <span className="font-semibold text-brand-slate-800">Gross Sales (GMV)</span>
          </div>
          {hasNetSettlement && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-teal-600 rounded-full inline-block" />
              <span className="font-semibold text-brand-slate-800">Net Settlement</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-3.5 border-t-2 border-dashed border-blue-500 inline-block" />
            <span className="font-semibold text-brand-slate-800">Orders Fulfilled</span>
          </div>
        </div>
      )}
    </Card>
  );
};
