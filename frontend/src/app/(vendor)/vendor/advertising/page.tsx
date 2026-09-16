"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface AdCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  dailyBudget: number;
  cpcBid: number;
  impressions: number;
  clicks: number;
  ctr: string;
  spend: number;
  orders: number;
  revenue: number;
  roas: string;
}

export default function VendorAdvertisingPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [campName, setCampName] = useState("");
  const [budget, setBudget] = useState("500");
  const [cpc, setCpc] = useState("4.0");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;

    const newCamp: AdCampaign = {
      id: `camp-${Date.now()}`,
      name: campName.trim(),
      status: "ACTIVE",
      dailyBudget: parseFloat(budget) || 500,
      cpcBid: parseFloat(cpc) || 4.0,
      impressions: 0,
      clicks: 0,
      ctr: "0.0%",
      spend: 0,
      orders: 0,
      revenue: 0,
      roas: "0.0x",
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setModalOpen(false);
      setCampName("");
    }, 1500);
  };

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) + "x" : "0.0x";
  const avgCpc = totalClicks > 0 ? "₹" + (totalSpend / totalClicks).toFixed(2) : "₹0.00";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Sponsored Product Advertising
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              CPC Search Ads
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Boost top-of-search visibility on modular hardware queries, target architect searches, and track Return On Ad Spend (ROAS).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Launch Ad Campaign
        </Button>
      </div>

      {/* 2. AD ROAS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-brand-slate-500">Ad Spend</span>
          <p className="text-2xl font-black text-brand-slate-900 mt-1">₹{totalSpend.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-brand-slate-400">Total CPC investment</span>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-brand-slate-500">Ad Attributed Revenue</span>
          <p className="text-2xl font-black text-brand-slate-900 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-brand-slate-400">Direct ad sales</span>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-brand-slate-500">Average ROAS</span>
          <p className="text-2xl font-black text-brand-slate-900 mt-1">{avgRoas}</p>
          <span className="text-[10px] text-brand-slate-400">Return on ad spend</span>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-brand-slate-500">Total Sponsored Clicks</span>
          <p className="text-2xl font-black text-brand-slate-900 mt-1">{totalClicks}</p>
          <span className="text-[10px] text-brand-slate-400">Avg CPC: {avgCpc}</span>
        </Card>
      </div>

      {/* 3. CAMPAIGN TABLE */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Campaign Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Daily Budget</th>
                <th className="px-4 py-3 text-center">Clicks / CTR</th>
                <th className="px-4 py-3">Spend</th>
                <th className="px-4 py-3">Attributed Sales</th>
                <th className="px-4 py-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-brand-slate-500">
                    <p className="font-semibold text-sm">No ad campaigns found</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      Launch your first sponsored product campaign to increase visibility and track real-time ad performance.
                    </p>
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-brand-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-brand-slate-900 block">{camp.name}</span>
                      <span className="text-[10px] text-brand-slate-400">Keyword Bidding: CPC ₹{camp.cpcBid.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          camp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-brand-slate-100 text-brand-slate-600"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-brand-slate-900">
                      ₹{camp.dailyBudget}/day
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-brand-slate-900 block">{camp.clicks} clicks</span>
                      <span className="text-[10px] text-brand-slate-400 font-mono">CTR {camp.ctr}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-brand-slate-900">
                      ₹{camp.spend.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-brand-slate-900">
                      ₹{camp.revenue.toLocaleString("en-IN")} ({camp.orders} orders)
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                      {camp.roas}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Launch Campaign Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Launch Sponsored Search Campaign">
        <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold mb-1">Campaign Name *</label>
            <input
              type="text"
              placeholder="e.g. Stainless Steel Modular Baskets - Search Ads"
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Daily Budget (₹) *</label>
              <input
                type="number"
                min="100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Max CPC Bid (₹) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={cpc}
                onChange={(e) => setCpc(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono focus:outline-none focus:border-brand-emerald-800"
              />
            </div>
          </div>

          {successMsg && (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Ad campaign initiated and active in marketplace search auctions!
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-brand-emerald-800 text-white font-bold">
              Launch Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
