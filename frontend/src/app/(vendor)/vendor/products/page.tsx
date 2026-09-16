"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  DollarSign,
  Boxes,
  Sparkles,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getVendorProductsApi, deleteVendorProductApi } from "@/services/product-service";
import { ProductResponse, ProductStatus } from "@/types/product";

export default function VendorProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteProduct, setDeleteProduct] = useState<ProductResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await getVendorProductsApi(
        token,
        statusFilter ? (statusFilter as ProductStatus) : undefined,
        0,
        100
      );
      if (res.success && res.data) {
        setProducts(res.data.content || []);
      }
    } catch (err: unknown) {
      console.error("Failed to load vendor products", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await deleteVendorProductApi(deleteProduct.id, token);
      if (res.success) {
        setDeleteProduct(null);
        fetchProducts();
      }
    } catch (err: unknown) {
      console.error("Failed to delete product", err);
    } finally {
      setDeleting(false);
    }
  };

  const calculateQualityScore = (p: ProductResponse) => {
    let score = 40; // Base score for having title & sku
    if (p.images && p.images.length >= 2) score += 20;
    else if (p.images && p.images.length === 1) score += 10;
    if (p.description && p.description.length > 50) score += 20;
    if ((p as unknown as { hsnCode?: string }).hsnCode || (p.attributes && p.attributes.length > 0)) score += 10;
    if (p.brandName) score += 10;
    return Math.min(score, 100);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!searchQuery) return true;
      return (
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brandName && p.brandName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [products, searchQuery]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "SKU", "Category", "Brand", "Base Price", "Discount Price", "Stock", "Status"];
    const rows = filteredProducts.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.categoryName}"`,
      `"${p.brandName || "Generic"}"`,
      p.basePrice,
      p.discountPrice || "",
      p.stockQuantity,
      p.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `alight_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="warning" size="sm">Pending Approval</Badge>;
      case "REJECTED":
        return <Badge variant="error" size="sm">Rejected</Badge>;
      case "DRAFT":
        return <Badge variant="neutral" size="sm">Draft</Badge>;
      case "INACTIVE":
        return <Badge variant="neutral" size="sm">Inactive</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Product Catalog & Listing Quality
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-brand-slate-100 text-brand-slate-600 border border-brand-slate-200">
              {products.length} SKUs Listed
            </span>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Manage your hardware inventory, audit listing quality scores, configure wholesale tier pricing, and publish variants.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs gap-1.5 font-bold">
            <Download className="w-3.5 h-3.5" /> Export Catalog CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchProducts} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Link href="/vendor/products/new">
            <Button variant="primary" size="sm" className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. FILTER TABS, BULK BAR & SEARCH */}
      <Card className="p-4 space-y-4 border-brand-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { label: "All SKUs", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Pending Review", value: "PENDING_APPROVAL" },
              { label: "Drafts", value: "DRAFT" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Inactive", value: "INACTIVE" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === tab.value
                    ? "bg-brand-emerald-800 text-white shadow-2xs"
                    : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
            <input
              type="text"
              placeholder="Search by title, SKU, HSN or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Bulk Action Strip if items are selected */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-brand-emerald-50 border border-brand-emerald-200 rounded-xl flex items-center justify-between text-xs text-brand-emerald-950 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold">
              <CheckSquare className="w-4 h-4 text-brand-emerald-800" />
              <span>{selectedIds.length} products selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/vendor/pricing">
                <Button variant="outline" size="sm" className="bg-white text-xs py-1 h-7">
                  <DollarSign className="w-3 h-3 mr-1" /> Bulk Price Update
                </Button>
              </Link>
              <Link href="/vendor/inventory">
                <Button variant="outline" size="sm" className="bg-white text-xs py-1 h-7">
                  <Boxes className="w-3 h-3 mr-1" /> Bulk Inventory Adjust
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* 3. PRODUCT CATALOG TABLE */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={handleSelectAll} className="text-brand-slate-500 hover:text-brand-slate-900">
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-emerald-800" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Product / SKU</th>
                <th className="px-4 py-3">Category & Brand</th>
                <th className="px-4 py-3">Pricing (MSRP / Selling)</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-center">Quality Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-brand-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-slate-400 mb-2" />
                    <span>Loading your catalog items...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-brand-slate-400">
                    <Package className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                    <p className="font-semibold text-brand-slate-700">No products found</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      {statusFilter
                        ? "Try switching the filter tab or clearing your search term."
                        : "You have not listed any products yet. Click 'Add New Product' to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImg = p.images?.find((img) => img.primary)?.imageUrl || p.images?.[0]?.imageUrl;
                  const isSelected = selectedIds.includes(p.id);
                  const qualityScore = calculateQualityScore(p);

                  return (
                    <tr key={p.id} className={`hover:bg-brand-slate-50 transition-colors ${isSelected ? "bg-brand-emerald-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelectOne(p.id)} className="text-brand-slate-500 hover:text-brand-slate-900">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-emerald-800" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-brand-slate-100 border border-brand-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryImg ? (
                              <img
                                src={primaryImg}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-brand-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-brand-slate-900 line-clamp-1">{p.title}</div>
                            <div className="text-[11px] text-brand-slate-400 font-mono mt-0.5">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brand-slate-800">{p.categoryName}</div>
                        <div className="text-[11px] text-brand-slate-500">{p.brandName || "Alight Atelier"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-brand-slate-900">
                          ₹{p.discountPrice ? p.discountPrice.toFixed(2) : p.basePrice.toFixed(2)}
                        </div>
                        {p.discountPrice && (
                          <div className="text-[10px] text-brand-slate-400 line-through">
                            MSRP ₹{p.basePrice.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono font-bold text-xs ${p.stockQuantity > 5 ? "text-emerald-700" : p.stockQuantity > 0 ? "text-amber-700" : "text-rose-700"}`}>
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-14 bg-brand-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                qualityScore >= 80
                                  ? "bg-emerald-500"
                                  : qualityScore >= 60
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${qualityScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-brand-slate-700">
                            {qualityScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(p.status)}
                        {p.rejectionReason && (
                          <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={p.rejectionReason}>
                            {p.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/products/${p.slug}`} target="_blank">
                            <button
                              className="p-1.5 text-brand-slate-500 hover:bg-brand-slate-100 rounded-lg transition-colors"
                              title="Preview on Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteProduct(p)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete SKU"
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
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product SKU"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Are you sure you want to delete <span className="font-bold text-brand-slate-900">{deleteProduct?.title}</span>?
          </p>
          <p className="text-xs text-brand-slate-500">
            This will permanently remove the product catalog entry, its SKU variants, and specification attributes.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
