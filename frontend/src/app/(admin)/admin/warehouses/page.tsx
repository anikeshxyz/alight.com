"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  getAllWarehousesAdminApi,
  createPlatformWarehouseAdminApi,
} from "@/services/inventory-service";
import { Warehouse, CreateWarehousePayload } from "@/types/inventory";

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
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

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await getAllWarehousesAdminApi(token);
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
    setIsPrimary(false);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      setFormError("Please fill out all required warehouse details.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("alight_token") || "";
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

      const res = await createPlatformWarehouseAdminApi(payload, token);
      if (res.success) {
        setModalOpen(false);
        loadWarehouses();
      } else {
        setFormError(res.message || "Failed to create platform fulfillment center");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const platformHubs = warehouses.filter((w) => !w.vendorId);
  const vendorHubs = warehouses.filter((w) => !!w.vendorId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Fulfillment Network & Warehouses</h1>
          <p className="text-xs text-brand-slate-500">
            Platform central logistics hubs and multi-vendor regional dispatch locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadWarehouses}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Platform Hub
          </Button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Platform Fulfillment Centers</p>
              <p className="text-xl font-bold text-emerald-800">{platformHubs.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Vendor Dispatch Nodes</p>
              <p className="text-xl font-bold text-blue-700">{vendorHubs.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Total Active Nodes</p>
              <p className="text-xl font-bold text-emerald-700">{warehouses.filter((w) => w.active).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Warehouses Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Warehouse Hub</th>
                <th className="px-4 py-3">Ownership / Vendor</th>
                <th className="px-4 py-3">Location & Address</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading warehouse topology...
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                    <p className="font-semibold text-brand-slate-700">No warehouses found</p>
                  </td>
                </tr>
              ) : (
                warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-brand-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-brand-slate-900">{w.name}</div>
                      <div className="text-[10px] font-mono text-brand-slate-400">{w.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      {w.vendorId ? (
                        <div>
                          <Badge variant="neutral">{w.vendorStoreName}</Badge>
                        </div>
                      ) : (
                        <Badge variant="brand">
                          Platform Central Hub
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-slate-400 shrink-0" />
                        <span>
                          {w.city}, {w.state} ({w.postalCode})
                        </span>
                      </div>
                      <div className="text-[11px] text-brand-slate-400 ml-5 truncate max-w-xs">{w.addressLine1}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-slate-500">
                      {w.contactName ? (
                        <div>
                          <div className="font-medium text-brand-slate-800">{w.contactName}</div>
                          {w.contactPhone && <div className="text-[10px]">{w.contactPhone}</div>}
                        </div>
                      ) : (
                        <span className="italic text-brand-slate-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {w.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create Platform Fulfillment Center */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Platform Fulfillment Center"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs text-brand-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Hub Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Alight South Hub Bangalore"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Unique Hub Code *
              </label>
              <input
                type="text"
                placeholder="e.g. WH-BLR-02"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Manager / Lead
              </label>
              <input
                type="text"
                placeholder="Operations Lead"
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
                placeholder="+91..."
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Dispatch Email
              </label>
              <input
                type="email"
                placeholder="ops@alight.com"
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
              placeholder="Logistics Park / Road"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
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
                placeholder="Bengaluru"
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
                placeholder="Karnataka"
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
                placeholder="560100"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Create Platform Center
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
