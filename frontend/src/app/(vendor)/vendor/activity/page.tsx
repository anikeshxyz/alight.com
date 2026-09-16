"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Lock,
  DollarSign,
  Boxes,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  category: "PRICE" | "INVENTORY" | "ORDER" | "SECURITY" | "RMA";
  details: string;
  delta: string;
  ip: string;
}

export default function VendorActivityPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((l) => {
    if (filterCategory !== "ALL" && l.category !== filterCategory) return false;
    if (!search) return true;
    return (
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Append-Only Vendor Audit Logs
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Immutable Trail
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Cryptographically sealed activity trail logging price changes, inventory overrides, order packaging, and staff logins.
          </p>
        </div>
      </div>

      {/* 2. FILTER TABS & SEARCH */}
      <Card className="p-4 space-y-4 border-brand-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { label: "All Events", value: "ALL" },
              { label: "Price Adjustments", value: "PRICE" },
              { label: "Inventory Counts", value: "INVENTORY" },
              { label: "Orders & Shipping", value: "ORDER" },
              { label: "RMAs & Returns", value: "RMA" },
              { label: "Security & Exports", value: "SECURITY" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterCategory(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filterCategory === tab.value
                    ? "bg-brand-emerald-800 text-white shadow-2xs"
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
              placeholder="Search audit trail by keyword, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* 3. AUDIT TRAIL TABLE */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target Entity / Details</th>
                <th className="px-4 py-3">Audit Delta</th>
                <th className="px-4 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-slate-500">
                    <p className="font-semibold text-sm">No activity logs recorded</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      Audit logs will automatically appear here as store operations, price adjustments, and shipments occur.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-brand-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-slate-900 block">{log.user}</span>
                      <span className="text-[10px] text-brand-slate-400 font-mono">{log.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-slate-900 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-brand-emerald-900 font-medium">
                      {log.delta}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-brand-slate-400">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
