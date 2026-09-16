"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  Boxes,
  AlertCircle,
  AlertTriangle,
  Receipt,
  DollarSign,
  ArrowUpRight,
  Truck,
  RotateCcw,
  Star,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Tag,
  ShieldCheck,
  Eye,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getVendorAnalyticsOverviewApi } from "@/services/analytics-service";
import { getVendorProductsApi } from "@/services/product-service";
import { getVendorOrdersApi } from "@/services/order-service";
import { VendorAnalyticsOverview } from "@/types/analytics";
import { ProductResponse } from "@/types/product";
import { VendorOrder } from "@/types/order";

type DateRange = "7d" | "30d" | "90d" | "custom";

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  returnRate: string;
  stock: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

interface ActionItem {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  count: number;
  actionText: string;
  href: string;
}

export default function VendorDashboardPage() {
  const { user, token } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<VendorAnalyticsOverview | null>(null);
  const [liveProducts, setLiveProducts] = useState<ProductResponse[]>([]);
  const [liveOrders, setLiveOrders] = useState<VendorOrder[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "");
        if (!authToken) return;

        const [analyticsRes, productsRes, ordersRes] = await Promise.allSettled([
          getVendorAnalyticsOverviewApi(),
          getVendorProductsApi(authToken, undefined, 0, 10),
          getVendorOrdersApi(authToken, undefined, 0, 50),
        ]);

        if (analyticsRes.status === "fulfilled" && analyticsRes.value.success && analyticsRes.value.data) {
          setLiveAnalytics(analyticsRes.value.data);
        }
        if (productsRes.status === "fulfilled" && productsRes.value.success && productsRes.value.data?.content) {
          setLiveProducts(productsRes.value.data.content);
        }
        if (ordersRes.status === "fulfilled" && ordersRes.value.success && ordersRes.value.data?.content) {
          setLiveOrders(ordersRes.value.data.content);
        }
      } catch (err) {
        console.error("Failed to load live vendor dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token]);

  const liveGross = liveAnalytics?.totalGrossSales ?? 0;
  const liveOrdersCount = liveAnalytics?.totalOrdersCount ?? liveOrders.length;
  const liveAwaiting = liveOrders.filter((o) => o.fulfillmentStatus === "PROCESSING" || o.fulfillmentStatus === "UNFULFILLED" || o.fulfillmentStatus === "PENDING").length;
  const liveActiveShipments = liveOrders.filter((o) => o.fulfillmentStatus === "SHIPPED" || o.fulfillmentStatus === "IN_TRANSIT" || o.fulfillmentStatus === "OUT_FOR_DELIVERY").length;
  const liveReturns = liveOrders.filter((o) => o.fulfillmentStatus === "RETURNED").length;

  const metricsData = {
    grossSales: liveGross,
    grossSalesDelta: "0.0%",
    netSales: liveAnalytics?.netEarnings ?? 0,
    netSettlement: liveAnalytics?.availableBalance ?? 0,
    orderVolume: liveOrdersCount,
    orderVolumeDelta: "0.0%",
    aov: liveGross > 0 && liveOrdersCount > 0 ? Math.round(liveGross / liveOrdersCount) : 0,
    pendingOrders: liveAwaiting,
    awaitingDispatch: liveAwaiting,
    activeShipments: liveActiveShipments,
    activeReturns: liveReturns,
    availableBalance: liveAnalytics?.availableBalance ?? 0,
    pendingSettlement: liveAnalytics?.pendingEscrow ?? 0,
    sellerRating: liveAnalytics?.averageRating ?? 0,
    cancellationRate: "0.0%",
    returnRate: `${liveAnalytics?.returnRate ?? 0}%`,
    onTimeDispatchRate: `${liveAnalytics?.fulfillmentRate ?? 0}%`,
  };

  const topProducts: TopProduct[] = liveProducts.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.title,
    sku: p.sku,
    unitsSold: 0,
    revenue: p.discountPrice || p.basePrice || 0,
    returnRate: "0.0%",
    stock: p.stockQuantity,
    status: p.stockQuantity === 0 ? "OUT_OF_STOCK" : p.stockQuantity < 10 ? "LOW_STOCK" : "IN_STOCK",
  }));

  const lowStockCatalogCount = liveProducts.filter((p) => p.stockQuantity < 10 && p.stockQuantity > 0).length;
  const outOfStockCatalogCount = liveProducts.filter((p) => p.stockQuantity === 0).length;

  const actionItems: ActionItem[] = [];
  if (liveAwaiting > 0) {
    actionItems.push({
      id: "act-1",
      type: "CRITICAL",
      title: "Orders Awaiting Dispatch SLA",
      description: `${liveAwaiting} order(s) must be packed and handed over to courier.`,
      count: liveAwaiting,
      actionText: "Process Orders",
      href: "/vendor/orders",
    });
  }
  if (lowStockCatalogCount + outOfStockCatalogCount > 0) {
    actionItems.push({
      id: "act-2",
      type: "WARNING",
      title: "Low & Out of Stock SKUs",
      description: `${lowStockCatalogCount + outOfStockCatalogCount} catalog item(s) have reached safety thresholds in warehouse.`,
      count: lowStockCatalogCount + outOfStockCatalogCount,
      actionText: "Restock Inventory",
      href: "/vendor/inventory",
    });
  }
  if (liveReturns > 0) {
    actionItems.push({
      id: "act-3",
      type: "WARNING",
      title: "Pending RMA Return Inspections",
      description: `${liveReturns} returned parcel(s) require physical inspection.`,
      count: liveReturns,
      actionText: "Inspect RMA",
      href: "/vendor/returns",
    });
  }

  const salesTrendBars = (liveAnalytics?.monthlySales || []).map((m) => ({
    label: m.periodLabel,
    sales: m.gmv,
    orders: m.orderCount,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & DATE RANGE FILTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Merchant Operating Dashboard
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800 border-brand-emerald-200">
              Verified Direct Vendor
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Real-time multi-warehouse operations, sub-order fulfillments, SLA metrics, and financial settlements.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex bg-brand-slate-100 p-1 rounded-xl border border-brand-slate-200 text-xs font-semibold">
            {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === r
                    ? "bg-white text-brand-slate-900 shadow-2xs font-bold"
                    : "text-brand-slate-600 hover:text-brand-slate-900"
                }`}
              >
                {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </button>
            ))}
          </div>

          <Link href="/vendor/products/new">
            <Button
              variant="primary"
              size="sm"
              className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. CORE FINANCIAL & OPERATIONAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <Card className="p-4 border-brand-slate-200 hover:border-brand-emerald-500/30 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Gross Sales (GMV)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-brand-slate-900">
              ₹{metricsData.grossSales.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metricsData.grossSalesDelta} vs prev. period</span>
            </div>
          </div>
        </Card>

        {/* Order Volume & AOV */}
        <Card className="p-4 border-brand-slate-200 hover:border-brand-emerald-500/30 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Sub-Orders & AOV</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-brand-slate-900">
                {metricsData.orderVolume} Orders
              </span>
              <span className="text-xs font-mono font-bold text-brand-slate-500">
                AOV ₹{metricsData.aov}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metricsData.orderVolumeDelta} growth</span>
            </div>
          </div>
        </Card>

        {/* Dispatch Pipeline */}
        <Card className="p-4 border-brand-slate-200 hover:border-brand-emerald-500/30 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Dispatch & In-Transit</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-brand-slate-900">
                {metricsData.awaitingDispatch} Pending
              </span>
              <span className="text-xs text-amber-700 font-semibold">
                {metricsData.activeShipments} In-Transit
              </span>
            </div>
            <p className="text-[11px] text-brand-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>SLA Cutoff: Today 4:00 PM</span>
            </p>
          </div>
        </Card>

        {/* Next Payout & Balance */}
        <Card className="p-4 border-brand-slate-200 hover:border-brand-emerald-500/30 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Next Payout / Escrow</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-brand-slate-900">
              ₹{metricsData.pendingSettlement.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center justify-between text-[11px] text-brand-slate-500 mt-1">
              <span className="text-emerald-700 font-semibold">Scheduled Friday</span>
              <span>Bal: ₹{metricsData.availableBalance.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. SELLER HEALTH BENCHMARK GAUGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            ★
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate-400">Seller Rating</span>
            <p className="text-sm font-black text-brand-slate-900">{metricsData.sellerRating} / 5.0</p>
            <span className="text-[9px] text-emerald-700 font-semibold">Top Tier Merchant</span>
          </div>
        </div>

        <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate-400">On-Time Dispatch</span>
            <p className="text-sm font-black text-emerald-700">{metricsData.onTimeDispatchRate}</p>
            <span className="text-[9px] text-brand-slate-500">Target &gt; 95%</span>
          </div>
        </div>

        <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate-400">Return Rate</span>
            <p className="text-sm font-black text-brand-slate-900">{metricsData.returnRate}</p>
            <span className="text-[9px] text-emerald-700 font-semibold">Healthy (&lt; 3%)</span>
          </div>
        </div>

        <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate-400">Cancellation Rate</span>
            <p className="text-sm font-black text-brand-slate-900">{metricsData.cancellationRate}</p>
            <span className="text-[9px] text-emerald-700 font-semibold">Target &lt; 2%</span>
          </div>
        </div>
      </div>

      {/* 4. OPERATIONAL WORKBENCH: ACTION REQUIRED & SALES OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sales Overview Chart & Top Catalog Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Performance Visualizer */}
          <Card className="p-5 border-brand-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-brand-slate-900">
                  Revenue & Order Volume Trajectory
                </h3>
                <p className="text-xs text-brand-slate-500">
                  Weekly sales aggregation and fulfillment velocity
                </p>
              </div>
              <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
                Live Data
              </Badge>
            </div>

            {/* Custom Bar Chart Visualizer */}
            <div className="space-y-4 pt-2">
              {salesTrendBars.length === 0 ? (
                <div className="py-10 text-center text-xs text-brand-slate-500">
                  Not enough historical order data for trendline.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {salesTrendBars.map((bar, i) => {
                    const maxSales = Math.max(1, ...salesTrendBars.map((b) => b.sales));
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-full bg-brand-slate-100 h-28 rounded-xl relative overflow-hidden flex flex-col justify-end p-1.5 group">
                          <div
                            className="w-full bg-gradient-to-t from-brand-emerald-800 to-brand-emerald-600 rounded-lg transition-all group-hover:brightness-110"
                            style={{ height: `${Math.max(10, Math.round((bar.sales / maxSales) * 100))}%` }}
                          />
                          <span className="absolute top-2 left-0 right-0 text-center text-[10px] font-bold text-brand-slate-700">
                            ₹{(bar.sales / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-brand-slate-800 block">{bar.label}</span>
                          <span className="text-[10px] text-brand-slate-400">{bar.orders} orders</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Top Selling Products */}
          <Card className="p-5 border-brand-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-brand-slate-900">
                  Top Revenue Contributing Products
                </h3>
                <p className="text-xs text-brand-slate-500">
                  Velocity, inventory health, and return rates per SKU
                </p>
              </div>
              <Link href="/vendor/products" className="text-xs text-brand-emerald-800 font-bold hover:underline">
                View All Catalog ({topProducts.length}) →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-slate-200 text-brand-slate-500 font-semibold">
                    <th className="pb-2.5">Product / SKU</th>
                    <th className="pb-2.5 text-center">Units Sold</th>
                    <th className="pb-2.5">Revenue</th>
                    <th className="pb-2.5 text-center">Return Rate</th>
                    <th className="pb-2.5 text-center">Stock</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-brand-slate-400 text-xs">
                        No products in catalog yet.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-brand-slate-50 transition-colors">
                        <td className="py-3">
                          <p className="font-bold text-brand-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] font-mono text-brand-slate-400 mt-0.5">{p.sku}</p>
                        </td>
                        <td className="py-3 text-center font-bold text-brand-slate-900">{p.unitsSold}</td>
                        <td className="py-3 font-bold text-brand-slate-900">
                          ₹{p.revenue.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 text-center text-brand-slate-600">{p.returnRate}</td>
                        <td className="py-3 text-center font-mono font-bold">{p.stock}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "IN_STOCK"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : p.status === "LOW_STOCK"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {p.status === "IN_STOCK"
                              ? "In Stock"
                              : p.status === "LOW_STOCK"
                              ? "Low Stock"
                              : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Col: Action Required & Quick Actions */}
        <div className="space-y-6">
          {/* Action Required Center */}
          <Card className="p-5 border-brand-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-brand-slate-900">Action Required</h3>
              </div>
              <span className="bg-brand-slate-100 text-brand-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {actionItems.length} Tasks
              </span>
            </div>

            <div className="space-y-3">
              {actionItems.length === 0 ? (
                <div className="p-6 bg-brand-slate-50 border border-brand-slate-200 rounded-xl text-center text-brand-slate-500 text-xs">
                  All store operations are current. No pending tasks.
                </div>
              ) : (
                actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    item.type === "CRITICAL"
                      ? "bg-rose-50/70 border-rose-200 text-rose-950"
                      : item.type === "WARNING"
                      ? "bg-amber-50/70 border-amber-200 text-amber-950"
                      : "bg-blue-50/70 border-blue-200 text-blue-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {item.type === "CRITICAL" && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {item.type === "WARNING" && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      {item.type === "INFO" && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{item.title}</span>
                    </span>
                    <span className="font-mono font-bold bg-white/80 px-1.5 py-0.2 rounded border border-black/5 text-[10px]">
                      {item.count}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{item.description}</p>
                  <div className="pt-1 flex justify-end">
                    <Link href={item.href}>
                      <button
                        type="button"
                        className="font-bold text-[11px] hover:underline flex items-center gap-0.5 text-brand-emerald-900"
                      >
                        <span>{item.actionText}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          </Card>

          {/* Quick Shortcuts Bar */}
          <Card className="p-5 border-brand-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-brand-slate-900">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/vendor/products/new"
                className="p-3 rounded-xl bg-brand-slate-50 hover:bg-brand-emerald-50 border border-brand-slate-200 hover:border-brand-emerald-300 font-semibold text-brand-slate-800 hover:text-brand-emerald-900 flex flex-col items-center text-center gap-1.5 transition-all"
              >
                <Package className="w-4 h-4 text-brand-emerald-800" />
                <span>Add Product</span>
              </Link>

              <Link
                href="/vendor/orders"
                className="p-3 rounded-xl bg-brand-slate-50 hover:bg-brand-emerald-50 border border-brand-slate-200 hover:border-brand-emerald-300 font-semibold text-brand-slate-800 hover:text-brand-emerald-900 flex flex-col items-center text-center gap-1.5 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-brand-emerald-800" />
                <span>Process Orders</span>
              </Link>

              <Link
                href="/vendor/pricing"
                className="p-3 rounded-xl bg-brand-slate-50 hover:bg-brand-emerald-50 border border-brand-slate-200 hover:border-brand-emerald-300 font-semibold text-brand-slate-800 hover:text-brand-emerald-900 flex flex-col items-center text-center gap-1.5 transition-all"
              >
                <DollarSign className="w-4 h-4 text-brand-emerald-800" />
                <span>Pricing Rules</span>
              </Link>

              <Link
                href="/vendor/finance"
                className="p-3 rounded-xl bg-brand-slate-50 hover:bg-brand-emerald-50 border border-brand-slate-200 hover:border-brand-emerald-300 font-semibold text-brand-slate-800 hover:text-brand-emerald-900 flex flex-col items-center text-center gap-1.5 transition-all"
              >
                <Receipt className="w-4 h-4 text-brand-emerald-800" />
                <span>Settlements</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
