"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  ExternalLink,
  Store,
  Layers,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  adminListProductsApi,
  adminUpdateProductStatusApi,
  getProductBySlugApi,
} from "@/services/product-service";
import { ProductResponse, ProductDetail, ProductStatus } from "@/types/product";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_APPROVAL");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect / Action Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [detailedProduct, setDetailedProduct] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionModal, setActionModal] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminListProductsApi(
        token,
        statusFilter ? (statusFilter as ProductStatus) : undefined,
        undefined,
        undefined,
        undefined,
        0,
        50
      );
      if (res.success && res.data) {
        setProducts(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const inspectProduct = async (summary: ProductResponse) => {
    setSelectedProduct(summary);
    setLoadingDetail(true);
    try {
      const res = await getProductBySlugApi(summary.slug);
      if (res.success && res.data) {
        setDetailedProduct(res.data);
      } else {
        setDetailedProduct(null);
      }
    } catch (err) {
      console.error("Failed to load product details", err);
      setDetailedProduct(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (status: ProductStatus, reason?: string) => {
    if (!selectedProduct) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminUpdateProductStatusApi(
        selectedProduct.id,
        status,
        reason,
        token
      );
      if (res.success) {
        setActionModal(null);
        setSelectedProduct(null);
        setDetailedProduct(null);
        setRejectionReason("");
        fetchProducts();
      } else {
        setActionError(res.message || "Failed to update product status");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setActionError(e.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorStoreName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="warning">Pending Review</Badge>;
      case "REJECTED":
        return <Badge variant="error">Rejected</Badge>;
      case "DRAFT":
        return <Badge variant="neutral">Draft</Badge>;
      case "INACTIVE":
        return <Badge variant="neutral">Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Product Moderation & Catalog</h1>
          <p className="text-xs text-brand-slate-500">
            Audit seller-submitted catalog items, inspect technical specs & images, and verify listings for publication.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProducts}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { label: "Pending Approval", value: "PENDING_APPROVAL" },
              { label: "All Items", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Drafts", value: "DRAFT" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === tab.value
                    ? "bg-brand-burgundy text-white shadow-sm"
                    : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
            <input
              type="text"
              placeholder="Search title, category, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Vendor / Store</th>
                <th className="px-4 py-3">Category / Brand</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading moderation queue...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-brand-slate-400">
                    <Package className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                    <p className="font-semibold text-brand-slate-700">No products in this queue</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      All catalog submissions matching this criteria have been resolved.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImg = p.images?.find((img) => img.primary)?.imageUrl || p.images?.[0]?.imageUrl;
                  return (
                    <tr key={p.id} className="hover:bg-brand-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-brand-slate-100 border border-brand-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
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
                            <div className="text-[11px] text-brand-slate-400 font-mono">/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-brand-slate-900 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-brand-burgundy" />
                          {p.vendorStoreName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-brand-slate-800">{p.categoryName}</div>
                        <div className="text-[11px] text-brand-slate-400">{p.brandName || "Generic"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-slate-900">
                        ₹{p.discountPrice ? p.discountPrice.toFixed(2) : p.basePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-4 py-3 text-brand-slate-500 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => inspectProduct(p)}
                            title="Inspect Product Details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                          </Button>

                          {p.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setActionModal("approve");
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve & Publish"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setActionModal("reject");
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Reject Submission"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* MODAL: INSPECT PRODUCT DETAILS */}
      <Modal
        isOpen={!!selectedProduct && !actionModal}
        onClose={() => {
          setSelectedProduct(null);
          setDetailedProduct(null);
        }}
        title={selectedProduct?.title || "Product Inspection"}
      >
        {selectedProduct && (
          <div className="space-y-6 text-xs text-brand-slate-700 max-h-[75vh] overflow-y-auto pr-1">
            {/* Gallery Images */}
            <div>
              <h4 className="font-bold text-brand-slate-900 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-brand-burgundy" /> Media Assets
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {detailedProduct?.images && detailedProduct.images.length > 0 ? (
                  detailedProduct.images.map((img, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 rounded-lg border border-brand-slate-200 overflow-hidden shrink-0 bg-white relative"
                    >
                      <img src={img.imageUrl} alt={img.altText || ""} className="w-full h-full object-cover" />
                      {img.primary && (
                        <span className="absolute bottom-0 inset-x-0 bg-brand-burgundy text-[9px] text-white text-center font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                  ))
                ) : selectedProduct.images?.[0]?.imageUrl ? (
                  <div className="w-20 h-20 rounded-lg border border-brand-slate-200 overflow-hidden shrink-0 bg-white">
                    <img src={selectedProduct.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <p className="text-brand-slate-400 italic">No images provided</p>
                )}
              </div>
            </div>

            {/* General Specs */}
            <div className="grid grid-cols-2 gap-3 bg-brand-slate-50 p-3 rounded-xl border border-brand-slate-200">
              <div>
                <span className="text-brand-slate-400">Vendor Store:</span>{" "}
                <span className="font-semibold text-brand-slate-900">{selectedProduct.vendorStoreName}</span>
              </div>
              <div>
                <span className="text-brand-slate-400">Category:</span>{" "}
                <span className="font-semibold text-brand-slate-900">{selectedProduct.categoryName}</span>
              </div>
              <div>
                <span className="text-brand-slate-400">Brand:</span>{" "}
                <span className="font-semibold text-brand-slate-900">{selectedProduct.brandName || "Generic"}</span>
              </div>
              <div>
                <span className="text-brand-slate-400">Base MRP / Price:</span>{" "}
                <span className="font-semibold text-brand-slate-900">₹{selectedProduct.basePrice}</span>
              </div>
              {detailedProduct?.shortDescription && (
                <div className="col-span-2">
                  <span className="text-brand-slate-400">Summary:</span> {detailedProduct.shortDescription}
                </div>
              )}
            </div>

            {/* Technical Specifications */}
            {detailedProduct?.attributes && detailedProduct.attributes.length > 0 && (
              <div>
                <h4 className="font-bold text-brand-slate-900 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-brand-burgundy" /> Technical Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-brand-slate-50 p-3 rounded-xl border border-brand-slate-200">
                  {detailedProduct.attributes.map((attr, i) => (
                    <div key={i}>
                      <span className="text-brand-slate-400">{attr.attributeName}:</span>{" "}
                      <span className="font-medium text-brand-slate-800">{attr.attributeValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKU Variants */}
            {detailedProduct?.variants && detailedProduct.variants.length > 0 && (
              <div>
                <h4 className="font-bold text-brand-slate-900 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-burgundy" /> SKU Variants ({detailedProduct.variants.length})
                </h4>
                <div className="space-y-1.5">
                  {detailedProduct.variants.map((v, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-brand-slate-50 rounded-lg border border-brand-slate-200 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-brand-slate-900">{v.variantName}</div>
                        <div className="text-[10px] font-mono text-brand-slate-400">SKU: {v.variantSku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-slate-900">₹{v.price.toFixed(2)}</div>
                        <div className="text-[10px] text-brand-slate-500">{v.stockQuantity} units available</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Buttons in View Modal */}
            {selectedProduct.status === "PENDING_APPROVAL" && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setActionModal("reject")}>
                  <XCircle className="w-4 h-4 mr-1 text-rose-600" /> Reject
                </Button>
                <Button variant="primary" onClick={() => setActionModal("approve")}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve & Publish
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: APPROVE PRODUCT */}
      <Modal
        isOpen={actionModal === "approve"}
        onClose={() => setActionModal(null)}
        title="Approve Product Listing"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Are you sure you want to approve <span className="font-bold text-brand-slate-900">{selectedProduct?.title}</span>?
          </p>
          <p className="text-xs text-brand-slate-500">
            This action will mark the product as <strong>ACTIVE</strong> and immediately publish it to the customer-facing marketplace catalog and search index.
          </p>
          {actionError && <p className="text-xs text-rose-600 font-medium">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={() => handleUpdateStatus("ACTIVE")}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: REJECT PRODUCT */}
      <Modal
        isOpen={actionModal === "reject"}
        onClose={() => setActionModal(null)}
        title="Reject Product Listing"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Please provide a specific reason for rejecting <span className="font-bold text-brand-slate-900">{selectedProduct?.title}</span>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete technical dimensions or blurry primary image resolution..."
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>
          {actionError && <p className="text-xs text-rose-600 font-medium">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={submitting}
              onClick={() => handleUpdateStatus("REJECTED", rejectionReason)}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
