"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Package, Trash2, ShoppingCart, ArrowRight, Sparkles, Store, Check, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getProductBySlugApi } from "@/services/product-service";

export default function WishlistPage() {
  const { wishlistProducts, wishlistCount, removeFromWishlist, clearWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const { formatMoney } = useCurrency();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [movingAll, setMovingAll] = useState(false);

  const handleAddToCart = async (product: any) => {
    setAddingId(product.id);
    try {
      let variantId = product.variantId;
      if (!variantId && product.slug) {
        const res = await getProductBySlugApi(product.slug);
        if (res.success && res.data && res.data.variants && res.data.variants.length > 0) {
          variantId = res.data.variants[0].id;
        }
      }

      if (variantId) {
        await addToCart(variantId, 1);
        await removeFromWishlist(product.id);
        setAddedIds((prev) => new Set(prev).add(product.id));
      } else if (product.slug) {
        window.location.href = `/products/${product.slug}`;
      }
    } catch (err) {
      console.error("Failed to add wishlisted item to cart", err);
    } finally {
      setAddingId(null);
    }
  };

  const handleMoveAllToCart = async () => {
    if (wishlistProducts.length === 0) return;
    setMovingAll(true);
    try {
      for (const p of wishlistProducts) {
        let variantId = (p as any).variantId;
        if (!variantId && p.slug) {
          const res = await getProductBySlugApi(p.slug);
          if (res.success && res.data && res.data.variants && res.data.variants.length > 0) {
            variantId = res.data.variants[0].id;
          }
        }
        if (variantId) {
          await addToCart(variantId, 1);
          await removeFromWishlist(p.id);
        }
      }
    } catch (err) {
      console.error("Failed to move all wishlist items to cart", err);
    } finally {
      setMovingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-brand-burgundy/30 border-t-brand-burgundy rounded-full animate-spin mx-auto" />
        <p className="text-sm text-brand-slate-500 font-medium">Loading your saved items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              My Saved Wishlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-slate-500">
            {wishlistCount === 0
              ? "Your curated collection is currently empty"
              : `You have ${wishlistCount} saved ${wishlistCount === 1 ? "product" : "products"} ready to order`}
          </p>
        </div>

        {wishlistCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={handleMoveAllToCart}
              disabled={movingAll}
              className="text-xs font-bold gap-1.5 bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{movingAll ? "Moving All..." : "Move All to Cart"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearWishlist}
              className="text-xs text-brand-slate-500 hover:text-rose-600 hover:bg-rose-50"
            >
              Clear All
            </Button>
            <Link href="/products">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5">
                <span>Browse More</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Empty State */}
      {wishlistCount === 0 ? (
        <Card className="p-12 sm:p-16 text-center space-y-5 bg-white border border-brand-slate-200/80 rounded-2xl shadow-xs max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100/80 flex items-center justify-center mx-auto text-rose-500">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-brand-slate-900">Your Wishlist is Empty</h3>
            <p className="text-xs text-brand-slate-500 leading-relaxed max-w-sm mx-auto">
              Click the heart icon on any product in our catalog to save items for quick access or later purchase.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/products">
              <Button variant="primary" size="md" className="font-bold shadow-md">
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {wishlistProducts.map((p) => {
            const hasDiscount = p.discountPrice && p.discountPrice < (p.basePrice || 0);
            const isAdded = addedIds.has(p.id);
            const isAdding = addingId === p.id;

            return (
              <Card
                key={p.id}
                className="overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between p-0 border-brand-slate-200 group bg-white"
              >
                {/* Product Image Box */}
                <div className="relative aspect-square w-full bg-brand-slate-50 overflow-hidden border-b border-brand-slate-100 flex items-center justify-center">
                  <Link href={`/products/${p.slug || p.id}`} className="w-full h-full block">
                    {p.primaryImageUrl ? (
                      <img
                        src={p.primaryImageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </Link>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(p.id)}
                    aria-label="Remove from wishlist"
                    title="Remove from wishlist"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-brand-slate-400 hover:text-rose-600 hover:bg-white border border-brand-slate-200/60 shadow-xs flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {hasDiscount && (
                    <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                      Sale
                    </span>
                  )}

                  {p.brandName && (
                    <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-brand-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-brand-slate-200 shadow-xs">
                      {p.brandName}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {p.categoryName && (
                      <div className="text-[10px] font-bold text-brand-burgundy uppercase tracking-wider">
                        {p.categoryName}
                      </div>
                    )}
                    <Link
                      href={`/products/${p.slug || p.id}`}
                      className="text-sm font-bold text-brand-slate-900 group-hover:text-brand-burgundy transition-colors line-clamp-2 leading-snug"
                    >
                      {p.title}
                    </Link>
                    {p.vendorStoreName && (
                      <p className="text-[11px] text-brand-slate-400 flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        <span>{p.vendorStoreName}</span>
                      </p>
                    )}
                  </div>

                  {/* Pricing & Add-to-cart */}
                  <div className="space-y-2.5 pt-2 border-t border-brand-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-brand-slate-900">
                        {formatMoney(p.discountPrice || p.basePrice || 0)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-brand-slate-400 line-through">
                          {formatMoney(p.basePrice || 0)}
                        </span>
                      )}
                    </div>

                    <Button
                      variant={isAdded ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleAddToCart(p)}
                      disabled={isAdding}
                      className={`w-full text-xs font-bold gap-1.5 transition-all ${
                        isAdded ? "bg-emerald-50 text-emerald-800 border-emerald-300" : ""
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Added to Cart</span>
                        </>
                      ) : isAdding ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
