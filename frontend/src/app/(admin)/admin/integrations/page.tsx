"use client";

import React, { useState } from "react";
import {
  Webhook,
  CreditCard,
  Truck,
  Receipt,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  Key,
  Shield,
  ExternalLink,
  Settings2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface IntegrationProvider {
  id: string;
  name: string;
  category: "PAYMENT" | "LOGISTICS" | "TAX" | "COMMUNICATION";
  status: "CONNECTED" | "SANDBOX" | "DISCONNECTED";
  lastSyncAt: string;
  mode: "LIVE" | "TEST";
  description: string;
}

const PROVIDERS: IntegrationProvider[] = [
  {
    id: "int-razorpay",
    name: "Razorpay Standard Checkout",
    category: "PAYMENT",
    status: "CONNECTED",
    lastSyncAt: "5 min ago",
    mode: "LIVE",
    description: "UPI, Credit Cards, NetBanking, and automated vendor payout webhooks.",
  },
  {
    id: "int-stripe",
    name: "Stripe International Payments",
    category: "PAYMENT",
    status: "CONNECTED",
    lastSyncAt: "12 min ago",
    mode: "LIVE",
    description: "Multi-currency checkout for USD, EUR, and GBP cross-border trade.",
  },
  {
    id: "int-delhivery",
    name: "Delhivery Surface & Express",
    category: "LOGISTICS",
    status: "CONNECTED",
    lastSyncAt: "1 hour ago",
    mode: "LIVE",
    description: "Automated consignment booking, AWB generation, and milestone tracking.",
  },
  {
    id: "int-bluedart",
    name: "BlueDart Apex Courier",
    category: "LOGISTICS",
    status: "SANDBOX",
    lastSyncAt: "2 days ago",
    mode: "TEST",
    description: "Premium express courier service for high-value architectural shipments.",
  },
  {
    id: "int-cleartax",
    name: "ClearTax GSTN E-Way Bill & E-Invoice",
    category: "TAX",
    status: "CONNECTED",
    lastSyncAt: "25 min ago",
    mode: "LIVE",
    description: "Real-time IRN generation, GSTR-8 marketplace TCS filing, and digital signature.",
  },
  {
    id: "int-twilio",
    name: "Twilio SMS & OTP Gateway",
    category: "COMMUNICATION",
    status: "CONNECTED",
    lastSyncAt: "Just now",
    mode: "LIVE",
    description: "Transactional buyer SMS, courier tracking links, and merchant login 2FA.",
  },
];

export default function AdminIntegrationsPage() {
  const [providers, setProviders] = useState<IntegrationProvider[]>(PROVIDERS);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [configModal, setConfigModal] = useState(false);
  const [notification, setNotification] = useState("");

  const filtered = providers.filter((p) => {
    return activeCategory === "ALL" || p.category === activeCategory;
  });

  const handleTestConnection = (prov: IntegrationProvider) => {
    setNotification(`Ping test successful for ${prov.name}. Latency: 42ms. Health: Optimal.`);
    setTimeout(() => setNotification(""), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-brand-emerald-400" />
            Platform Integration & External Gateway Hub
          </h1>
          <p className="text-xs text-brand-slate-400">
            Manage decoupled provider abstractions for payment gateways, carrier logistics, GSTN e-invoicing, and messaging.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-brand-slate-700 text-xs">
        {(["ALL", "PAYMENT", "LOGISTICS", "TAX", "COMMUNICATION"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2.5 font-semibold capitalize border-b-2 transition-all ${
              activeCategory === cat
                ? "border-brand-emerald-500 text-brand-emerald-400 bg-brand-slate-800/40"
                : "border-transparent text-brand-slate-400 hover:text-white"
            }`}
          >
            {cat === "ALL" ? "All Integrations" : cat}
          </button>
        ))}
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prov) => (
          <div key={prov.id} className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-brand-slate-700 text-brand-slate-300 border-brand-slate-600">
                  {prov.category}
                </span>
                {prov.status === "CONNECTED" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                    <RefreshCw className="w-3 h-3" /> Sandbox
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-white">{prov.name}</div>
              <p className="text-xs text-brand-slate-400 leading-relaxed">{prov.description}</p>
            </div>

            <div className="pt-3 border-t border-brand-slate-700/60 flex items-center justify-between text-xs">
              <div className="text-[11px] text-brand-slate-500">
                Mode: <strong className="text-brand-slate-300">{prov.mode}</strong> • {prov.lastSyncAt}
              </div>

              <button
                onClick={() => handleTestConnection(prov)}
                className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium transition-colors"
              >
                Test Ping
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
