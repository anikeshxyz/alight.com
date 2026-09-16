"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Globe,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import {
  getActiveBrandsApi,
  adminCreateBrandApi,
  adminUpdateBrandApi,
  adminDeleteBrandApi,
} from "@/services/product-service";
import { Brand, CreateBrandPayload, UpdateBrandPayload } from "@/types/product";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await getActiveBrandsApi();
      if (res.success && res.data) {
        setBrands(res.data);
      }
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName("");
    setLogoUrl("");
    setWebsiteUrl("");
    setDescription("");
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setLogoUrl(b.logoUrl || "");
    setWebsiteUrl(b.websiteUrl || "");
    setDescription(b.description || "");
    setIsActive(b.active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Brand name is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("alight_token") || "";
      if (editingBrand) {
        const payload: UpdateBrandPayload = {
          name: name.trim(),
          logoUrl: logoUrl.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          description: description.trim() || undefined,
          active: isActive,
        };
        const res = await adminUpdateBrandApi(editingBrand.id, payload, token);
        if (res.success) {
          setModalOpen(false);
          loadBrands();
        } else {
          setFormError(res.message || "Failed to update brand");
        }
      } else {
        const payload: CreateBrandPayload = {
          name: name.trim(),
          logoUrl: logoUrl.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          description: description.trim() || undefined,
          active: true,
        };
        const res = await adminCreateBrandApi(payload, token);
        if (res.success) {
          setModalOpen(false);
          loadBrands();
        } else {
          setFormError(res.message || "Failed to create brand");
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteBrand) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminDeleteBrandApi(deleteBrand.id, token);
      if (res.success) {
        setDeleteBrand(null);
        loadBrands();
      }
    } catch (err) {
      console.error("Failed to delete brand", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Brand Registry</h1>
          <p className="text-xs text-brand-slate-500">
            Register, edit, and organize verified manufacturers, designer labels, and product brands.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBrands}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Brand
          </Button>
        </div>
      </div>

      {/* Brands Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading brand registry...
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                    <Tag className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                    <p className="font-semibold text-brand-slate-700">No brands registered</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      Click &apos;Add Brand&apos; to create your first manufacturer profile.
                    </p>
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-slate-100 border border-brand-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {b.logoUrl ? (
                            <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Tag className="w-4 h-4 text-brand-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-brand-slate-900">{b.name}</div>
                          <div className="text-[11px] font-mono text-brand-slate-400">/{b.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-slate-500">
                      {b.websiteUrl ? (
                        <a
                          href={b.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-brand-burgundy hover:underline"
                        >
                          <Globe className="w-3 h-3" /> {b.websiteUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="italic text-brand-slate-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-slate-500 max-w-xs truncate">
                      {b.description || <span className="italic text-brand-slate-300">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      {b.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Disabled</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-brand-slate-600 hover:bg-brand-slate-100 rounded-lg transition-colors"
                          title="Edit Brand"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteBrand(b)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create / Edit Brand */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBrand ? "Edit Brand" : "Add New Brand"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Brand Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Philips Hue or Kohler"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>

          <div>
            <ImageUploadDropzone
              label="Brand Logo Image"
              helperText="Upload PNG, JPG, or SVG brand mark"
              multiple={false}
              value={logoUrl}
              onChange={(url) => setLogoUrl(typeof url === "string" ? url : url[0] || "")}
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Official Website
            </label>
            <input
              type="text"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Description / Bio
            </label>
            <textarea
              rows={3}
              placeholder="Brand heritage, design philosophy, quality benchmarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          {editingBrand && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="brandActiveCheck"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-brand-burgundy focus:ring-brand-burgundy"
              />
              <label htmlFor="brandActiveCheck" className="font-semibold text-brand-slate-700">
                Active in Storefront
              </label>
            </div>
          )}

          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingBrand ? "Save Changes" : "Create Brand"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Brand */}
      <Modal
        isOpen={!!deleteBrand}
        onClose={() => setDeleteBrand(null)}
        title="Delete Brand"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Are you sure you want to delete <span className="font-bold text-brand-slate-900">{deleteBrand?.name}</span>?
          </p>
          <p className="text-xs text-brand-slate-500">
            Brands associated with active catalog products cannot be deleted.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDeleteBrand(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
