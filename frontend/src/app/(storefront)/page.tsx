"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Store,
  Package,
  Sparkles,
  Tag,
  Copy,
  Check,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { HeroSlider } from "@/components/storefront/HeroSlider";
import { CATEGORIES } from "@/components/layout/CategoryNav";
import { getFeaturedProductsApi } from "@/services/product-service";
import { couponService } from "@/services/coupon-service";
import { ProductSummary } from "@/types/product";
import { Coupon, PromotionBanner } from "@/types/coupon";

export default function StorefrontHomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductSummary[]>([]);
  const [promotions, setPromotions] = useState<PromotionBanner[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    getFeaturedProductsApi(8)
      .then((res) => {
        if (res.success && res.data) {
          setFeaturedProducts(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load featured products", err);
      })
      .finally(() => {
        setLoadingProducts(false);
      });

    // Fetch live promotional campaigns & public coupons
    couponService.getActivePromotions()
      .then((res) => {
        if (res.success && res.data) {
          setPromotions(res.data);
        }
      })
      .catch((err) => console.error("Failed to load promotions", err));

    couponService.getAvailablePublicCoupons()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableCoupons(res.data);
        }
      })
      .catch((err) => console.error("Failed to load coupons", err));
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO 5-IMAGE SLIDING CAROUSEL (CLICKABLE PRODUCTS) */}
      <HeroSlider />

      {/* 2. PROMOTIONAL CAMPAIGN BANNERS (IF ACTIVE) */}
      {promotions.length > 0 && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-slate-950 via-brand-emerald-950 to-brand-slate-900 text-white p-7 shadow-xl border border-brand-slate-800 flex flex-col justify-between"
              >
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="bg-brand-gold-400 text-brand-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-md">
                      {promo.badgeText || "SPECIAL OFFER"}
                    </span>
                    {promo.endDate && (
                      <span className="text-[11px] text-brand-slate-300 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-brand-gold-400" />
                        <span>Valid until {new Date(promo.endDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-white">{promo.title}</h3>
                  <p className="text-xs text-brand-slate-200 line-clamp-2 leading-relaxed">
                    {promo.subtitle}
                  </p>

                  {promo.couponCode && (
                    <div className="pt-2 flex items-center gap-2">
                      <div className="bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2.5">
                        <span className="text-[11px] text-brand-slate-300 font-medium">Coupon Code:</span>
                        <span className="font-mono font-bold text-brand-gold-400 text-xs tracking-wider">
                          {promo.couponCode}
                        </span>
                        <button
                          onClick={() => handleCopyCode(promo.couponCode || "")}
                          className="text-brand-slate-400 hover:text-white transition-colors"
                          title="Copy Promo Code"
                        >
                          {copiedCoupon === promo.couponCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex justify-end relative z-10">
                  <Link href={promo.targetUrl || "/products"}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs font-bold gap-1 bg-white text-brand-slate-950 hover:bg-brand-slate-100 shadow-md px-4 py-2"
                    >
                      <span>{promo.ctaText || "View Collection"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. ACTIVE MARKETPLACE COUPONS */}
      {availableCoupons.length > 0 && (
        <section className="bg-white border border-brand-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-emerald-50 text-brand-emerald-800 flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-slate-900">
                  Active Verified Discount Coupons
                </h3>
                <p className="text-[11px] text-brand-slate-500">
                  Apply during checkout to unlock instant price deductions
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-emerald-50 text-brand-emerald-800 border border-brand-emerald-200 px-2.5 py-1 rounded-md">
              1-Click Copy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
            {availableCoupons.slice(0, 3).map((coupon) => (
              <div
                key={coupon.id}
                className="bg-brand-slate-50 hover:bg-brand-slate-100/80 border border-brand-slate-200/80 rounded-xl p-3.5 flex items-center justify-between transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-brand-slate-900">
                      {coupon.couponCode || coupon.code}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      {coupon.discountType === "PERCENTAGE" && `${coupon.discountValue}% OFF`}
                      {coupon.discountType === "FIXED_AMOUNT" && `₹${coupon.discountValue} OFF`}
                      {coupon.discountType === "FREE_SHIPPING" && "FREE SHIP"}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-slate-500 truncate max-w-[170px]">
                    {coupon.title}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyCode(coupon.couponCode || coupon.code || "")}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-brand-emerald-50 text-brand-slate-700 hover:text-brand-emerald-800 border border-brand-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                >
                  {copiedCoupon === (coupon.couponCode || coupon.code) ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SHOP BY CATEGORY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-slate-900">
              Explore Hardware Categories
            </h2>
            <p className="text-xs text-brand-slate-500">
              Curated modular solutions for architects, contractors and homeowners
            </p>
          </div>
          <Link href="/products" className="text-xs text-brand-emerald-800 font-bold hover:underline">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={cat.href}>
                <div className="p-4 rounded-2xl bg-white hover:bg-brand-slate-50 border border-brand-slate-200/90 hover:border-brand-emerald-600/40 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full justify-center group shadow-2xs">
                  <div className="w-11 h-11 rounded-xl bg-brand-emerald-50 group-hover:bg-brand-emerald-800 text-brand-emerald-800 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-2.5 shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-brand-slate-800 group-hover:text-brand-emerald-900 transition-colors">
                    {cat.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. FEATURED PRODUCTS GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-gold-500" /> Featured Catalog Items
            </h2>
            <p className="text-xs text-brand-slate-500">
              Verified top-tier products with certified technical specifications
            </p>
          </div>
          <Link href="/products" className="text-xs text-brand-emerald-800 font-bold hover:underline">
            Browse Full Catalog ({featuredProducts.length || "All"}) →
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3 p-4 bg-white rounded-2xl border border-brand-slate-200">
                <div className="w-full aspect-square bg-brand-slate-100 rounded-xl" />
                <div className="h-4 bg-brand-slate-100 rounded w-3/4" />
                <div className="h-3 bg-brand-slate-100 rounded w-1/2" />
                <div className="h-5 bg-brand-slate-100 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-8 bg-white border border-brand-slate-200 rounded-2xl text-center space-y-2">
            <Package className="w-8 h-8 mx-auto text-brand-slate-300" />
            <p className="text-xs text-brand-slate-500">No featured products published yet.</p>
            <Link href="/products">
              <Button variant="outline" size="sm">
                View Entire Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                <div className="h-full rounded-2xl bg-white border border-brand-slate-200/90 hover:border-brand-emerald-600/40 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-0 hover:-translate-y-1">
                  <div className="relative aspect-square w-full bg-brand-slate-50 overflow-hidden border-b border-brand-slate-100">
                    {p.primaryImageUrl ? (
                      <img
                        src={p.primaryImageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {p.discountPrice && (
                      <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm z-5">
                        Sale
                      </span>
                    )}

                    {/* Heart Wishlist Button */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <WishlistButton product={p} size="sm" />
                    </div>

                    {p.brandName && (
                      <span className="absolute bottom-2.5 left-2.5 bg-brand-slate-900/80 backdrop-blur-md text-brand-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/10 shadow-xs">
                        {p.brandName}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-brand-emerald-800 uppercase tracking-wider">
                        {p.categoryName || "Hardware"}
                      </div>
                      <h3 className="text-sm font-bold text-brand-slate-900 group-hover:text-brand-emerald-800 transition-colors line-clamp-2 mt-0.5">
                        {p.title}
                      </h3>
                      {p.vendorStoreName && (
                        <p className="text-[11px] text-brand-slate-500 mt-1 flex items-center gap-1">
                          <Store className="w-3 h-3 text-brand-slate-400" />
                          <span>{p.vendorStoreName}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-brand-slate-100 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-brand-slate-900">
                          ₹{p.discountPrice ? p.discountPrice.toFixed(2) : p.basePrice.toFixed(2)}
                        </span>
                        {p.discountPrice && (
                          <span className="text-xs text-brand-slate-400 line-through">
                            ₹{p.basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {p.inStock ? `${p.stockQuantity} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
