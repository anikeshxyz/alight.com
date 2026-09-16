"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import {
  getAllTaxCategoriesAdminApi,
  createTaxCategoryAdminApi,
} from "@/services/tax-service";
import { TaxCategory } from "@/types/pricing";

export default function AdminTaxesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newHsn, setNewHsn] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCategories = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAllTaxCategoriesAdminApi(token);
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Failed to load tax categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newCode.trim() || !newName.trim()) {
      setErrorMsg("Category Code and Name are required");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await createTaxCategoryAdminApi(
        {
          code: newCode.trim(),
          name: newName.trim(),
          hsnSacCode: newHsn.trim() || undefined,
          description: newDesc.trim() || undefined,
          isActive: true,
        },
        token
      );
      if (res.success) {
        setSuccessMsg(`Tax Category ${newCode} created successfully`);
        setShowAddModal(false);
        setNewCode("");
        setNewName("");
        setNewHsn("");
        setNewDesc("");
        fetchCategories();
      } else {
        setErrorMsg(res.message || "Failed to create tax category");
      }
    } catch {
      setErrorMsg("Network error creating tax category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-brand-emerald-700" />
            Tax Compliance & HSN Slabs Engine
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Configure statutory tax categories, HSN/SAC code classifications, and India GST (CGST/SGST/IGST) rule sets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Tax Category
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tax Regime Information Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-linear-to-r from-emerald-50/70 to-teal-50/50 border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900">Intra-State GST (CGST 50% + SGST 50%)</h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Applies when Vendor/Warehouse dispatch location and Customer shipping address are within the same State (e.g. MH to MH).
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-linear-to-r from-blue-50/70 to-indigo-50/50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-900">Inter-State GST (IGST 100%)</h4>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Applies when dispatch and destination span across state boundaries (e.g. Delhi warehouse shipping to Karnataka customer).
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-brand-slate-100 bg-brand-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-slate-900">Configured Tax Categories & HSN Codes</h3>
          <span className="text-xs text-brand-slate-500">{categories.length} Categories Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left divide-y divide-brand-slate-200">
            <thead className="bg-brand-slate-50 text-brand-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Category Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">HSN / SAC Code</th>
                <th className="px-4 py-3">Applicable Scope / Description</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading tax categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-400">
                    No tax categories registered.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-brand-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-emerald-800">
                      {cat.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-slate-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-slate-700">
                      {cat.hsnSacCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-brand-slate-500">
                      {cat.description || "General classification"}
                    </td>
                    <td className="px-4 py-3">
                      {cat.isActive ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Tax Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-brand-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <h3 className="text-sm font-bold text-brand-slate-900">Add New Tax Category</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-brand-slate-400 hover:text-brand-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Tax Category Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GST_18_ELEC"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                  className="w-full text-xs font-mono border border-brand-slate-200 rounded-xl p-2.5 bg-brand-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electrical Lighting 18%"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full text-xs border border-brand-slate-200 rounded-xl p-2.5 bg-brand-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9405"
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  className="w-full text-xs font-mono border border-brand-slate-200 rounded-xl p-2.5 bg-brand-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Products and goods falling under this tax classification"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs border border-brand-slate-200 rounded-xl p-2.5 bg-brand-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
