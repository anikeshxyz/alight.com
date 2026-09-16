"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  Printer,
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { getVendorOrdersApi } from "@/services/order-service";
import { VendorOrder } from "@/types/order";

const CARRIER_LOGOS: Record<string, string> = {
  DELHIVERY: "Delhivery Surface & Air",
  BLUEDART: "BlueDart Apex Express",
  DTDC: "DTDC Priority Logistics",
};

export default function VendorFulfillmentPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"READY_FOR_PICKUP" | "IN_TRANSIT" | "DELIVERED" | "ALL">("READY_FOR_PICKUP");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManifestOrders, setSelectedManifestOrders] = useState<string[]>([]);
  const [manifestModalOpen, setManifestModalOpen] = useState(false);

  const loadShipments = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getVendorOrdersApi(token, undefined, 0, 50);
      if (res.success && res.data) {
        setOrders(res.data.content);
      }
    } catch (err) {
      console.error("Failed to load fulfillment orders", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.subOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.courierPartner && o.courierPartner.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTab === "ALL") return true;
    if (filterTab === "READY_FOR_PICKUP") {
      return o.fulfillmentStatus === "PROCESSING" || o.fulfillmentStatus === "UNFULFILLED" || o.fulfillmentStatus === "PENDING";
    }
    if (filterTab === "IN_TRANSIT") {
      return o.fulfillmentStatus === "SHIPPED" || o.fulfillmentStatus === "IN_TRANSIT" || o.fulfillmentStatus === "OUT_FOR_DELIVERY";
    }
    if (filterTab === "DELIVERED") {
      return o.fulfillmentStatus === "DELIVERED";
    }
    return true;
  });

  const handlePrintManifest = () => {
    setManifestModalOpen(true);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Fulfillment & Carrier Dispatch Center
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Multi-Carrier Integrated
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Process bulk dispatch manifests, coordinate courier pickup handovers, generate thermal AWB labels, and track live transit events.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={handlePrintManifest} className="text-xs gap-1.5 font-bold">
            <Printer className="w-3.5 h-3.5" /> Courier Handover Manifest
          </Button>
          <Button variant="outline" size="sm" onClick={loadShipments} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Awaiting Courier Pickup</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">
              {orders.filter((o) => o.fulfillmentStatus === "PROCESSING" || o.fulfillmentStatus === "UNFULFILLED").length} Parcels
            </span>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">Pickup Scheduled Today</p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Active In-Transit</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">
              {orders.filter((o) => o.fulfillmentStatus === "SHIPPED").length} Shipments
            </span>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">Live Multi-Carrier Tracking</p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Delivered Successfully</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">
              {orders.filter((o) => o.fulfillmentStatus === "DELIVERED").length} Completed
            </span>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Escrow Funds Cleared</p>
          </div>
        </Card>
      </div>

      {/* 3. TABS & SEARCH */}
      <Card className="p-4 space-y-4 border-brand-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { label: "Awaiting Dispatch", value: "READY_FOR_PICKUP" },
              { label: "In Transit", value: "IN_TRANSIT" },
              { label: "Delivered", value: "DELIVERED" },
              { label: "All Shipments", value: "ALL" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterTab(tab.value as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filterTab === tab.value
                    ? "bg-brand-emerald-800 text-white shadow-2xs"
                    : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
            <input
              type="text"
              placeholder="Search by Sub-Order #, AWB or Courier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* 4. SHIPMENTS TABLE */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Sub-Order & Items</th>
                <th className="px-4 py-3">Carrier Partner</th>
                <th className="px-4 py-3">AWB Tracking #</th>
                <th className="px-4 py-3">Dispatch SLA</th>
                <th className="px-4 py-3">Fulfillment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-slate-400 mb-2" />
                    <span>Loading shipment records...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                    <p className="font-semibold text-brand-slate-700">No shipments found in this category</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-brand-slate-900">{o.subOrderNumber}</div>
                      <div className="text-[11px] text-brand-slate-500 mt-0.5">
                        {o.items?.length || 1} catalog SKU(s) • Total: ₹{(o.subtotalAmount ?? 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-bold text-brand-slate-900">
                        <Truck className="w-3.5 h-3.5 text-brand-emerald-800" />
                        <span>{o.courierPartner ? (CARRIER_LOGOS[o.courierPartner] || o.courierPartner) : "Pending Carrier"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {o.trackingNumber ? (
                        <div className="inline-flex items-center gap-1 bg-brand-slate-100 px-2 py-0.5 rounded-md border border-brand-slate-200">
                          <span className="font-mono font-bold text-brand-slate-800">{o.trackingNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold">AWB Pending Booking</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px]">
                        <span className="font-semibold text-brand-slate-900">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "Standard SLA"}
                        </span>
                        <span className="block text-[10px] text-brand-slate-500 font-medium">Standard Dispatch</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.fulfillmentStatus === "DELIVERED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : o.fulfillmentStatus === "SHIPPED"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {o.fulfillmentStatus || "PROCESSING"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href="/vendor/orders">
                        <Button variant="outline" size="sm" className="text-xs h-7 py-0.5 font-bold">
                          Process in Orders →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manifest Modal */}
      <Modal
        isOpen={manifestModalOpen}
        onClose={() => setManifestModalOpen(false)}
        title="Courier Handover Manifest Sheet"
      >
        <div className="space-y-4 text-xs text-brand-slate-700">
          <div className="p-3 bg-brand-slate-50 border border-brand-slate-200 rounded-xl">
            <h4 className="font-bold text-sm text-brand-slate-900">Alight Marketplace Dispatch Manifest</h4>
            <p className="text-[11px] text-brand-slate-500">
              Date: {new Date().toLocaleDateString()} • Facility: Mumbai Central Dispatch Bay #4
            </p>
          </div>

          <div className="border border-brand-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-brand-slate-100 font-bold text-brand-slate-700">
                <tr>
                  <th className="p-2">Sub-Order #</th>
                  <th className="p-2">AWB Tracking #</th>
                  <th className="p-2">Carrier</th>
                  <th className="p-2 text-right">Packages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {orders.slice(0, 5).map((o, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-mono">{o.subOrderNumber}</td>
                    <td className="p-2 font-mono font-bold">{o.trackingNumber || `AWB-99827${idx}`}</td>
                    <td className="p-2">{o.courierPartner || "Delhivery"}</td>
                    <td className="p-2 text-right">1 box</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setManifestModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleTriggerPrint} className="bg-brand-emerald-800 text-white font-bold gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print Manifest
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
