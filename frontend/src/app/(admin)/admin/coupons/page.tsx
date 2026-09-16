"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Percent,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  Megaphone,
  Trash2,
  Power,
  ExternalLink,
  Globe,
  Sliders,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { couponService } from "@/services/coupon-service";
import {
  Coupon,
  CouponStatsSummary,
  CreateCouponPayload,
  PromotionBanner,
  CouponDiscountType,
  CouponScope
} from "@/types/coupon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminCouponsAndMarketingPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<"COUPONS" | "BANNERS">("COUPONS");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [stats, setStats] = useState<CouponStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [couponFormData, setCouponFormData] = useState<CreateCouponPayload>({
    couponCode: "",
    title: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscountAmount: 1000,
    minOrderSubtotal: 2000,
    scope: "GLOBAL",
    usageLimitTotal: 500,
    usageLimitPerUser: 1,
    startDate: new Date().toISOString().split("T")[0] + "T00:00:00Z",
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T23:59:59Z",
    isPublic: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [couponsRes, bannersRes, statsRes] = await Promise.all([
        couponService.searchAdminCoupons(token || "", searchQuery, undefined, 0, 100),
        couponService.getActivePromotions(),
        couponService.getAdminStats(token || ""),
      ]);

      if (couponsRes.success && couponsRes.data) {
        setCoupons(couponsRes.data.content || []);
      }
      if (bannersRes.success && bannersRes.data) {
        setBanners(bannersRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin coupons and marketing data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await couponService.toggleAdminCoupon(id, token);
      if (res.success && res.data) {
        setCoupons((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      }
    } catch (err) {
      console.error("Failed to toggle coupon status", err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this coupon campaign?")) return;
    try {
      const res = await couponService.deleteAdminCoupon(id, token);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete coupon", err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponFormData.couponCode?.trim() || "";
    if (!code) {
      setCouponError("Coupon code is required");
      return;
    }

    setIsSubmittingCoupon(true);
    try {
      const res = await couponService.createAdminCoupon(
        {
          ...couponFormData,
          couponCode: code.toUpperCase(),
        },
        token
      );

      if (res.success && res.data) {
        setIsCouponModalOpen(false);
        setCouponFormData({
          couponCode: "",
          title: "",
          description: "",
          discountType: "PERCENTAGE",
          discountValue: 15,
          maxDiscountAmount: 1000,
          minOrderSubtotal: 2000,
          scope: "GLOBAL",
          usageLimitTotal: 500,
          usageLimitPerUser: 1,
          startDate: new Date().toISOString().split("T")[0] + "T00:00:00Z",
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T23:59:59Z",
          isPublic: true,
        });
        await fetchData();
      } else {
        setCouponError(res.message || "Failed to create coupon.");
      }
    } catch (err: any) {
      setCouponError(err.message || "An error occurred while creating the coupon.");
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesScope =
      filterScope === "ALL" ||
      c.scope === filterScope ||
      (filterScope === "ACTIVE" && c.isActive) ||
      (filterScope === "INACTIVE" && !c.isActive);
    return matchesScope;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-gold-400 font-semibold text-xs mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Platform Growth & Marketing Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Coupons, Discounts & Promotions Hub
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate-300 mt-1 max-w-2xl">
            Orchestrate marketplace-wide discount codes, flash sales, vendor marketing rules, and promotional hero banners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl border-brand-slate-700 bg-brand-slate-800 text-white hover:bg-brand-slate-700 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCouponModalOpen(true)}
            className="rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Global Coupon</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-emerald-50 text-brand-emerald-800 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-slate-500 font-medium">Platform Coupons</p>
            <h3 className="text-2xl font-black text-brand-slate-900">
              {stats?.totalCoupons || coupons.length}
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {stats?.activeCoupons || coupons.filter((c) => c.isActive).length} Active Live
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-slate-500 font-medium">Total Redemptions</p>
            <h3 className="text-2xl font-black text-brand-slate-900">
              {stats?.totalRedemptions || coupons.reduce((sum, c) => sum + (c.usedCount ?? c.totalUsedCount ?? 0), 0)}
            </h3>
            <span className="text-[10px] text-blue-700 font-semibold">
              Checkout transactions
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-slate-500 font-medium">Total Discounts Funded</p>
            <h3 className="text-2xl font-black text-brand-slate-900">
              {formatMoney(stats?.totalDiscountGranted || 0)}
            </h3>
            <span className="text-[10px] text-amber-800 font-semibold">
              Buyer incentives saved
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-slate-500 font-medium">Active Campaigns</p>
            <h3 className="text-2xl font-black text-brand-slate-900">
              {banners.length}
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Storefront Hero Banners
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-slate-200">
        <button
          onClick={() => setActiveTab("COUPONS")}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "COUPONS"
              ? "border-brand-emerald-800 text-brand-emerald-900"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Discount Rules & Coupons ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("BANNERS")}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "BANNERS"
              ? "border-brand-emerald-800 text-brand-emerald-900"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Flash Sale & Hero Banners ({banners.length})</span>
        </button>
      </div>

      {/* TAB 1: COUPONS EXPLORER */}
      {activeTab === "COUPONS" && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-brand-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coupon code, scope or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-brand-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-brand-slate-400 flex items-center gap-1 font-medium pl-1">
                <Filter className="w-3.5 h-3.5" /> Scope:
              </span>
              {["ALL", "GLOBAL", "VENDOR", "FIRST_ORDER", "CATEGORY", "PRODUCT", "ACTIVE", "INACTIVE"].map((sc) => (
                <button
                  key={sc}
                  onClick={() => setFilterScope(sc)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    filterScope === sc
                      ? "bg-brand-slate-900 text-white shadow-xs"
                      : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
                  }`}
                >
                  {sc.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Coupon Code</th>
                    <th className="px-4 py-3.5">Scope & Target</th>
                    <th className="px-4 py-3.5">Benefit Mechanics</th>
                    <th className="px-4 py-3.5">Usage / Limit</th>
                    <th className="px-4 py-3.5">Min Order</th>
                    <th className="px-4 py-3.5">Validity</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate-100 font-medium text-brand-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-brand-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-emerald-800" />
                        <span>Loading marketplace coupons...</span>
                      </td>
                    </tr>
                  ) : filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-brand-slate-400">
                        No coupons found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const code = coupon.couponCode || coupon.code || "";
                      const used = coupon.usedCount ?? coupon.totalUsedCount ?? 0;
                      const minOrder = coupon.minOrderSubtotal ?? coupon.minOrderAmount ?? 0;
                      const expDate = coupon.endDate || coupon.validUntil;

                      return (
                      <tr key={coupon.id} className="hover:bg-brand-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-brand-slate-900 bg-brand-slate-100 px-2 py-0.5 rounded border border-brand-slate-200 text-xs">
                              {code}
                            </span>
                            <button
                              onClick={() => handleCopy(code)}
                              className="text-brand-slate-400 hover:text-brand-emerald-800"
                              title="Copy Code"
                            >
                              {copiedCode === code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-brand-slate-500 line-clamp-1 mt-0.5 font-normal">
                            {coupon.title}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              coupon.scope === "GLOBAL"
                                ? "bg-emerald-100 text-emerald-900"
                                : coupon.scope === "VENDOR"
                                ? "bg-blue-100 text-blue-800"
                                : coupon.scope === "FIRST_ORDER"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-brand-slate-100 text-brand-slate-800"
                            }`}
                          >
                            {coupon.scope}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold text-brand-slate-900">
                            {coupon.discountType === "PERCENTAGE" && `${coupon.discountValue}% OFF`}
                            {coupon.discountType === "FIXED_AMOUNT" && `${formatMoney(coupon.discountValue)} OFF`}
                            {coupon.discountType === "FREE_SHIPPING" && "Free Shipping"}
                          </div>
                          {coupon.maxDiscountAmount && coupon.discountType === "PERCENTAGE" && (
                            <span className="text-[10px] text-brand-slate-400 block font-normal">
                              Capped at {formatMoney(coupon.maxDiscountAmount)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs font-bold text-brand-slate-800">
                            {used} used
                          </div>
                          <span className="text-[10px] text-brand-slate-400 block font-normal">
                            {coupon.usageLimitTotal ? `Limit: ${coupon.usageLimitTotal}` : "Unlimited"}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-mono font-semibold">
                          {minOrder > 0 ? formatMoney(minOrder) : "None"}
                        </td>

                        <td className="px-4 py-4 text-brand-slate-500 text-[11px]">
                          {expDate
                            ? new Date(expDate).toLocaleDateString()
                            : "Permanent"}
                        </td>

                        <td className="px-4 py-4">
                          <Badge variant={coupon.isActive ? "success" : "default"}>
                            {coupon.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleCoupon(coupon.id)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                coupon.isActive
                                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title={coupon.isActive ? "Disable Coupon" : "Activate Coupon"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTION BANNERS MANAGER */}
      {activeTab === "BANNERS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`rounded-3xl p-6 shadow-md border text-white flex flex-col justify-between overflow-hidden relative ${
                  banner.badgeText?.includes("SUPER")
                    ? "bg-gradient-to-r from-brand-slate-950 via-brand-emerald-950 to-slate-900 border-brand-emerald-800/40"
                    : "bg-gradient-to-r from-brand-emerald-950 via-brand-emerald-900 to-slate-900 border-emerald-800/40"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider text-brand-gold-400 border border-white/10">
                      {banner.badgeText || "PROMOTION"}
                    </span>
                    <Badge variant={banner.isActive ? "success" : "default"}>
                      {banner.isActive ? "Live on Storefront" : "Paused"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-black">{banner.title}</h3>
                    <p className="text-xs text-brand-slate-200 mt-1 max-w-md">
                      {banner.subtitle}
                    </p>
                  </div>

                  {banner.couponCode && (
                    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-2.5 rounded-xl border border-white/10 w-fit">
                      <span className="text-[11px] text-brand-slate-300">Target Coupon:</span>
                      <span className="font-mono font-extrabold text-brand-gold-400 text-xs">
                        {banner.couponCode}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                  <div className="text-[11px] text-brand-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Active until {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : "Permanent"}</span>
                  </div>
                  <a
                    href={banner.targetUrl || "/"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-white font-bold flex items-center gap-1 hover:text-brand-gold-400 transition-colors"
                  >
                    <span>{banner.ctaText || "Shop Now"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Global Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-brand-slate-100 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-slate-900 text-brand-gold-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-slate-900">
                    Create Platform Discount Coupon
                  </h3>
                  <p className="text-xs text-brand-slate-500">
                    Configure global marketplace incentives, scopes, and caps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 text-brand-slate-400 hover:text-brand-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {couponError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{couponError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponFormData.couponCode}
                    onChange={(e) =>
                      setCouponFormData({ ...couponFormData, couponCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. GLOBAL50, WELCOME10"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Target Scope *
                  </label>
                  <select
                    value={couponFormData.scope}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        scope: e.target.value as CouponScope,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  >
                    <option value="GLOBAL">Global Marketplace (All Vendors)</option>
                    <option value="FIRST_ORDER">First-Time Buyer Order</option>
                    <option value="CATEGORY">Category Specific</option>
                    <option value="PRODUCT">Product Specific</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        discountType: e.target.value as CouponDiscountType,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  >
                    <option value="PERCENTAGE">Percentage Discount (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount Discount (₹ Flat)</option>
                    <option value="FREE_SHIPPING">Free Shipping Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    {couponFormData.discountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={couponFormData.discountType === "PERCENTAGE" ? "100" : "100000"}
                    value={couponFormData.discountValue}
                    onChange={(e) =>
                      setCouponFormData({ ...couponFormData, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Promotion Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponFormData.title}
                    onChange={(e) => setCouponFormData({ ...couponFormData, title: e.target.value })}
                    placeholder="e.g. 15% Off All Electronics & Engineering Components"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                {couponFormData.discountType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={couponFormData.maxDiscountAmount || ""}
                      onChange={(e) =>
                        setCouponFormData({
                          ...couponFormData,
                          maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 1000 (optional cap)"
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Minimum Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponFormData.minOrderSubtotal || ""}
                    onChange={(e) =>
                      setCouponFormData({ ...couponFormData, minOrderSubtotal: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Total Platform Redemptions Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponFormData.usageLimitTotal || ""}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        usageLimitTotal: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 500 uses"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Per-User Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponFormData.usageLimitPerUser || 1}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        usageLimitPerUser: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={couponFormData.startDate ? couponFormData.startDate.split("T")[0] : ""}
                    onChange={(e) =>
                      setCouponFormData({ ...couponFormData, startDate: e.target.value + "T00:00:00Z" })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={couponFormData.endDate ? couponFormData.endDate.split("T")[0] : ""}
                    onChange={(e) =>
                      setCouponFormData({ ...couponFormData, endDate: e.target.value + "T23:59:59Z" })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingCoupon}
                  className="rounded-xl text-xs font-bold shadow-md"
                >
                  {isSubmittingCoupon ? "Deploying..." : "Deploy Global Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
