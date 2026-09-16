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
  DollarSign,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Power
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { couponService } from "@/services/coupon-service";
import {
  Coupon,
  CouponStatsSummary,
  CreateCouponPayload,
  CouponDiscountType,
  CouponScope
} from "@/types/coupon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function VendorCouponsPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCouponPayload>({
    couponCode: "",
    title: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountAmount: 500,
    minOrderSubtotal: 1000,
    scope: "VENDOR",
    usageLimitTotal: 100,
    usageLimitPerUser: 1,
    startDate: new Date().toISOString().split("T")[0] + "T00:00:00Z",
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T23:59:59Z",
    isPublic: true,
  });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [couponsRes, statsRes] = await Promise.all([
        couponService.getVendorCoupons(token, 0, 50),
        couponService.getVendorStats(token),
      ]);

      if (couponsRes.success && couponsRes.data) {
        setCoupons(couponsRes.data.content || []);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to load vendor coupons", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (couponId: string) => {
    try {
      const res = await couponService.toggleVendorCoupon(couponId, token);
      if (res.success && res.data) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === couponId ? res.data : c))
        );
      }
    } catch (err) {
      console.error("Failed to toggle coupon status", err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formData.couponCode?.trim() || "";
    if (!code) {
      setFormError("Coupon code is required");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await couponService.createVendorCoupon(
        {
          ...formData,
          couponCode: code.toUpperCase(),
        },
        token
      );

      if (res.success && res.data) {
        setIsModalOpen(false);
        setFormData({
          couponCode: "",
          title: "",
          description: "",
          discountType: "PERCENTAGE",
          discountValue: 10,
          maxDiscountAmount: 500,
          minOrderSubtotal: 1000,
          scope: "VENDOR",
          usageLimitTotal: 100,
          usageLimitPerUser: 1,
          startDate: new Date().toISOString().split("T")[0] + "T00:00:00Z",
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T23:59:59Z",
          isPublic: true,
        });
        await fetchData();
      } else {
        setFormError(res.message || "Failed to create coupon.");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred while creating the coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const codeStr = (c.couponCode || c.code || "").toLowerCase();
    const titleStr = (c.title || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = codeStr.includes(q) || titleStr.includes(q);
    const matchesType =
      filterType === "ALL" ||
      (filterType === "ACTIVE" && c.isActive) ||
      (filterType === "INACTIVE" && !c.isActive) ||
      c.discountType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-emerald-800 font-semibold text-xs mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Targeted Marketing Engine</span>
          </div>
          <h1 className="text-2xl font-black text-brand-slate-900">
            Store Coupons & Promotional Campaigns
          </h1>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Boost vendor conversion rates, drive bulk B2B purchases, and configure custom discount rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
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
            <p className="text-xs text-brand-slate-500 font-medium">Total Campaigns</p>
            <h3 className="text-2xl font-black text-brand-slate-900">
              {stats?.totalCoupons || coupons.length}
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {stats?.activeCoupons || coupons.filter((c) => c.isActive).length} Live
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
              Across store orders
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-slate-500 font-medium">Discounts Granted</p>
            <h3 className="text-2xl font-black text-brand-slate-900">
              {formatMoney(stats?.totalDiscountGranted || 0)}
            </h3>
            <span className="text-[10px] text-amber-800 font-semibold">
              Buyer incentives funded
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-slate-500 font-medium">Scope Targeting</p>
            <h3 className="text-lg font-black text-brand-slate-900">Store-Wide</h3>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Auto-split at checkout
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-brand-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or offer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-brand-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-brand-slate-400 flex items-center gap-1 font-medium pl-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {["ALL", "ACTIVE", "PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                filterType === type
                  ? "bg-brand-emerald-800 text-white shadow-xs"
                  : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
              }`}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Grid / Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-brand-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-emerald-800" />
          <span>Loading marketing campaigns...</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-brand-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-slate-100 text-brand-slate-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-brand-slate-800">No Coupons Found</h3>
          <p className="text-xs text-brand-slate-500 max-w-sm mx-auto">
            You have not launched any coupons matching your current filter. Create your first coupon to drive sales.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl font-bold"
          >
            Create First Coupon
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            const code = coupon.couponCode || coupon.code || "";
            const used = coupon.usedCount ?? coupon.totalUsedCount ?? 0;
            const minOrder = coupon.minOrderSubtotal ?? coupon.minOrderAmount ?? 0;
            const usagePercent = coupon.usageLimitTotal
              ? Math.min(100, (used / coupon.usageLimitTotal) * 100)
              : 0;

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  coupon.isActive ? "border-brand-slate-200" : "border-brand-slate-200 opacity-60 bg-brand-slate-50/50"
                }`}
              >
                {/* Card Header Top */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-brand-emerald-900 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5 shadow-xs">
                        <span>{code}</span>
                        <button
                          onClick={() => handleCopy(code)}
                          className="text-brand-gold-400 hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <Badge variant={coupon.isActive ? "success" : "default"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <button
                      onClick={() => handleToggleActive(coupon.id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        coupon.isActive
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                      title={coupon.isActive ? "Deactivate Campaign" : "Activate Campaign"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-brand-slate-900 line-clamp-1">
                      {coupon.title}
                    </h3>
                    <p className="text-xs text-brand-slate-500 line-clamp-2 mt-0.5">
                      {coupon.description || "Special promotional offer for your products."}
                    </p>
                  </div>

                  {/* Value Highlights */}
                  <div className="bg-brand-slate-50 rounded-xl p-3 border border-brand-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-brand-slate-400 block text-[10px]">Benefit</span>
                      <span className="font-extrabold text-brand-emerald-950">
                        {coupon.discountType === "PERCENTAGE" && `${coupon.discountValue}% OFF`}
                        {coupon.discountType === "FIXED_AMOUNT" && `${formatMoney(coupon.discountValue)} OFF`}
                        {coupon.discountType === "FREE_SHIPPING" && `Free Shipping`}
                      </span>
                    </div>

                    {minOrder > 0 && (
                      <div className="text-right">
                        <span className="text-brand-slate-400 block text-[10px]">Min. Order</span>
                        <span className="font-semibold text-brand-slate-700">
                          {formatMoney(minOrder)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Usage Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-brand-slate-500">
                      <span>Usage: {used} used</span>
                      <span>
                        {coupon.usageLimitTotal ? `Limit: ${coupon.usageLimitTotal}` : "Unlimited"}
                      </span>
                    </div>
                    {coupon.usageLimitTotal && (
                      <div className="w-full h-1.5 rounded-full bg-brand-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-emerald-700 rounded-full transition-all"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-brand-slate-50/70 border-t border-brand-slate-100 px-5 py-3 flex items-center justify-between text-[11px] text-brand-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-slate-400" />
                    <span>
                      {coupon.endDate
                        ? `Expires: ${new Date(coupon.endDate).toLocaleDateString()}`
                        : "No Expiration"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white border border-brand-slate-200 px-1.5 py-0.5 rounded">
                    Max 1/user
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-brand-slate-100 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-emerald-50 text-brand-emerald-800 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-slate-900">
                    Create Store Promotion Coupon
                  </h3>
                  <p className="text-xs text-brand-slate-500">
                    Configure discount mechanics, usage limits, and validity period
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-brand-slate-400 hover:text-brand-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
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
                    value={formData.couponCode}
                    onChange={(e) =>
                      setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. FLASH20, SUMMEROFF"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as CouponDiscountType,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  >
                    <option value="PERCENTAGE">Percentage Discount (% Off)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount Discount (₹ Flat)</option>
                    <option value="FREE_SHIPPING">Free Shipping Offer</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Promotion Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 15% Off on Bulk Industrial Supplies"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description displayed on storefront offer badges"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    {formData.discountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === "PERCENTAGE" ? "100" : "100000"}
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                {formData.discountType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 500 (optional cap)"
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
                    value={formData.minOrderSubtotal || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderSubtotal: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Total Campaign Redemptions Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimitTotal || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimitTotal: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 100 uses"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-800 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate ? formData.startDate.split("T")[0] : ""}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value + "T00:00:00Z" })
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
                    value={formData.endDate ? formData.endDate.split("T")[0] : ""}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value + "T23:59:59Z" })
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold shadow-md"
                >
                  {isSubmitting ? "Creating..." : "Launch Campaign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
