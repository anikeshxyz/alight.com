"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Play,
  RefreshCw,
  Search,
  Filter,
  Layers,
  MapPin,
  Building,
  Radio,
  Sliders,
  Send,
  Zap,
} from "lucide-react";
import {
  getAdminLogisticsOverviewApi,
  getAdminShipmentsApi,
  getAdminCarriersApi,
  toggleCarrierStatusApi,
  dispatchCheckpointCheckpointApi,
} from "@/services/logistics-service";
import {
  LogisticsOverviewDto,
  ShipmentPackageDto,
  ShippingCarrier,
  ShipmentStatus,
} from "@/types/logistics";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminLogisticsPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [overview, setOverview] = useState<LogisticsOverviewDto | null>(null);
  const [shipments, setShipments] = useState<ShipmentPackageDto[]>([]);
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Checkpoint Simulator State
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentPackageDto | null>(null);
  const [simStatus, setSimStatus] = useState<ShipmentStatus>("IN_TRANSIT");
  const [simHub, setSimHub] = useState("National Sort Facility Hub 01, Delhi");
  const [simRemarks, setSimRemarks] = useState("Scanned at sort terminal for onwards transport");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ovRes, shipRes, carRes] = await Promise.all([
        getAdminLogisticsOverviewApi(token),
        getAdminShipmentsApi(token, 0, 50),
        getAdminCarriersApi(token),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (shipRes.success && shipRes.data) setShipments(shipRes.data.content);
      if (carRes.success && carRes.data) setCarriers(carRes.data);
    } catch (err) {
      console.error("Error loading admin logistics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleToggleCarrier = async (carrierId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      const res = await toggleCarrierStatusApi(carrierId, !currentStatus, token);
      if (res.success) {
        setCarriers((prev) =>
          prev.map((c) => (c.id === carrierId ? { ...c, isActive: !currentStatus } : c))
        );
      }
    } catch (err) {
      console.error("Failed to toggle carrier:", err);
    }
  };

  const handleOpenSimulator = (shipment: ShipmentPackageDto) => {
    setSelectedShipment(shipment);
    setSimSuccessMsg(null);
    if (shipment.status === "MANIFESTED") {
      setSimStatus("PICKED_UP");
      setSimHub(`${shipment.originCity} Vendor Dispatch Hub`);
      setSimRemarks("Courier pickup completed from vendor dock");
    } else if (shipment.status === "PICKED_UP") {
      setSimStatus("IN_TRANSIT");
      setSimHub("National Sort Facility Hub 01");
      setSimRemarks("Package processed and transiting to destination hub");
    } else if (shipment.status === "IN_TRANSIT") {
      setSimStatus("OUT_FOR_DELIVERY");
      setSimHub(`${shipment.recipientCity} Delivery Station`);
      setSimRemarks("Out with delivery executive for doorstep delivery");
    } else {
      setSimStatus("DELIVERED");
      setSimHub(`${shipment.recipientCity} Doorstep`);
      setSimRemarks("Package successfully delivered and signed by customer");
    }
    setSimModalOpen(true);
  };

  const handleDispatchSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedShipment) return;

    setIsSimulating(true);
    try {
      const res = await dispatchCheckpointCheckpointApi(
        selectedShipment.awbNumber,
        {
          status: simStatus,
          location: simHub,
          description: simRemarks,
        },
        token
      );

      if (res.success) {
        setSimSuccessMsg(
          simStatus === "DELIVERED"
            ? "Checkpoint recorded! DELIVERED status automatically triggered Escrow Release for Vendor Settlement!"
            : `Checkpoint [${simStatus}] dispatched successfully.`
        );
        setTimeout(() => {
          setSimModalOpen(false);
          loadData();
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to simulate checkpoint:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      s.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge variant="brand">Out for Delivery</Badge>;
      case "IN_TRANSIT":
        return <Badge variant="info">In Transit</Badge>;
      case "PICKED_UP":
        return <Badge variant="primary">Picked Up</Badge>;
      case "MANIFESTED":
        return <Badge variant="neutral">Manifested</Badge>;
      case "RTO_INITIATED":
      case "RTO_DELIVERED":
        return <Badge variant="warning">RTO</Badge>;
      case "FAILED_DELIVERY":
      case "CANCELLED":
        return <Badge variant="error">Failed/Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-brand-slate-900 tracking-tight">
              Logistics & Carrier Network Desk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              Stage 9 Operations
            </span>
          </div>
          <p className="text-xs text-brand-slate-500 mt-1">
            Real-time fleet monitoring, multi-carrier serviceability adapters, checkpoint simulator, and automated delivery escrow bridge.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/track" target="_blank">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              Public Tracking Portal
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Fleet
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-semibold">
            <span>Total Shipments</span>
            <Package className="w-4 h-4 text-brand-burgundy" />
          </div>
          <div className="text-2xl font-black text-brand-slate-900">
            {overview?.totalShipments ?? shipments.length}
          </div>
          <p className="text-[10px] text-slate-400">All manifested consignments</p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-semibold">
            <span>Active In-Transit</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {overview?.activeInTransit ?? shipments.filter((s) => s.status === "IN_TRANSIT" || s.status === "PICKED_UP").length}
          </div>
          <p className="text-[10px] text-slate-400">Currently traversing hubs</p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-semibold">
            <span>Delivered & Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {overview?.deliveredCount ?? shipments.filter((s) => s.status === "DELIVERED").length}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">Escrow Released</p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-semibold">
            <span>Active Carrier Adapters</span>
            <Radio className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {carriers.filter((c) => c.isActive).length} / {carriers.length || 5}
          </div>
          <p className="text-[10px] text-slate-400">Delhivery, Blue Dart, Shiprocket, DTDC</p>
        </Card>
      </div>

      {/* Integrated Carrier Network Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-burgundy" />
          Multi-Carrier Logistics Adapters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {carriers.map((carrier) => (
            <div
              key={carrier.id}
              className={`p-4 rounded-xl border transition ${
                carrier.isActive
                  ? "bg-white border-slate-200 shadow-2xs"
                  : "bg-slate-50/80 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">{carrier.carrierName}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    carrier.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  }`}
                />
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase">{carrier.carrierCode}</p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {carrier.isActive ? "Online / Integrated" : "Disabled"}
                </span>
                <button
                  onClick={() => handleToggleCarrier(carrier.id, carrier.isActive)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    carrier.isActive
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {carrier.isActive ? "Pause" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Consignments & Checkpoint Simulator Table */}
      <div className="bg-white rounded-2xl border border-brand-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Consignments & Transit Checkpoints</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search AWB, Order, Recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="MANIFESTED">Manifested</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <th className="py-2.5 px-3">AWB / Waybill</th>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Carrier</th>
                <th className="py-2.5 px-3">Route (Origin → Dest)</th>
                <th className="py-2.5 px-3">Billed Wt</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions & Checkpoint Simulator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No shipments match the current query or filter.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3">
                      <Link
                        href={`/track?awb=${encodeURIComponent(s.awbNumber)}`}
                        target="_blank"
                        className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                      >
                        {s.awbNumber}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(s.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-800 font-medium">
                      {s.orderNumber}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{s.carrierName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{s.carrierCode}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-800 font-medium">
                        {s.originCity} ({s.originPincode}) → {s.recipientCity} ({s.recipientPincode})
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                        To: {s.recipientName}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {(s.billedWeightGrams / 1000).toFixed(2)} Kg
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(s.status)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSimulator(s)}
                        className="text-xs px-2.5 py-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50 inline-flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-indigo-600" />
                        Dispatch Checkpoint
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkpoint Simulator Modal */}
      {simModalOpen && selectedShipment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Simulate Carrier Checkpoint Dispatch</span>
              </div>
              <button
                onClick={() => setSimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {simSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{simSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleDispatchSimulation} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>AWB Waybill:</span>
                    <strong className="font-mono text-indigo-700">{selectedShipment.awbNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Carrier:</span>
                    <strong className="text-slate-900">{selectedShipment.carrierName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Status:</span>
                    <Badge variant="neutral">{selectedShipment.status}</Badge>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Checkpoint Status</label>
                  <select
                    value={simStatus}
                    onChange={(e) => setSimStatus(e.target.value as ShipmentStatus)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="PICKED_UP">PICKED_UP (Courier Pickup Dock)</option>
                    <option value="IN_TRANSIT">IN_TRANSIT (Regional Sort Hub)</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Last-Mile Station)</option>
                    <option value="DELIVERED">DELIVERED (Doorstep Handover - Auto Triggers Escrow)</option>
                    <option value="RTO_INITIATED">RTO_INITIATED (Return to Origin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location Hub</label>
                  <input
                    type="text"
                    value={simHub}
                    onChange={(e) => setSimHub(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Remarks & Courier Scan Log</label>
                  <textarea
                    rows={2}
                    value={simRemarks}
                    onChange={(e) => setSimRemarks(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {simStatus === "DELIVERED" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                    ✨ <strong>Automated Escrow Trigger:</strong> Selecting <code>DELIVERED</code> will invoke the marketplace escrow settlement pipeline and release held funds to the vendor balance.
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSimModalOpen(false)}
                    disabled={isSimulating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSimulating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSimulating ? "Dispatching..." : "Record Checkpoint"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
