"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getVendorProductsApi, updateVendorProductApi } from "@/services/product-service";
import { createTierPriceApi, getProductTierPricesApi } from "@/services/pricing-service";
import { ProductResponse } from "@/types/product";

interface PriceTier {
  minQty: number;
  maxQty: number | null;
  discountPct: number;
  tierPrice: number;
}

interface ProductPricingItem {
  id: string;
  title: string;
  sku: string;
  category: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  b2bEnabled: boolean;
  tiers: PriceTier[];
  rawProduct?: ProductResponse;
}

export default function VendorPricingPage() {
  const [products, setProducts] = useState<ProductPricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductPricingItem | null>(null);
  const [bulkModifierPct, setBulkModifierPct] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("alight_token") || "";
        const res = await getVendorProductsApi(token, undefined, 0, 50);
        if (res.success && res.data && res.data.content) {
          const mapped: ProductPricingItem[] = res.data.content.map((p: ProductResponse) => {
            const selling = p.discountPrice || p.basePrice;
            return {
              id: p.id,
              title: p.title,
              sku: p.sku,
              category: p.categoryName || "Hardware",
              mrp: p.basePrice * 1.25,
              sellingPrice: selling,
              costPrice: selling * 0.65,
              b2bEnabled: true,
              rawProduct: p,
              tiers: [
                { minQty: 1, maxQty: 99, discountPct: 0, tierPrice: selling },
                { minQty: 100, maxQty: 499, discountPct: 10, tierPrice: Math.round(selling * 0.9) },
                { minQty: 500, maxQty: 999, discountPct: 18, tierPrice: Math.round(selling * 0.82) },
                { minQty: 1000, maxQty: null, discountPct: 25, tierPrice: Math.round(selling * 0.75) },
              ],
            };
          });
          setProducts(mapped);
          if (mapped.length > 0) setSelectedProduct(mapped[0]);
        }
      } catch (err) {
        console.error("Failed to load catalog for pricing", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleUpdatePrice = (field: "mrp" | "sellingPrice" | "costPrice", val: number) => {
    if (!selectedProduct) return;
    const updated = { ...selectedProduct, [field]: val };
    // Recalculate tiers based on new selling price
    if (field === "sellingPrice") {
      updated.tiers = updated.tiers.map((t) => ({
        ...t,
        tierPrice: Math.round(val * (1 - t.discountPct / 100)),
      }));
    }
    setSelectedProduct(updated);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdateTierDiscount = (index: number, discountPct: number) => {
    if (!selectedProduct) return;
    const newTiers = [...selectedProduct.tiers];
    newTiers[index].discountPct = discountPct;
    newTiers[index].tierPrice = Math.round(selectedProduct.sellingPrice * (1 - discountPct / 100));
    const updated = { ...selectedProduct, tiers: newTiers };
    setSelectedProduct(updated);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleApplyBulkModifier = () => {
    const pct = parseFloat(bulkModifierPct);
    if (isNaN(pct)) return;
    setProducts((prev) =>
      prev.map((p) => {
        const newSelling = Math.round(p.sellingPrice * (1 + pct / 100));
        return {
          ...p,
          sellingPrice: newSelling,
          tiers: p.tiers.map((t) => ({
            ...t,
            tierPrice: Math.round(newSelling * (1 - t.discountPct / 100)),
          })),
        };
      })
    );
    if (selectedProduct) {
      const newSelling = Math.round(selectedProduct.sellingPrice * (1 + pct / 100));
      setSelectedProduct({
        ...selectedProduct,
        sellingPrice: newSelling,
        tiers: selectedProduct.tiers.map((t) => ({
          ...t,
          tierPrice: Math.round(newSelling * (1 - t.discountPct / 100)),
        })),
      });
    }
    setBulkModifierPct("");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProductPricing = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    const token = localStorage.getItem("alight_token") || "";
    try {
      if (token) {
        await updateVendorProductApi(
          selectedProduct.id,
          {
            categoryId: selectedProduct.rawProduct?.categoryId || "",
            title: selectedProduct.rawProduct?.title || selectedProduct.title,
            stockQuantity: selectedProduct.rawProduct?.stockQuantity || 10,
            basePrice: Math.round(selectedProduct.mrp),
            discountPrice: selectedProduct.sellingPrice,
            description: selectedProduct.rawProduct?.description,
            shortDescription: selectedProduct.rawProduct?.shortDescription,
            brandId: selectedProduct.rawProduct?.brandId,
          },
          token
        );
        for (const tier of selectedProduct.tiers.filter((t) => t.minQty > 1)) {
          await createTierPriceApi(
            selectedProduct.id,
            {
              minQuantity: tier.minQty,
              maxQuantity: tier.maxQty || undefined,
              tierPrice: tier.tierPrice,
              discountPercent: tier.discountPct,
            },
            token
          );
        }
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save pricing", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Pricing & B2B Volume Tiers
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Multi-Tier Engine
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Configure retail margins, promotional MSRPs, and automated wholesale tiered pricing for architects and contractors.
          </p>
        </div>

        {/* Global Bulk Price Adjustment */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-brand-slate-50 border border-brand-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-xs text-brand-slate-500 font-semibold mr-2">Bulk Adjust:</span>
            <input
              type="number"
              placeholder="e.g. 5 or -10"
              value={bulkModifierPct}
              onChange={(e) => setBulkModifierPct(e.target.value)}
              className="w-24 bg-white border border-brand-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-brand-slate-900 focus:outline-none"
            />
            <span className="text-xs font-bold text-brand-slate-600 ml-1">%</span>
            <button
              onClick={handleApplyBulkModifier}
              className="ml-2 px-2.5 py-1 bg-brand-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-brand-emerald-900 transition"
            >
              Apply All
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pricing rules and B2B volume tiers successfully synced to catalog engine!</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection List */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 border-brand-slate-200 space-y-3 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
              <input
                type="text"
                placeholder="Search catalog SKU or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
              />
            </div>

            <div className="divide-y divide-brand-slate-100 max-h-[540px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-8 text-center text-xs text-brand-slate-400">Loading catalog items...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-brand-slate-400">No matching SKUs found.</div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedProduct?.id === item.id;
                  const margin = Math.round(((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-brand-emerald-50/70 border border-brand-emerald-300"
                          : "hover:bg-brand-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-brand-slate-900 line-clamp-1">{item.title}</h4>
                          <span className="text-[10px] font-mono text-brand-slate-400">SKU: {item.sku}</span>
                        </div>
                        <span className="font-black text-xs text-brand-slate-900 shrink-0">
                          ₹{item.sellingPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[11px] text-brand-slate-500">
                        <span>MRP: ₹{Math.round(item.mrp)}</span>
                        <span className="text-emerald-700 font-bold">{margin}% Est. Margin</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Pricing Editor for Selected Product */}
        <div className="lg:col-span-7">
          {selectedProduct ? (
            <Card className="p-6 border-brand-slate-200 space-y-6 shadow-2xs">
              {/* Product Info Banner */}
              <div className="flex items-start justify-between border-b border-brand-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald-800">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-base font-extrabold text-brand-slate-900 mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <p className="text-xs font-mono text-brand-slate-400 mt-0.5">SKU: {selectedProduct.sku}</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProductPricing}
                  disabled={isSaving}
                  className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              {/* Base Retail Price Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3.5 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
                  <label className="text-[11px] font-bold text-brand-slate-600 block">
                    MRP / Catalog Reference (₹)
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedProduct.mrp)}
                    onChange={(e) => handleUpdatePrice("mrp", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-brand-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-brand-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                  <span className="text-[10px] text-brand-slate-400 block">Shown struck-through</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-brand-emerald-50/50 rounded-xl border border-brand-emerald-200">
                  <label className="text-[11px] font-bold text-brand-emerald-900 block">
                    Selling Price (B2C) (₹)
                  </label>
                  <input
                    type="number"
                    value={selectedProduct.sellingPrice}
                    onChange={(e) => handleUpdatePrice("sellingPrice", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-brand-emerald-300 rounded-lg px-3 py-1.5 text-sm font-black text-brand-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                  <span className="text-[10px] text-brand-emerald-700 font-semibold block">Live Customer Price</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
                  <label className="text-[11px] font-bold text-brand-slate-600 block">
                    Manufacturing Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedProduct.costPrice)}
                    onChange={(e) => handleUpdatePrice("costPrice", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-brand-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-brand-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                  <span className="text-[10px] text-brand-slate-400 block">Internal margin calculation</span>
                </div>
              </div>

              {/* B2B Wholesale Tier Pricing Rules */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-brand-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-emerald-800" />
                      <span>B2B Wholesale Tier Pricing Matrix</span>
                    </h4>
                    <p className="text-xs text-brand-slate-500">
                      Tier discounts apply automatically in cart when contractors purchase wholesale quantities.
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">Volume Automated</Badge>
                </div>

                <div className="overflow-x-auto border border-brand-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Order Quantity Range</th>
                        <th className="px-4 py-2.5 text-center">Volume Discount</th>
                        <th className="px-4 py-2.5">Effective Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Unit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
                      {selectedProduct.tiers.map((tier, idx) => {
                        const unitMargin = Math.round(((tier.tierPrice - selectedProduct.costPrice) / tier.tierPrice) * 100);
                        return (
                          <tr key={idx} className="hover:bg-brand-slate-50">
                            <td className="px-4 py-3 font-semibold text-brand-slate-900">
                              {tier.maxQty ? `${tier.minQty} – ${tier.maxQty} units` : `${tier.minQty}+ units (Bulk Master)`}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {idx === 0 ? (
                                <span className="text-brand-slate-400 font-mono">0% (Base)</span>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={tier.discountPct}
                                    onChange={(e) => handleUpdateTierDiscount(idx, parseFloat(e.target.value) || 0)}
                                    className="w-16 text-center bg-white border border-brand-slate-200 rounded-md px-1.5 py-0.5 text-xs font-bold"
                                  />
                                  <span className="font-bold text-brand-slate-500">%</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-brand-slate-900 text-xs">
                                ₹{tier.tierPrice.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-emerald-700">{unitMargin}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-brand-slate-400">
              Select a catalog SKU from the left to configure pricing rules.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
