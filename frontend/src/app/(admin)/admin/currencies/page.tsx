"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  RefreshCw,
  Edit2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import {
  getAllCurrenciesAdminApi,
  updateExchangeRateAdminApi,
  toggleCurrencyStatusAdminApi,
} from "@/services/currency-service";
import { Currency } from "@/types/pricing";

export default function AdminCurrenciesPage() {
  const { token } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [newRate, setNewRate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCurrencies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAllCurrenciesAdminApi(token);
      if (res.success && res.data) {
        setCurrencies(res.data);
      }
    } catch (err) {
      console.error("Failed to load currencies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [token]);

  const handleOpenEdit = (curr: Currency) => {
    setEditingCurrency(curr);
    setNewRate(curr.exchangeRateToBase.toString());
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingCurrency) return;
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMsg("Please enter a valid rate greater than 0");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await updateExchangeRateAdminApi(editingCurrency.code, rateNum, token);
      if (res.success) {
        setSuccessMsg(`Exchange rate for ${editingCurrency.code} updated to ${rateNum}`);
        setEditingCurrency(null);
        fetchCurrencies();
      } else {
        setErrorMsg(res.message || "Failed to update exchange rate");
      }
    } catch {
      setErrorMsg("Network error updating rate");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (curr: Currency) => {
    if (!token || curr.isBase) return;
    try {
      const res = await toggleCurrencyStatusAdminApi(curr.code, !curr.isActive, token);
      if (res.success) {
        fetchCurrencies();
      }
    } catch (err) {
      console.error("Failed to toggle currency status", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-slate-900 tracking-tight flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-brand-emerald-700" />
            Global Currency & Exchange Engine
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Manage supported international currencies, real-time FX conversions, and platform base valuations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCurrencies} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh FX Rates
        </Button>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald-100 text-brand-emerald-800 flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <div className="text-xs text-brand-slate-500 font-medium">Platform Base Currency</div>
            <div className="text-base font-extrabold text-brand-slate-900">INR (Indian Rupee)</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-brand-slate-500 font-medium">Active Currencies</div>
            <div className="text-base font-extrabold text-brand-slate-900">
              {currencies.filter((c) => c.isActive).length} / {currencies.length} Supported
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-brand-slate-500 font-medium">Auto-Sync Status</div>
            <div className="text-base font-extrabold text-emerald-700">Online (Real-time FX)</div>
          </div>
        </Card>
      </div>

      {/* Currencies Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-brand-slate-100 bg-brand-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-slate-900">Configured Currency Pairs</h3>
          <span className="text-xs text-brand-slate-400">Base Formula: 1 INR × Exchange Rate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left divide-y divide-brand-slate-200">
            <thead className="bg-brand-slate-50 text-brand-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Exchange Rate (vs 1 INR)</th>
                <th className="px-4 py-3">1000 INR Equiv.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading currency matrices...
                  </td>
                </tr>
              ) : currencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-slate-400">
                    No currencies configured.
                  </td>
                </tr>
              ) : (
                currencies.map((curr) => {
                  const equiv = 1000 * curr.exchangeRateToBase;
                  return (
                    <tr key={curr.code} className="hover:bg-brand-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-brand-slate-900">{curr.name}</div>
                        {curr.isBase && (
                          <Badge variant="brand" size="sm" className="mt-0.5">Base Valuation</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-brand-emerald-800">
                        {curr.code}
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-slate-700 text-sm">
                        {curr.symbol}
                      </td>
                      <td className="px-4 py-3 font-mono text-brand-slate-900 font-semibold">
                        {curr.exchangeRateToBase.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-slate-700">
                        {curr.symbol} {equiv.toFixed(curr.decimalPlaces)}
                      </td>
                      <td className="px-4 py-3">
                        {curr.isActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Disabled</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {!curr.isBase && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(curr)}
                              className="text-xs gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit Rate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(curr)}
                              className={`text-xs ${
                                curr.isActive ? "text-rose-600 hover:text-rose-700" : "text-emerald-600 hover:text-emerald-700"
                              }`}
                            >
                              {curr.isActive ? "Disable" : "Enable"}
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Rate Modal */}
      {editingCurrency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-brand-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <h3 className="text-sm font-bold text-brand-slate-900">
                Update Exchange Rate &ndash; {editingCurrency.name} ({editingCurrency.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingCurrency(null)}
                className="text-brand-slate-400 hover:text-brand-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Exchange Rate (vs 1 INR)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    required
                    className="w-full text-xs font-mono font-semibold border border-brand-slate-200 rounded-xl p-3 bg-brand-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-emerald-600 focus:outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-brand-slate-400 mt-1.5">
                  Example: If 1 USD = 83.33 INR, enter 0.012000 (1 / 83.33).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setEditingCurrency(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save FX Rate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
