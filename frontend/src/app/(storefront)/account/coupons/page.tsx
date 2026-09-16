"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tag, Copy, Check, Percent, Sparkles, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Coupon {
  code: string;
  title: string;
  description: string;
  discount: string;
  minOrder: string;
  expiry: string;
  status: "AVAILABLE" | "EXPIRED" | "USED";
}

const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: "ALIGHTWELCOME",
    title: "New Member Architectural Welcome",
    description: "Flat 10% discount on your first order across all designer hardware and bathroom fittings.",
    discount: "10% OFF",
    minOrder: "₹2,500",
    expiry: "31 Dec 2026",
    status: "AVAILABLE",
  },
  {
    code: "BULKBUILDER5",
    title: "Commercial Volume Builder Tier",
    description: "Special ₹1,500 instant discount on multi-unit architectural procurement orders.",
    discount: "₹1,500 OFF",
    minOrder: "₹25,000",
    expiry: "31 Dec 2026",
    status: "AVAILABLE",
  },
  {
    code: "FESTIVEFITTINGS",
    title: "Seasonal Brassware Savings",
    description: "Enjoy 15% discount on heritage mortise handles and premium brass hardware collections.",
    discount: "15% OFF",
    minOrder: "₹5,000",
    expiry: "30 Nov 2026",
    status: "AVAILABLE",
  },
];

export default function CustomerCouponsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Coupons & Promotional Vouchers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified discount codes applicable during checkout on eligible product catalogs
          </p>
        </div>

        <Link href="/products">
          <Button variant="outline" size="sm" className="text-xs">
            Shop Eligible Products
          </Button>
        </Link>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_COUPONS.map((coupon) => (
          <div
            key={coupon.code}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Top Tag */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {coupon.discount}
                </span>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Valid till {coupon.expiry}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                {coupon.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {coupon.description}
              </p>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Min. Order Value: <strong className="text-slate-700">{coupon.minOrder}</strong>
              </p>
            </div>

            {/* Bottom Copy Code Bar */}
            <div className="pt-4 mt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                  {coupon.code}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(coupon.code)}
                className="h-8 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Backend Policy Note */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs text-slate-600 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Coupon Validation Policy:</span> All coupon codes are
          authoritatively validated by the backend pricing engine at the time of checkout. Discount thresholds are
          calculated on the subtotal before taxes and shipping.
        </div>
      </div>
    </div>
  );
}
