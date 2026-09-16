"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Filter,
  Eye,
  Activity,
  UserX,
  CreditCard,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface RiskAlert {
  id: string;
  type: "VELOCITY_SPIKE" | "MULTI_ACCOUNT_FINGERPRINT" | "RETURN_RATE_ANOMALY" | "COUPON_EXPLOIT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  targetType: "CUSTOMER" | "VENDOR" | "ORDER";
  targetId: string;
  targetName: string;
  description: string;
  detectedAt: string;
  status: "INVESTIGATING" | "RESTRICTED" | "DISMISSED";
}

interface BlacklistEntry {
  id: string;
  type: "GSTIN" | "PAN" | "PHONE" | "EMAIL" | "IP_ADDRESS";
  value: string;
  reason: string;
  addedBy: string;
  addedAt: string;
}

export default function AdminRiskPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "blacklist" | "rules">("alerts");
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [notification, setNotification] = useState("");

  // Blacklist modal state
  const [showAddBlacklist, setShowAddBlacklist] = useState(false);
  const [blType, setBlType] = useState<BlacklistEntry["type"]>("GSTIN");
  const [blValue, setBlValue] = useState("");
  const [blReason, setBlReason] = useState("");

  const handleUpdateAlert = (id: string, newStatus: RiskAlert["status"]) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    setNotification(`Alert status updated to ${newStatus}`);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blValue || !blReason) return;
    const newEntry: BlacklistEntry = {
      id: `bl-${Date.now()}`,
      type: blType,
      value: blValue.trim(),
      reason: blReason.trim(),
      addedBy: "admin@alight.com",
      addedAt: new Date().toISOString().split("T")[0],
    };
    setBlacklist([newEntry, ...blacklist]);
    setShowAddBlacklist(false);
    setBlValue("");
    setBlReason("");
    setNotification("Entry added to global marketplace blacklist");
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Risk, Fraud & Abuse Prevention Engine
          </h1>
          <p className="text-xs text-brand-slate-400">
            Heuristic pattern detection for checkout velocity anomalies, multi-account abuse, and global blacklist controls.
          </p>
        </div>

        <button
          onClick={() => setShowAddBlacklist(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-lg text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add to Blacklist
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-brand-slate-700 text-xs">
        {(["alerts", "blacklist", "rules"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-semibold capitalize border-b-2 transition-all ${
              activeTab === tab
                ? "border-rose-500 text-rose-400 bg-brand-slate-800/40"
                : "border-transparent text-brand-slate-400 hover:text-white"
            }`}
          >
            {tab === "alerts" ? `Live Risk Alerts (${alerts.length})` : tab === "blacklist" ? `Blacklist Registry (${blacklist.length})` : "Heuristic Rule Thresholds"}
          </button>
        ))}
      </div>

      {/* Tab: Alerts */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-brand-slate-400 bg-brand-slate-850 border border-brand-slate-700 rounded-xl text-xs">
              No active risk alerts flagged. Marketplace security is nominal.
            </div>
          ) : (
            alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-950 text-rose-300 border-rose-700"
                        : alert.severity === "HIGH"
                        ? "bg-amber-950 text-amber-300 border-amber-700"
                        : "bg-blue-950 text-blue-300 border-blue-700"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">{alert.id}</span>
                  <span className="text-xs text-brand-slate-400">• {alert.type.replace("_", " ")}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateAlert(alert.id, "RESTRICTED")}
                    className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-semibold"
                  >
                    Restrict Account
                  </button>
                  <button
                    onClick={() => handleUpdateAlert(alert.id, "DISMISSED")}
                    className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-300 rounded text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="text-xs">
                <div className="font-semibold text-white">{alert.targetName}</div>
                <p className="text-brand-slate-300 mt-1 leading-relaxed">{alert.description}</p>
                <div className="text-[10px] text-brand-slate-500 mt-2 font-mono">
                  Triggered: {new Date(alert.detectedAt).toLocaleString()} • Current Status: {alert.status}
                </div>
              </div>
            </div>
          )))}
        </div>
      )}

      {/* Tab: Blacklist */}
      {activeTab === "blacklist" && (
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Identifier Type</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Enforcement Reason</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {blacklist.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-slate-400">
                    No blacklisted identifiers recorded.
                  </td>
                </tr>
              ) : (
                blacklist.map((entry) => (
                <tr key={entry.id} className="hover:bg-brand-slate-750/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800">
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {entry.value}
                  </td>
                  <td className="py-3 px-4 text-brand-slate-300">
                    {entry.reason}
                  </td>
                  <td className="py-3 px-4 text-brand-slate-400 font-mono text-[11px]">
                    {entry.addedAt}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setBlacklist(blacklist.filter((b) => b.id !== entry.id))}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === "rules" && (
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4 max-w-2xl text-xs">
          <h3 className="text-sm font-bold text-white">Automated Risk Threshold Configuration</h3>

          <div className="space-y-3">
            <div className="p-3 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Max Return Threshold</span>
                <p className="text-[11px] text-brand-slate-400">Trigger manual audit if customer return rate exceeds</p>
              </div>
              <span className="font-mono text-brand-gold-400 font-bold text-sm">15.0%</span>
            </div>

            <div className="p-3 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Rapid Checkout Velocity Limit</span>
                <p className="text-[11px] text-brand-slate-400">Flag account if orders exceed threshold within 1 hour</p>
              </div>
              <span className="font-mono text-brand-gold-400 font-bold text-sm">5 Orders / hr</span>
            </div>

            <div className="p-3 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">First-Order Max Cart Value</span>
                <p className="text-[11px] text-brand-slate-400">Require 3D Secure / OTP verification above</p>
              </div>
              <span className="font-mono text-brand-gold-400 font-bold text-sm">₹50,000</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add to Blacklist */}
      {showAddBlacklist && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Add Entity to Marketplace Blacklist
              </h3>
              <button onClick={() => setShowAddBlacklist(false)} className="text-brand-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} className="space-y-3 text-xs">
              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Identifier Type</label>
                <select
                  value={blType}
                  onChange={(e) => setBlType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
                >
                  <option value="GSTIN">GSTIN (Business Tax ID)</option>
                  <option value="PAN">PAN (Permanent Account Number)</option>
                  <option value="PHONE">Phone Number</option>
                  <option value="EMAIL">Email Address</option>
                  <option value="IP_ADDRESS">IP Address / CIDR</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Identifier Value</label>
                <input
                  type="text"
                  required
                  value={blValue}
                  onChange={(e) => setBlValue(e.target.value)}
                  placeholder="e.g. 27AAACL1234F1Z8"
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Enforcement Ground / Reason</label>
                <textarea
                  required
                  rows={2}
                  value={blReason}
                  onChange={(e) => setBlReason(e.target.value)}
                  placeholder="Document legal or risk investigation finding..."
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddBlacklist(false)}
                  className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-800 text-white rounded-lg hover:bg-rose-700 font-semibold"
                >
                  Add to Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
