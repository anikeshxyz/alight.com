"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  ShoppingCart,
  Zap,
  Package,
  CheckCircle2,
  AlertCircle,
  Layers,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { getProductBySlugApi, getRelatedProductsApi } from "@/services/product-service";
import { getProductStockOverviewApi } from "@/services/inventory-service";
import { getProductTierPricesApi, calculatePriceApi } from "@/services/pricing-service";
import { calculateTaxApi } from "@/services/tax-service";
import { ProductDetail, ProductSummary, ProductVariant } from "@/types/product";
import { ProductStockOverview } from "@/types/inventory";
import { ProductTierPrice, TaxCalculationResult } from "@/types/pricing";
import { ServiceabilityResponseDto } from "@/types/logistics";
import { checkPincodeServiceabilityApi } from "@/services/logistics-service";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { Receipt, Percent, Calculator, Globe, Navigation, Clock, Star } from "lucide-react";
import { ProductReviewsAndQaSection } from "@/components/storefront/ProductReviewsAndQaSection";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { currentCurrency, formatMoney, convertFromInr } = useCurrency();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [stockOverview, setStockOverview] = useState<ProductStockOverview | null>(null);
  const [tierPrices, setTierPrices] = useState<ProductTierPrice[]>([]);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxCalculationResult | null>(null);
  const [shippingState, setShippingState] = useState<string>("MH");
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [related, setRelated] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const handleAddToCart = async (buyNow: boolean = false) => {
    if (!product || (product.stockQuantity ?? 0) <= 0 || product.inStock === false) {
      setCartError("This product is currently out of stock.");
      return;
    }
    const variantId = selectedVariant?.id || product?.variants?.[0]?.id;
    if (!variantId) {
      setCartError("Please select a variant option.");
      return;
    }
    setAddingToCart(true);
    setCartError(null);
    try {
      await addToCart(variantId, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
      if (buyNow) {
        router.push("/cart");
      }
    } catch (err: any) {
      setCartError(err.message || "Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Delivery & Serviceability Estimator
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [checkingPincode, setCheckingPincode] = useState<boolean>(false);
  const [serviceability, setServiceability] = useState<ServiceabilityResponseDto | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  const handleCheckPincode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pincodeInput || pincodeInput.trim().length !== 6) {
      setPincodeError("Please enter a valid 6-digit postal pincode");
      return;
    }
    setCheckingPincode(true);
    setPincodeError(null);
    try {
      const res = await checkPincodeServiceabilityApi({
        deliveryPincode: pincodeInput.trim(),
        pickupPincode: "400001",
      });
      if (res.success && res.data) {
        setServiceability(res.data);
      } else {
        setPincodeError(res.message || "Pincode is not currently serviceable");
        setServiceability(null);
      }
    } catch {
      setPincodeError("Unable to verify delivery serviceability. Please try again.");
      setServiceability(null);
    } finally {
      setCheckingPincode(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getProductBySlugApi(slug);
        if (res.success && res.data) {
          const prod = res.data;
          setProduct(prod);

          if (prod.images && prod.images.length > 0) {
            const primary = prod.images.find((img) => img.primary) || prod.images[0];
            setSelectedImage(primary.imageUrl);
          }

          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }

          // Fetch real-time warehouse inventory breakdown
          try {
            const stockRes = await getProductStockOverviewApi(prod.id);
            if (stockRes.success && stockRes.data) {
              setStockOverview(stockRes.data);
            }
          } catch {
            // gracefully fallback
          }

          // Fetch volume tier prices
          try {
            const tierRes = await getProductTierPricesApi(prod.id);
            if (tierRes.success && tierRes.data) {
              setTierPrices(tierRes.data);
            }
          } catch {
            // gracefully fallback
          }

          // Fetch related
          const relRes = await getRelatedProductsApi(slug, 4);
          if (relRes.success && relRes.data) {
            setRelated(relRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]);

  // Recalculate tax breakdown when quantity, variant, or shipping state changes
  useEffect(() => {
    if (!product) return;
    const baseUnit = selectedVariant ? selectedVariant.price : (product.discountPrice || product.basePrice);
    
    // Check volume tier
    const activeTier = tierPrices.find(
      (t) => (!t.variantId || (selectedVariant && t.variantId === selectedVariant.id)) &&
             quantity >= t.minQuantity &&
             (!t.maxQuantity || quantity <= t.maxQuantity)
    );
    const unitPrice = activeTier ? activeTier.tierPrice : baseUnit;

    calculateTaxApi({
      unitPrice,
      quantity,
      originCountry: "IN",
      originState: "MH", // Primary warehouse origin
      destinationCountry: "IN",
      destinationState: shippingState,
      isTaxInclusive: true,
    })
      .then((res) => {
        if (res.success && res.data) {
          setTaxBreakdown(res.data);
        }
      })
      .catch(() => {});
  }, [product, selectedVariant, quantity, shippingState, tierPrices]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <div className="h-4 bg-brand-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-96 bg-brand-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-brand-slate-200 rounded w-3/4" />
            <div className="h-4 bg-brand-slate-100 rounded w-1/2" />
            <div className="h-10 bg-brand-slate-200 rounded w-1/3" />
            <div className="h-24 bg-brand-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-16 h-16 mx-auto text-brand-slate-300" />
        <h2 className="text-2xl font-bold text-brand-slate-900">Product Not Found</h2>
        <p className="text-sm text-brand-slate-500">
          This product might have been unlisted or moved by the vendor.
        </p>
        <Link href="/products">
          <Button variant="primary">Explore Catalog</Button>
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : (product.discountPrice || product.basePrice);

  // Variant warehouse stock breakdown
  const variantStocks = selectedVariant && stockOverview?.warehouseBreakdown
    ? stockOverview.warehouseBreakdown.filter((w) => w.variantId === selectedVariant.id)
    : [];

  const variantAvailableQty = variantStocks.length > 0
    ? variantStocks.reduce((sum, w) => sum + (w.quantityAvailable || 0), 0)
    : (selectedVariant ? (selectedVariant.stockQuantity ?? 0) : null);

  const productAvailableQty = stockOverview
    ? stockOverview.totalAvailableQuantity
    : (product.stockQuantity ?? 0);

  const effectiveAvailableQty = selectedVariant
    ? (variantAvailableQty !== null ? variantAvailableQty : productAvailableQty)
    : productAvailableQty;

  const inStock = product.status === "ACTIVE" &&
    (product.stockQuantity ?? 0) > 0 &&
    product.inStock !== false &&
    effectiveAvailableQty > 0 &&
    (!selectedVariant || (selectedVariant.stockQuantity ?? 0) > 0 || variantStocks.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-brand-slate-500 flex-wrap">
        <Link href="/" className="hover:text-brand-burgundy transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-brand-burgundy transition-colors">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${product.category.id}`}
              className="hover:text-brand-burgundy transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-slate-900 font-semibold truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="w-full h-96 sm:h-[480px] bg-brand-slate-50 rounded-2xl border border-brand-slate-200 overflow-hidden flex items-center justify-center p-6 relative">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <Package className="w-16 h-16 text-brand-slate-300" />
            )}

            {product.featured && (
              <div className="absolute top-4 left-4">
                <Badge variant="brand" size="md">Featured</Badge>
              </div>
            )}

            {/* Heart Wishlist Button */}
            <div className="absolute top-4 right-4 z-10">
              <WishlistButton
                product={{
                  id: product.id,
                  title: product.title,
                  slug: product.slug,
                  primaryImageUrl: selectedImage || (product.images && product.images[0]?.imageUrl),
                  basePrice: product.basePrice,
                  discountPrice: product.discountPrice,
                  categoryName: product.category?.name,
                  brandName: product.brand?.name,
                  vendorStoreName: product.vendor?.storeName,
                }}
                size="lg"
              />
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-20 h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 p-1 bg-white transition-all ${
                    selectedImage === img.imageUrl
                      ? "border-brand-burgundy shadow-sm"
                      : "border-brand-slate-200 hover:border-brand-slate-400"
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Purchasing */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.brand && (
                <Badge variant="neutral" size="sm">
                  Brand: {product.brand.name}
                </Badge>
              )}
              <span className="text-xs text-brand-slate-400 font-mono">
                SKU: {selectedVariant ? selectedVariant.variantSku : product.sku}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating Stars Header */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{(product as any).averageRating ? Number((product as any).averageRating).toFixed(1) : "5.0"}</span>
              </div>
              <span className="text-xs text-brand-slate-500 font-medium">
                ({(product as any).reviewCount ?? 1} Customer Reviews)
              </span>
            </div>

            {product.shortDescription && (
              <p className="text-sm text-brand-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Active Volume Tier Check */}
          {(() => {
            const baseUnitInr = selectedVariant ? selectedVariant.price : (product.discountPrice || product.basePrice);
            const activeTier = tierPrices.find(
              (t) => (!t.variantId || (selectedVariant && t.variantId === selectedVariant.id)) &&
                     quantity >= t.minQuantity &&
                     (!t.maxQuantity || quantity <= t.maxQuantity)
            );
            const effectiveUnitPriceInr = activeTier ? activeTier.tierPrice : baseUnitInr;
            const originalPriceInr = product.discountPrice ? product.basePrice : null;

            return (
              <div className="space-y-4">
                {/* Price Box */}
                <div className="p-4 bg-brand-slate-50 rounded-2xl border border-brand-slate-200 space-y-2">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-brand-slate-900">
                        {formatMoney(effectiveUnitPriceInr)}
                      </span>
                      {originalPriceInr && !activeTier && (
                        <span className="text-base text-brand-slate-400 line-through">
                          {formatMoney(originalPriceInr)}
                        </span>
                      )}
                      {activeTier && (
                        <Badge variant="success" size="sm">
                          Tier Discount ({activeTier.discountPercent}% OFF)
                        </Badge>
                      )}
                    </div>
                    {currentCurrency.code !== "INR" && (
                      <span className="text-xs text-brand-slate-500 bg-brand-slate-200/60 px-2 py-0.5 rounded">
                        Base: ₹{effectiveUnitPriceInr.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Subtotal & Tax Breakdown Bar */}
                  <div className="flex items-center justify-between text-xs text-brand-slate-600 border-t border-brand-slate-200 pt-2 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>Total ({quantity} {quantity === 1 ? "unit" : "units"}):</span>
                      <span className="font-bold text-brand-slate-900">
                        {formatMoney(effectiveUnitPriceInr * quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTaxModal(true)}
                      className="text-brand-emerald-700 hover:text-brand-emerald-800 font-semibold flex items-center gap-1 underline underline-offset-2"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>
                        Tax Info: {taxBreakdown ? `${taxBreakdown.totalTaxRatePercent}% GST (${formatMoney(taxBreakdown.totalTaxAmount)})` : "18% GST incl."}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Volume Tier Pricing Breaks */}
                {tierPrices.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-brand-emerald-600" />
                        B2B Volume Wholesale Pricing
                      </label>
                      <span className="text-[11px] text-brand-slate-500">Click a tier to auto-select quantity</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {tierPrices.map((tier) => {
                        const isCurrentActive =
                          quantity >= tier.minQuantity &&
                          (!tier.maxQuantity || quantity <= tier.maxQuantity);
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setQuantity(tier.minQuantity)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isCurrentActive
                                ? "bg-brand-emerald-50 border-brand-emerald-600 ring-2 ring-brand-emerald-600/20"
                                : "bg-white border-brand-slate-200 hover:border-brand-slate-300"
                            }`}
                          >
                            <div className="text-[11px] font-medium text-brand-slate-500">
                              {tier.maxQuantity
                                ? `${tier.minQuantity} - ${tier.maxQuantity} pcs`
                                : `${tier.minQuantity}+ pcs`}
                            </div>
                            <div className="text-sm font-bold text-brand-slate-900">
                              {formatMoney(tier.tierPrice)}
                            </div>
                            {tier.discountPercent && tier.discountPercent > 0 ? (
                              <div className="text-[10px] font-bold text-emerald-600">
                                Save {tier.discountPercent}%
                              </div>
                            ) : (
                              <div className="text-[10px] text-brand-slate-400">Standard</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-slate-900 uppercase tracking-wider">
                Select Edition / Variant
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id || v.variantSku}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedVariant?.variantSku === v.variantSku
                        ? "bg-brand-burgundy text-white border-brand-burgundy shadow-sm"
                        : "bg-white text-brand-slate-700 border-brand-slate-200 hover:border-brand-slate-400"
                    }`}
                  >
                    {v.variantName} (₹{v.price.toFixed(2)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-brand-slate-200 rounded-xl bg-white overflow-hidden">
                <button
                  disabled={!inStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-brand-slate-600 hover:bg-brand-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold text-brand-slate-900">
                  {inStock ? quantity : 0}
                </span>
                <button
                  disabled={!inStock || quantity >= effectiveAvailableQty}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-brand-slate-600 hover:bg-brand-slate-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>

              <div className="flex flex-col">
                {inStock ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock - Ready for Fast Dispatch
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    Out of Stock - Currently Unavailable
                  </span>
                )}
                {inStock && stockOverview && stockOverview.warehouseBreakdown.length > 0 && (
                  <span className="text-[10px] text-brand-slate-500 mt-0.5">
                    Fulfillment from {stockOverview.warehouseBreakdown.map((w) => w.warehouseCode).join(" & ")}
                  </span>
                )}
              </div>
            </div>

            {stockOverview && stockOverview.lowStock && inStock && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  High demand: Only <strong>{stockOverview.totalAvailableQuantity} units</strong> left across regional hubs!
                </span>
              </div>
            )}

            {cartError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{cartError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!inStock || addingToCart}
                loading={addingToCart}
                onClick={() => handleAddToCart(false)}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                <span>{addingToCart ? "Adding..." : inStock ? "Add to Cart" : "Out of Stock"}</span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                disabled={!inStock || addingToCart}
                onClick={() => handleAddToCart(true)}
              >
                <Zap className="w-5 h-5 mr-2" />
                <span>{inStock ? "Buy Now" : "Out of Stock"}</span>
              </Button>
            </div>

            {addedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Added to cart successfully!</span>
                </div>
                <Link
                  href="/cart"
                  className="font-bold underline text-emerald-900 hover:text-emerald-950 ml-2"
                >
                  View Cart →
                </Link>
              </div>
            )}
          </div>

          {/* Delivery & Pincode Estimator Widget */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Truck className="w-4 h-4 text-brand-burgundy" />
                Delivery & Pincode Estimator
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Pan-India Courier Network</span>
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <div className="relative flex-1">
                <Navigation className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit Pincode (e.g. 110001, 560001)"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy transition"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={checkingPincode || pincodeInput.length !== 6}
                className="text-xs px-4"
              >
                {checkingPincode ? "Checking..." : "Verify"}
              </Button>
            </form>

            {/* Verification Result Feedback */}
            {pincodeError && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {pincodeError}
              </p>
            )}

            {serviceability && (
              <div className="space-y-2 pt-2 border-t border-slate-200/60 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Delivery available to {serviceability.city}, {serviceability.state}
                  </span>
                  <Badge variant="success">Serviceable ({serviceability.zoneTier})</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-brand-burgundy" />
                    <span>Est. Delivery: <strong>{serviceability.estimatedTransitDays} Days</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>COD: <strong>{serviceability.isCodServiceable ? "Available" : "Prepaid Only"}</strong></span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>Courier Partner:</span>
                  <strong className="text-slate-700">{serviceability.primaryCourierPartner || "Delhivery / Blue Dart Express"}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-brand-slate-100 text-[11px] text-brand-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-burgundy" />
              <span>Authentic Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-burgundy" />
              <span>Express Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-brand-burgundy" />
              <span>7-Day Return Policy</span>
            </div>
          </div>

          {/* Vendor Badge */}
          {product.vendor && (
            <Card className="p-4 bg-brand-slate-50/60 border-brand-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-slate-900">
                    Sold by {product.vendor.storeName}
                  </h4>
                  <p className="text-[10px] text-brand-slate-500">
                    Verified Marketplace Partner
                  </p>
                </div>
              </div>
              <Link href={`/vendors/${product.vendor.slug}`}>
                <Button variant="outline" size="sm">Visit Store</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Specifications & Description */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-brand-slate-200">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-brand-slate-900">Product Description</h3>
            <div className="text-sm text-brand-slate-700 leading-relaxed whitespace-pre-line bg-white p-6 rounded-2xl border border-brand-slate-200">
              {product.description || product.shortDescription || "No detailed description provided."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-brand-slate-900">Technical Specifications</h3>
            <Card className="overflow-hidden">
              <table className="w-full text-xs text-left divide-y divide-brand-slate-100">
                <tbody className="divide-y divide-brand-slate-100">
                  {product.attributes && product.attributes.length > 0 ? (
                    product.attributes.map((attr, idx) => (
                      <tr key={idx} className="hover:bg-brand-slate-50/50">
                        <td className="px-4 py-2.5 font-semibold text-brand-slate-500 w-1/3 bg-brand-slate-50/40">
                          {attr.attributeName}
                        </td>
                        <td className="px-4 py-2.5 text-brand-slate-800 font-medium">
                          {attr.attributeValue}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-brand-slate-400">
                        Standard marketplace specifications apply.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Community Q&A Section */}
      <ProductReviewsAndQaSection
        productId={product.id}
        productTitle={product.title}
        vendorStoreName={product.vendor?.storeName}
      />

      {/* Related Products Carousel */}
      {related.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-brand-slate-200">
          <h3 className="text-lg font-bold text-brand-slate-900">Related Products in this Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((rel) => (
              <Link key={rel.id} href={`/products/${rel.slug}`} className="group block">
                <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-brand-slate-200 group-hover:border-brand-burgundy/40 relative">
                  <div className="w-full h-40 bg-brand-slate-50 flex items-center justify-center p-3 relative">
                    {rel.primaryImageUrl ? (
                      <img
                        src={rel.primaryImageUrl}
                        alt={rel.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-brand-slate-400" />
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <WishlistButton product={rel} size="sm" />
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-brand-slate-900 truncate group-hover:text-brand-burgundy">
                      {rel.title}
                    </h4>
                    <p className="text-xs font-extrabold text-brand-slate-900">
                      {formatMoney(rel.discountPrice || rel.basePrice)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Tax Breakdown Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-brand-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-emerald-700" />
                <h3 className="text-base font-bold text-brand-slate-900">
                  GST & Tax Compliance Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTaxModal(false)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Destination State Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-slate-700">
                Destination State (Delivery Destination)
              </label>
              <select
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="w-full text-xs font-medium border border-brand-slate-200 rounded-xl p-2.5 bg-brand-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-emerald-600 focus:outline-hidden transition-all"
              >
                <option value="MH">Maharashtra (Intra-State: CGST + SGST)</option>
                <option value="DL">Delhi NCR (Inter-State: IGST)</option>
                <option value="KA">Karnataka (Inter-State: IGST)</option>
                <option value="HR">Haryana (Inter-State: IGST)</option>
                <option value="TN">Tamil Nadu (Inter-State: IGST)</option>
                <option value="UP">Uttar Pradesh (Inter-State: IGST)</option>
              </select>
            </div>

            {/* Calculation Table */}
            {taxBreakdown ? (
              <div className="space-y-3 bg-brand-slate-50 p-4 rounded-xl border border-brand-slate-200 text-xs">
                <div className="flex justify-between text-brand-slate-600">
                  <span>Fulfillment Origin:</span>
                  <span className="font-semibold text-brand-slate-900">Maharashtra (Central Hub)</span>
                </div>
                <div className="flex justify-between text-brand-slate-600">
                  <span>Tax Regime & Rule:</span>
                  <span className="font-semibold text-brand-emerald-700">{taxBreakdown.ruleName}</span>
                </div>
                <div className="flex justify-between text-brand-slate-600">
                  <span>Taxable Subtotal (Base):</span>
                  <span className="font-semibold text-brand-slate-900">
                    {formatMoney(taxBreakdown.taxableSubtotal)}
                  </span>
                </div>

                <div className="border-t border-brand-slate-200 pt-2 space-y-1.5">
                  <div className="font-semibold text-brand-slate-800">Tax Components:</div>
                  {taxBreakdown.components.map((comp, idx) => (
                    <div key={idx} className="flex justify-between pl-2 text-brand-slate-600">
                      <span>• {comp.componentType} ({comp.ratePercent}%):</span>
                      <span className="font-medium text-brand-slate-900">
                        {formatMoney(comp.taxAmount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-brand-slate-200 pt-2 flex justify-between font-bold text-brand-slate-900 text-sm">
                  <span>Total Gross (Inclusive):</span>
                  <span className="text-brand-emerald-800">
                    {formatMoney(taxBreakdown.grandTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-brand-slate-400">
                Calculating tax rates...
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowTaxModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
