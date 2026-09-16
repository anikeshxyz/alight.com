"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCustomerDashboardApi } from "@/services/user-service";
import { CustomerDashboardData } from "@/types/dashboard";
import {
  ShoppingBag,
  Clock,
  Heart,
  Wallet,
  Award,
  LifeBuoy,
  FileText,
  Truck,
  ArrowRight,
  RotateCcw,
  MapPin,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AccountOverviewPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getCustomerDashboardApi(token);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Failed to load dashboard overview.");
      }
    } catch (err: any) {
      console.error("Dashboard overview error:", err);
      setError(err?.message || "An unexpected error occurred while fetching your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getInitials = () => {
    if (!user) return "AL";
    const f = user.firstName ? user.firstName[0] : "";
    const l = user.lastName ? user.lastName[0] : "";
    return (f + l).toUpperCase() || "AL";
  };

  const formatCurrency = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
        return "success";
      case "SHIPPED":
      case "CONFIRMED":
      case "PROCESSING":
        return "info";
      case "CANCELLED":
      case "FAILED":
      case "REJECTED":
        return "danger";
      case "PLACED":
      case "REQUESTED":
      case "PENDING":
        return "warning";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
        </div>
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse p-4" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalOrders: 0,
    activeOrders: 0,
    wishlistCount: 0,
    openSupportTickets: 0,
    activeRfqs: 0,
    savedAddressesCount: 0,
    walletBalance: 0,
    rewardPoints: 0,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Command Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-amber-200/60 shrink-0">
            {getInitials()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer" : "Alight Customer"}
              </h1>
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-700/70 text-emerald-200 border border-emerald-500/50">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  Verified Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">
                  <AlertCircle className="w-3 h-3 text-amber-300" />
                  Email Pending
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-200/90 font-mono mt-0.5">{user?.email}</p>
            <p className="text-xs text-slate-300 mt-1">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "2026"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="text-xs border-emerald-600/70 text-emerald-100 hover:bg-emerald-800/60 bg-emerald-950/40 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
          <Link href="/account/profile">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-emerald-600/70 text-emerald-100 hover:bg-emerald-800/60 bg-emerald-950/40"
            >
              Edit Profile
            </Button>
          </Link>
          <Link href="/account/orders">
            <Button
              variant="primary"
              size="sm"
              className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold border-none"
            >
              My Orders
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => fetchDashboard()}
            className="font-bold underline hover:no-underline text-rose-900 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Account Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Link
          href="/account/orders"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.totalOrders}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span>Lifetime purchases</span>
            </div>
          </div>
        </Link>

        {/* Active Orders */}
        <Link
          href="/account/orders?tab=active"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Active In-Transit</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {metrics.activeOrders}
              {metrics.activeOrders > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 animate-pulse">
                  Live
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Dispatched or processing</div>
          </div>
        </Link>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Saved Wishlist</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.wishlistCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Saved for later purchase</div>
          </div>
        </Link>

        {/* Wallet / Store Credits */}
        <Link
          href="/account/wallet"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Wallet Credits</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(metrics.walletBalance || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Authoritative balance</div>
          </div>
        </Link>

        {/* Rewards */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Reward Points</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.rewardPoints}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Alight Advantage points</div>
          </div>
        </div>

        {/* Open Support Tickets */}
        <Link
          href="/support"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Support Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.openSupportTickets}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Open inquiries</div>
          </div>
        </Link>

        {/* Active RFQs */}
        <Link
          href="/quotes"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Active RFQs</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.activeRfqs}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pending vendor quotes</div>
          </div>
        </Link>

        {/* Saved Addresses */}
        <Link
          href="/account/addresses"
          className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Saved Addresses</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.savedAddressesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Shipping destinations</div>
          </div>
        </Link>
      </div>

      {/* 3. Quick Actions Command Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
          Quick Actions & Services
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/account/orders"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">My Orders</p>
              <p className="text-[10px] text-slate-500 truncate">Track & history</p>
            </div>
          </Link>

          <Link
            href="/account/returns"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Returns & RMA</p>
              <p className="text-[10px] text-slate-500 truncate">Reverse pickups</p>
            </div>
          </Link>

          <Link
            href="/account/payments"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Payment Receipts</p>
              <p className="text-[10px] text-slate-500 truncate">Invoices & cards</p>
            </div>
          </Link>

          <Link
            href="/account/business"
            className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-500 hover:bg-amber-50/70 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-950 truncate">B2B Console</p>
              <p className="text-[10px] text-amber-700 truncate">Bulk RFQs & terms</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Active Returns Timeline Alert (if any active returns) */}
      {data?.recentReturns && data.recentReturns.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-950">Active RMA Return In-Progress</h3>
            </div>
            <Link
              href="/account/returns"
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
            >
              <span>View All Returns</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recentReturns.slice(0, 2).map((rma) => (
              <div
                key={rma.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 font-mono">{rma.rmaNumber}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reason: {rma.reason?.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusBadgeVariant(rma.status)}>
                    {rma.status}
                  </Badge>
                  <Link
                    href={`/account/returns/${rma.rmaNumber}`}
                    className="block text-[11px] text-emerald-800 font-bold mt-1 hover:underline"
                  >
                    Track RMA →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent Active Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your most recent marketplace purchases and shipments</p>
          </div>
          <Link href="/account/orders">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <span>View All Orders</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {(!data?.recentOrders || data.recentOrders.length === 0) ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Explore Alight International&apos;s curated catalog of premium hardware, architectural fittings, and industrial supplies.
            </p>
            <Link href="/products">
              <Button variant="primary" size="sm">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status || order.orderStatus || "CONFIRMED")}>
                      {order.status || order.orderStatus || "CONFIRMED"}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatCurrency(order.totalAmount || order.grandTotal || 0, order.currency || order.currencyCode || "INR")}
                    </span>
                  </div>
                </div>

                {/* Sub-orders / items preview */}
                <div className="space-y-2">
                  {order.vendorOrders?.map((vo: any) => (
                    <div
                      key={vo.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 truncate">
                            Vendor: {vo.vendorStoreName || vo.vendorName || "Alight Atelier"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({vo.subOrderNumber})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {vo.items?.map((it: any) => `${it.productTitle || it.productName} × ${it.quantity}`).join(", ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={getStatusBadgeVariant(vo.fulfillmentStatus)} size="sm">
                          {vo.fulfillmentStatus}
                        </Badge>
                        <Link href={`/orders/${order.orderNumber}`}>
                          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Extensible Recommendations / Security Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security & Verification status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Protection & Security</h3>
            <p className="text-xs text-slate-600 mt-1">
              Your account is guarded with enterprise authentication, role authorization, and encrypted payment tokens.
            </p>
            <Link
              href="/account/security"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline mt-2"
            >
              <span>Manage Security Settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* B2B Procurement Extension Point */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/90 shadow-2xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Need Enterprise / Bulk Purchasing?</h3>
            <p className="text-xs text-amber-900 mt-1">
              Request customized quotations with volume discounts, project-based delivery schedules, and verified tax invoices.
            </p>
            <Link
              href="/quotes"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-950 hover:underline mt-2"
            >
              <span>Submit RFQ Inquiry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
