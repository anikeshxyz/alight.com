"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Star,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  getVendorWarehousesApi,
  createVendorWarehouseApi,
  updateVendorWarehouseApi,
  deleteVendorWarehouseApi,
} from "@/services/inventory-service";
import { Warehouse, CreateWarehousePayload, UpdateWarehousePayload } from "@/types/inventory";

export default function VendorWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteWarehouse, setDeleteWarehouse] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await getVendorWarehousesApi(token);
      if (res.success && res.data) {
        setWarehouses(res.data);
      }
    } catch (err) {
      console.error("Failed to load warehouses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const openCreateModal = () => {
    setEditingWarehouse(null);
    setName("");
    setCode("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setIsPrimary(warehouses.length === 0);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (w: Warehouse) => {
    setEditingWarehouse(w);
    setName(w.name);
    setCode(w.code);
    setContactName(w.contactName || "");
    setContactPhone(w.contactPhone || "");
    setContactEmail(w.contactEmail || "");
    setAddressLine1(w.addressLine1);
    setAddressLine2(w.addressLine2 || "");
    setCity(w.city);
    setState(w.state);
    setPostalCode(w.postalCode);
    setIsPrimary(w.primary);
    setIsActive(w.active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      setFormError("Please fill out all required address and identification fields.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("alight_token") || "";
      if (editingWarehouse) {
        const payload: UpdateWarehousePayload = {
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          primary: isPrimary,
          active: isActive,
        };
        const res = await updateVendorWarehouseApi(editingWarehouse.id, payload, token);
        if (res.success) {
          setModalOpen(false);
          loadWarehouses();
        } else {
          setFormError(res.message || "Failed to update warehouse");
        }
      } else {
        const payload: CreateWarehousePayload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          primary: isPrimary,
          active: true,
        };
        const res = await createVendorWarehouseApi(payload, token);
        if (res.success) {
          setModalOpen(false);
          loadWarehouses();
        } else {
          setFormError(res.message || "Failed to create warehouse");
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
    if (!deleteWarehouse) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await deleteVendorWarehouseApi(deleteWarehouse.id, token);
      if (res.success) {
        setDeleteWarehouse(null);
        loadWarehouses();
      }
    } catch (err) {
      console.error("Failed to delete warehouse", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Fulfillment Hubs & Warehouses</h1>
          <p className="text-xs text-brand-slate-500">
            Manage your regional inventory locations, dispatch points, and primary fulfillment centers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadWarehouses}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Warehouse
          </Button>
        </div>
      </div>

      {/* Grid of Warehouses */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 animate-pulse space-y-4">
              <div className="h-5 bg-brand-slate-100 rounded w-1/2" />
              <div className="h-4 bg-brand-slate-100 rounded w-3/4" />
              <div className="h-10 bg-brand-slate-100 rounded" />
            </Card>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <Card className="p-12 text-center text-brand-slate-400">
          <Building2 className="w-12 h-12 mx-auto text-brand-slate-300 mb-3" />
          <h3 className="font-bold text-brand-slate-700 text-sm">No Warehouses Registered</h3>
          <p className="text-xs text-brand-slate-400 mt-1 max-w-sm mx-auto">
            Add your primary manufacturing facility, factory depot, or third-party dispatch center to start allocating stock.
          </p>
          <Button variant="primary" size="sm" className="mt-4" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Create First Warehouse
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {warehouses.map((w) => (
            <Card key={w.id} className="p-5 relative hover:shadow-md transition-shadow border-brand-slate-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald-50 text-brand-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-brand-slate-900 text-sm">{w.name}</h2>
                      {w.primary && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500" /> Primary Hub
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Same-Day SLA (Cutoff 4 PM)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-brand-slate-400">{w.code}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(w)}
                    className="p-1.5 text-brand-slate-600 hover:bg-brand-slate-100 rounded-lg transition-colors"
                    title="Edit Location"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!w.primary && (
                    <button
                      onClick={() => setDeleteWarehouse(w)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Warehouse"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Address & Details */}
              <div className="space-y-2 text-xs text-brand-slate-600 bg-brand-slate-50/70 p-3 rounded-lg border border-brand-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-slate-400 mt-0.5 shrink-0" />
                  <span>
                    {w.addressLine1}
                    {w.addressLine2 ? `, ${w.addressLine2}` : ""}, {w.city}, {w.state} - {w.postalCode}
                  </span>
                </div>

                {(w.contactName || w.contactPhone || w.contactEmail) && (
                  <div className="pt-2 border-t border-brand-slate-200/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                    {w.contactName && (
                      <span className="font-medium text-brand-slate-700">Contact: {w.contactName}</span>
                    )}
                    {w.contactPhone && (
                      <span className="flex items-center gap-1 text-brand-slate-500">
                        <Phone className="w-3 h-3" /> {w.contactPhone}
                      </span>
                    )}
                    {w.contactEmail && (
                      <span className="flex items-center gap-1 text-brand-slate-500">
                        <Mail className="w-3 h-3" /> {w.contactEmail}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {w.active ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dispatch Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-brand-slate-400">
                      <AlertCircle className="w-3.5 h-3.5" /> Inactive
                    </span>
                  )}
                </div>
                <span className="text-brand-slate-400 text-[10px]">
                  Updated {new Date(w.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Warehouse */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWarehouse ? "Edit Warehouse Location" : "Add Warehouse Location"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs text-brand-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Warehouse Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Gurugram Primary Plant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Warehouse Code *
              </label>
              <input
                type="text"
                placeholder="e.g. WH-DEL-01"
                disabled={!!editingWarehouse}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy disabled:bg-brand-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="Dispatch Manager"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+919876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="hub@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              placeholder="Plot / Unit Number, Industrial Area"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              placeholder="Landmark or Suburb"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                placeholder="e.g. Gurugram"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                placeholder="e.g. Haryana"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                placeholder="122001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded text-brand-burgundy focus:ring-brand-burgundy"
              />
              <span>Set as Primary Dispatch Hub</span>
            </label>

            {editingWarehouse && (
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-brand-burgundy focus:ring-brand-burgundy"
                />
                <span>Active for Orders</span>
              </label>
            )}
          </div>

          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingWarehouse ? "Save Changes" : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Warehouse */}
      <Modal
        isOpen={!!deleteWarehouse}
        onClose={() => setDeleteWarehouse(null)}
        title="Delete Warehouse"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Are you sure you want to delete <span className="font-bold text-brand-slate-900">{deleteWarehouse?.name}</span> ({deleteWarehouse?.code})?
          </p>
          <p className="text-xs text-brand-slate-500">
            Stock records and audit history assigned to this location will be archived.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDeleteWarehouse(null)}>
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
