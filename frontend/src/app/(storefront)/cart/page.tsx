"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  Tag,
  Check,
  Percent,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { applyCouponApi, getAvailableCouponsApi } from "@/services/coupon-service";
import { Coupon, CouponValidationResponse } from "@/types/coupon";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const { cart, isLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { formatMoney } = useCurrency();
  const { token } = useAuth();

  const [couponCodeInput, setCouponCodeInput] = React.useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponValidationResponse | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState<boolean>(false);
  const [availableCoupons, setAvailableCoupons] = React.useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = React.useState<boolean>(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = React.useState<boolean>(false);

  const hasOutOfStockItems = Boolean(
    cart &&
    cart.items &&
    cart.items.some(
      (item) =>
        (item.availableStock !== undefined && item.availableStock !== null && item.availableStock <= 0) ||
        (item.availableStock !== undefined && item.availableStock !== null && item.quantity > item.availableStock)
    )
  );

  React.useEffect(() => {
    getAvailableCouponsApi(token || undefined)
      .then((res) => {
        if (res.success && res.data) {
          setAvailableCoupons(res.data);
        }
      })
      .catch((e) => console.error("Could not fetch coupons:", e));
  }, [token]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code || !cart) return;

    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const itemsPayload = cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        vendorId: i.vendorId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.unitPrice * i.quantity,
      }));

      const res = await applyCouponApi(
        {
          couponCode: code,
          cartSubtotal: cart.subtotalAmount,
          shippingAmount: cart.estimatedShippingAmount,
          items: itemsPayload,
        },
        token || undefined
      );

      if (res.success && res.data && res.data.valid) {
        setAppliedCoupon(res.data);
        setCouponCodeInput(code);
        setIsCouponModalOpen(false);
      } else {
        setCouponError(res.data?.message || res.message || "Invalid coupon code");
      }
    } catch (e: any) {
      setCouponError(e.message || "Failed to validate coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError(null);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-20 h-20 bg-brand-emerald-50 text-brand-emerald-700 rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-in zoom-in-90">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-slate-900 mb-2">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-brand-slate-500 text-sm sm:text-base max-w-md text-center mb-8">
          Explore our certified industrial manufacturers and wholesale suppliers to start adding products to your order.
        </p>
        <Link href="/">
          <Button variant="primary" size="lg" className="rounded-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span>Start Sourcing Now</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 flex items-center gap-3">
            <span>Shopping Cart</span>
            <Badge variant="brand" size="md">
              {cart.totalItems} {cart.totalItems === 1 ? "Item" : "Items"}
            </Badge>
          </h1>
          <p className="text-brand-slate-500 text-xs sm:text-sm mt-1">
            Review items grouped by manufacturer dispatch hubs
          </p>
        </div>

        <button
          onClick={() => clearCart()}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All Items</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vendor Grouped Items */}
        <div className="lg:col-span-8 space-y-6">
          {cart.vendorGroups.map((group, groupIdx) => (
            <div
              key={group.vendorId || groupIdx}
              className="bg-white rounded-2xl border border-brand-slate-200 overflow-hidden shadow-sm"
            >
              {/* Vendor Partition Banner */}
              <div className="bg-brand-slate-50/80 px-5 py-3.5 border-b border-brand-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-emerald-100 text-brand-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-brand-slate-500 uppercase tracking-wider font-semibold">
                      Fulfilled by
                    </span>
                    <h3 className="text-sm font-bold text-brand-slate-900">
                      {group.storeName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-brand-emerald-700 bg-brand-emerald-50 px-2.5 py-1 rounded-full font-medium">
                    <Truck className="w-3.5 h-3.5" />
                    <span>
                      {group.groupShipping === 0
                        ? "Free Delivery"
                        : `Estimated Dispatch: ${formatMoney(group.groupShipping)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-brand-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-brand-slate-50/40 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-brand-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-brand-slate-200">
                      {item.primaryImageUrl ? (
                        <img
                          src={item.primaryImageUrl}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-slate-400">
                          <ShoppingBag className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-sm font-bold text-brand-slate-900 hover:text-brand-emerald-800 transition-colors line-clamp-1"
                      >
                        {item.productTitle}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-brand-slate-600 bg-brand-slate-100 px-2 py-0.5 rounded">
                          {item.variantName || "Standard Variant"}
                        </span>
                        <span className="text-[11px] text-brand-slate-400 font-mono">
                          SKU: {item.variantSku}
                        </span>
                      </div>

                      {/* Pricing with Wholesale tier savings */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-brand-slate-900">
                          {formatMoney(item.unitPrice)}
                        </span>
                        {item.regularPrice > item.unitPrice && (
                          <>
                            <span className="text-xs text-brand-slate-400 line-through">
                              {formatMoney(item.regularPrice)}
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Wholesale Tier Applied
                            </span>
                          </>
                        )}
                      </div>

                      {item.availableStock !== undefined && item.availableStock !== null && item.availableStock <= 0 && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          Out of Stock
                        </span>
                      )}
                      {item.availableStock !== undefined && item.availableStock !== null && item.availableStock > 0 && item.quantity > item.availableStock && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          Only {item.availableStock} available
                        </span>
                      )}
                    </div>

                    {/* Quantity Stepper & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0">
                      <div className="flex items-center border border-brand-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="p-1.5 hover:bg-brand-slate-100 text-brand-slate-600 disabled:opacity-40 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-brand-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={
                            isLoading ||
                            (item.availableStock !== undefined &&
                              item.availableStock !== null &&
                              (item.availableStock <= 0 || item.quantity >= item.availableStock))
                          }
                          className="p-1.5 hover:bg-brand-slate-100 text-brand-slate-600 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-brand-emerald-950">
                            {formatMoney(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-brand-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vendor Subtotal Footer */}
              <div className="bg-brand-slate-50/50 px-5 py-3 border-t border-brand-slate-100 flex justify-between items-center text-xs">
                <span className="text-brand-slate-500 font-medium">
                  Sub-total for {group.storeName}
                </span>
                <span className="font-bold text-brand-slate-800">
                  {formatMoney(group.groupSubtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm sticky top-24 space-y-6">
            <h2 className="text-lg font-bold text-brand-slate-900 border-b border-brand-slate-100 pb-4">
              Order Summary
            </h2>

            {/* Promo Code Input & Drawer Trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-brand-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-emerald-800" />
                  <span>Promotions & Vouchers</span>
                </span>
                {availableCoupons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(true)}
                    className="text-brand-emerald-800 hover:text-brand-emerald-950 font-bold hover:underline"
                  >
                    View Offers ({availableCoupons.length})
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-mono">{appliedCoupon.couponCode}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {appliedCoupon.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code..."
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    className="w-full bg-brand-slate-50 border border-brand-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-brand-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyCoupon()}
                    isLoading={isApplyingCoupon}
                    disabled={!couponCodeInput.trim()}
                    className="text-xs font-bold whitespace-nowrap"
                  >
                    Apply
                  </Button>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-rose-600 font-medium">{couponError}</p>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-brand-slate-600">
                <span>Total Items Subtotal</span>
                <span className="font-medium text-brand-slate-900">
                  {formatMoney(cart.subtotalAmount)}
                </span>
              </div>

              {cart.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Wholesale Tier Savings</span>
                  <span>-{formatMoney(cart.discountAmount)}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon ({appliedCoupon.couponCode})</span>
                  </span>
                  <span>-{formatMoney(appliedCoupon.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-slate-600">
                <span className="flex items-center gap-1">
                  Estimated GST (CGST/SGST/IGST)
                </span>
                <span className="font-medium text-brand-slate-900">
                  {formatMoney(cart.estimatedTaxAmount)}
                </span>
              </div>

              <div className="flex justify-between text-brand-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-medium text-brand-slate-900">
                  {appliedCoupon?.revisedShipping !== undefined
                    ? appliedCoupon.revisedShipping === 0
                      ? "Free (Promo Applied)"
                      : formatMoney(appliedCoupon.revisedShipping)
                    : cart.estimatedShippingAmount === 0
                    ? "Free"
                    : formatMoney(cart.estimatedShippingAmount)}
                </span>
              </div>

              <div className="border-t border-brand-slate-200 pt-4 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold text-brand-slate-900">
                    Grand Total
                  </span>
                  <p className="text-[11px] text-brand-slate-400">
                    Includes all applicable taxes & fulfillment
                  </p>
                </div>
                <span className="text-2xl font-black text-brand-emerald-950">
                  {formatMoney(
                    appliedCoupon?.revisedGrandTotal !== undefined
                      ? appliedCoupon.revisedGrandTotal + cart.estimatedTaxAmount
                      : cart.grandTotal
                  )}
                </span>
              </div>
            </div>

            {hasOutOfStockItems && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Action Required</span>
                  <span>Some items are out of stock or exceed available inventory. Please remove or adjust them to proceed.</span>
                </div>
              </div>
            )}

            {hasOutOfStockItems ? (
              <Button
                variant="primary"
                size="lg"
                disabled
                className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-none opacity-60 cursor-not-allowed bg-brand-slate-300 text-brand-slate-600 border-none"
              >
                <span>Remove Out-of-Stock Items to Checkout</span>
              </Button>
            ) : (
              <Link href={`/checkout${appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon.couponCode || "")}` : ""}`} className="block">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {/* Trust and Guarantee Badges */}
            <div className="pt-2 border-t border-brand-slate-100 space-y-2.5 text-xs text-brand-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-emerald-700 flex-shrink-0" />
                <span>Verified GST invoices with split vendor payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-emerald-700 flex-shrink-0" />
                <span>Automated multi-vendor dispatch & tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Coupons Drawer / Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-200 relative animate-in fade-in zoom-in duration-150 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-brand-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-emerald-800" />
                <h3 className="text-lg font-black text-brand-slate-900">Available Coupons & Offers</h3>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-sm font-bold p-1 rounded-full hover:bg-brand-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-grow pr-1">
              {availableCoupons.map((c) => (
                <div
                  key={c.id}
                  className="bg-brand-slate-50/70 border border-brand-slate-200 rounded-2xl p-4 space-y-2.5 hover:border-brand-emerald-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-black text-brand-emerald-950 bg-brand-emerald-100/80 px-2.5 py-1 rounded-md">
                      {c.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      className="px-3 py-1 bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Apply
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-brand-slate-900">{c.title}</p>
                    {c.description && (
                      <p className="text-[11px] text-brand-slate-500 mt-0.5">{c.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] text-brand-slate-500 pt-1 border-t border-brand-slate-200/60">
                    <span>Min Order: <strong>{formatMoney(c.minOrderAmount)}</strong></span>
                    {c.maxDiscountAmount && (
                      <span>• Max Discount: <strong>{formatMoney(c.maxDiscountAmount)}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
