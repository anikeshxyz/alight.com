"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Megaphone,
  Flame,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { couponService } from "@/services/coupon-service";
import { Coupon, CreateCouponRequest, PromotionBanner } from "@/types/coupon";
import { useAuth } from "@/context/AuthContext";

export default function VendorMarketingPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"coupons" | "campaigns" | "flash">("coupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<PromotionBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Coupon Form
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(1000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(500);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [validDays, setValidDays] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  const loadMarketingData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [couponRes, promoRes] = await Promise.all([
        couponService.getAvailablePublicCoupons(),
        couponService.getActivePromotions(),
      ]);
      if (couponRes.success && couponRes.data) setCoupons(couponRes.data);
      if (promoRes.success && promoRes.data) setPromotions(promoRes.data);
    } catch (err) {
      console.error("Failed to load marketing data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketingData();
  }, [loadMarketingData]);

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !code.trim()) return;

    setSubmitting(true);
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      const payload: CreateCouponRequest = {
        code: code.trim().toUpperCase(),
        title: title.trim() || `Special Offer ${code}`,
        discountType,
        discountValue,
        minOrderAmount: minOrderValue,
        maxDiscountAmount: discountType === "PERCENTAGE" ? maxDiscountAmount : undefined,
        usageLimitTotal: usageLimit,
        startDate,
        endDate,
      };

      const res = await couponService.createVendorCoupon(payload, token);
      if (res.success) {
        setCreateModalOpen(false);
        setCode("");
        setTitle("");
        loadMarketingData();
      }
    } catch (err) {
      console.error("Failed to create coupon", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Marketing & Promotions Hub
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Growth Engine
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Create store coupons, launch seasonal category discounts, join marketplace flash sales, and incentivize bulk orders.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={loadMarketingData} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Promo Coupon
          </Button>
        </div>
      </div>

      {/* 2. TABS */}
      <div className="flex border-b border-brand-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "coupons"
              ? "border-brand-emerald-800 text-brand-emerald-800 font-bold"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Store Coupons ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "campaigns"
              ? "border-brand-emerald-800 text-brand-emerald-800 font-bold"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" /> Platform Campaigns ({promotions.length})
        </button>
        <button
          onClick={() => setActiveTab("flash")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "flash"
              ? "border-brand-emerald-800 text-brand-emerald-800 font-bold"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Flash Deals & Bundles
        </button>
      </div>

      {/* 3. TAB 1: COUPONS */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-xs text-brand-slate-400">Loading active coupons...</div>
          ) : coupons.length === 0 ? (
            <Card className="col-span-3 p-12 text-center text-brand-slate-400">
              <Tag className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
              <p className="font-semibold text-brand-slate-700">No promo coupons published yet</p>
              <p className="text-xs text-brand-slate-400 mt-1">Create coupons to boost repeat purchases and wholesale cart conversions.</p>
            </Card>
          ) : (
            coupons.map((c) => (
              <Card key={c.id} className="p-5 border-brand-slate-200 hover:border-brand-emerald-400 transition-all shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-emerald-50 text-brand-emerald-800 flex items-center justify-center font-bold text-xs">
                      %
                    </div>
                    <div>
                      <span className="font-mono font-black text-sm text-brand-slate-900 tracking-wider">
                        {c.couponCode || c.code}
                      </span>
                      <p className="text-[10px] text-brand-slate-400">Store Promotional Code</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(c.couponCode || c.code || "")}
                    className="p-1.5 rounded-lg bg-brand-slate-50 hover:bg-brand-emerald-50 text-brand-slate-600 hover:text-brand-emerald-800 text-xs font-bold transition flex items-center gap-1"
                  >
                    {copiedCode === (c.couponCode || c.code) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-brand-slate-800 line-clamp-1">{c.title}</p>
                  <p className="text-[11px] text-brand-slate-500">
                    Discount:{" "}
                    <strong className="text-brand-slate-900">
                      {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                    </strong>
                  </p>
                  <p className="text-[11px] text-brand-slate-500">
                    Min Cart Value: <strong className="text-brand-slate-900">₹{c.minOrderAmount || c.minOrderSubtotal || 0}</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-brand-slate-100 flex items-center justify-between text-[10px] text-brand-slate-400">
                  <span>Usage: {c.totalUsedCount || c.usedCount || 0} / {c.usageLimitTotal || "∞"}</span>
                  <span className="text-emerald-700 font-semibold">Active in Checkout</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 4. TAB 2: PLATFORM CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <Card key={promo.id} className="p-5 bg-gradient-to-br from-brand-slate-950 to-brand-emerald-950 text-white border-brand-slate-800 shadow-xl flex flex-col justify-between">
              <div className="space-y-2">
                <span className="bg-brand-gold-400 text-brand-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                  {promo.badgeText || "PLATFORM SPECIAL"}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{promo.title}</h3>
                <p className="text-xs text-brand-slate-300 leading-relaxed">{promo.subtitle}</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs mt-3">
                <span className="text-brand-gold-300 font-mono font-bold">Code: {promo.couponCode || "AUTO-APPLY"}</span>
                <span className="text-emerald-400 font-semibold">Enrolled</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 5. TAB 3: FLASH DEALS */}
      {activeTab === "flash" && (
        <Card className="p-8 text-center text-brand-slate-500 space-y-3 border-brand-slate-200">
          <Flame className="w-10 h-10 mx-auto text-amber-500" />
          <h3 className="text-base font-bold text-brand-slate-900">Seasonal Flash Sale Registrations</h3>
          <p className="text-xs text-brand-slate-400 max-w-md mx-auto">
            Marketplace-wide flash sales (Diwali Grand Hardware Expo, Builder Wholesale Week) open for enrollment 14 days prior to sale date.
          </p>
        </Card>
      )}

      {/* Modal: Create Coupon */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Merchant Promo Coupon">
        <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs text-brand-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Coupon Promo Code *</label>
              <input
                type="text"
                placeholder="e.g. ALIGHT500"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono font-bold text-sm focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Campaign Title *</label>
              <input
                type="text"
                placeholder="e.g. 10% Off Architect Orders"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Discount Value</label>
              <input
                type="number"
                min="1"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Min Order Value (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Total Usage Limit</label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting} className="bg-brand-emerald-800 text-white font-bold">
              Publish Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
