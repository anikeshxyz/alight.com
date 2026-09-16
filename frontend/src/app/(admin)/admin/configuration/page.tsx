"use client";

import React, { useState } from "react";
import {
  Sliders,
  CheckCircle,
  Save,
  Shield,
  Clock,
  DollarSign,
  Percent,
  Truck,
  RotateCcw,
  Zap,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function AdminConfigurationPage() {
  const [config, setConfig] = useState({
    defaultCommissionRate: 10.0,
    platformSubscriptionFeeMonthly: 0,
    freeShippingThreshold: 2000,
    returnWindowDays: 7,
    escrowHoldDays: 7,
    minimumPayoutThreshold: 1000,
    // Feature Flags
    enableB2bWholesaleRfqs: true,
    enableMultiCurrencyCheckout: true,
    enableInstantVendorOnboarding: false,
    enableAutoEscrowPayoutRelease: true,
    enableCustomerDirectDisputes: true,
  });

  const [notification, setNotification] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setNotification("Marketplace configuration saved and audit record posted.");
      setTimeout(() => setNotification(""), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-gold-400" />
            Marketplace Engine & Business Rules Configuration
          </h1>
          <p className="text-xs text-brand-slate-400">
            Configure global commission defaults, escrow settlement schedules, return policies, and platform feature flags.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm self-start sm:self-auto transition-all disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Financial & Settlement Engine Rules */}
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-brand-slate-700 pb-2">
            <DollarSign className="w-4 h-4 text-brand-emerald-400" />
            Settlement & Commission Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-slate-300 font-medium mb-1">
                Default Vendor Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={config.defaultCommissionRate}
                onChange={(e) => setConfig({ ...config, defaultCommissionRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white font-mono"
              />
              <p className="text-[10px] text-brand-slate-400 mt-1">Applies to newly onboarded vendors without custom SLA contracts.</p>
            </div>

            <div>
              <label className="block text-brand-slate-300 font-medium mb-1">
                Escrow Hold Period (Days after Delivery)
              </label>
              <select
                value={config.escrowHoldDays}
                onChange={(e) => setConfig({ ...config, escrowHoldDays: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
              >
                <option value={3}>T+3 Days (Accelerated)</option>
                <option value={7}>T+7 Days (Standard Marketplace SLA)</option>
                <option value={14}>T+14 Days (Extended Risk Buffer)</option>
              </select>
              <p className="text-[10px] text-brand-slate-400 mt-1">Funds remain in escrow ledger until RMA return window closes.</p>
            </div>

            <div>
              <label className="block text-brand-slate-300 font-medium mb-1">
                Minimum Payout Disbursement Threshold (₹)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={config.minimumPayoutThreshold}
                onChange={(e) => setConfig({ ...config, minimumPayoutThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-brand-slate-300 font-medium mb-1">
                Free Commercial Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={config.freeShippingThreshold}
                onChange={(e) => setConfig({ ...config, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* RMA & Policy Window Rules */}
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-brand-slate-700 pb-2">
            <RotateCcw className="w-4 h-4 text-brand-gold-400" />
            RMA & Returns Policy Framework
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-slate-300 font-medium mb-1">
                Customer Return Window
              </label>
              <select
                value={config.returnWindowDays}
                onChange={(e) => setConfig({ ...config, returnWindowDays: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
              >
                <option value={7}>7 Days from Delivery (Standard)</option>
                <option value={10}>10 Days from Delivery</option>
                <option value={14}>14 Days from Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Platform Feature Flags */}
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-brand-slate-700 pb-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Marketplace Feature Flags & Governance Toggles
          </h3>

          <div className="space-y-2.5">
            {[
              {
                key: "enableB2bWholesaleRfqs",
                label: "B2B Volume RFQs & Contractor Quotations",
                desc: "Allow buyers to submit bulk architectural hardware inquiries.",
              },
              {
                key: "enableMultiCurrencyCheckout",
                label: "Multi-Currency Cross-Border Checkout",
                desc: "Enable real-time FX conversion for international buyers in USD, EUR, and GBP.",
              },
              {
                key: "enableAutoEscrowPayoutRelease",
                label: "Automated Escrow Payout Execution",
                desc: "Automatically queue bank payouts upon RMA window closure without manual sign-off.",
              },
              {
                key: "enableCustomerDirectDisputes",
                label: "Buyer-Seller Mediation Portal",
                desc: "Provide formal customer arbitration escalation for rejected returns.",
              },
            ].map((flag) => {
              const val = (config as any)[flag.key];
              return (
                <label
                  key={flag.key}
                  className="flex items-center justify-between p-3 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750 cursor-pointer hover:border-brand-slate-600 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-white">{flag.label}</span>
                    <p className="text-[11px] text-brand-slate-400 mt-0.5">{flag.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => setConfig({ ...config, [flag.key]: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-emerald-500 focus:ring-0 bg-brand-slate-800 border-brand-slate-700"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
