"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building,
  RefreshCw,
} from "lucide-react";
import { getPublicTrackingTimelineApi } from "@/services/logistics-service";
import { TrackingTimelineDto, ShipmentStatus } from "@/types/logistics";
import { Badge } from "@/components/ui/Badge";

function StatusBadge({ status }: { status: ShipmentStatus }) {
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
      return <Badge variant="neutral">Manifested / Label Created</Badge>;
    case "RTO_INITIATED":
    case "RTO_DELIVERED":
      return <Badge variant="warning">RTO in Progress</Badge>;
    case "FAILED_DELIVERY":
    case "CANCELLED":
      return <Badge variant="error">Failed / Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialAwb = searchParams.get("awb") || "";

  const [awbInput, setAwbInput] = useState(initialAwb);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TrackingTimelineDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (awb: string) => {
    if (!awb.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicTrackingTimelineApi(awb.trim());
      if (res.success && res.data) {
        setTimeline(res.data);
      } else {
        setError(res.message || "Unable to locate shipment package with the provided AWB number.");
        setTimeline(null);
      }
    } catch {
      setError("Network error fetching tracking details. Please try again.");
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAwb) {
      fetchTracking(initialAwb);
    }
  }, [initialAwb]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (awbInput.trim()) {
      fetchTracking(awbInput);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
            <Truck className="w-3.5 h-3.5" />
            Live Shipment Tracking
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Track Your Consignment
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto text-sm sm:text-base">
            Enter your Waybill / AWB tracking number to monitor live multi-carrier status and delivery checkpoints.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                placeholder="Enter AWB or Tracking ID (e.g. DEL-88291048, BLU-99210294)"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !awbInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  Track Order
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Sample Demos:</span>
            <button
              type="button"
              onClick={() => {
                setAwbInput("DEL-88291048");
                fetchTracking("DEL-88291048");
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition"
            >
              DEL-88291048 (Delhivery)
            </button>
            <button
              type="button"
              onClick={() => {
                setAwbInput("BLU-99210294");
                fetchTracking("BLU-99210294");
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition"
            >
              BLU-99210294 (Blue Dart)
            </button>
            <button
              type="button"
              onClick={() => {
                setAwbInput("SHP-77182910");
                fetchTracking("SHP-77182910");
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono transition"
            >
              SHP-77182910 (Shiprocket)
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="text-sm">
              <p className="font-semibold">Shipment Not Found</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Details Result */}
        {timeline && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">
                      AWB #{timeline.awbNumber}
                    </h2>
                    <StatusBadge status={timeline.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Carrier: <strong className="text-slate-700 font-medium">{timeline.carrierName} ({timeline.carrierCode})</strong></span>
                    {timeline.orderNumber && (
                      <>
                        <span>•</span>
                        <span>Order Ref: <strong className="text-slate-700 font-medium">{timeline.orderNumber}</strong></span>
                      </>
                    )}
                  </p>
                </div>

                {timeline.estimatedDeliveryDate && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-right sm:text-left flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold">Estimated Delivery</p>
                      <p className="text-sm font-bold text-emerald-950">
                        {new Date(timeline.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Transit Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                    <Building className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Origin Hub</p>
                    <p className="font-semibold text-slate-800">{timeline.originCity} ({timeline.originPincode})</p>
                    {timeline.dispatchedAt && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dispatched: {new Date(timeline.dispatchedAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Destination</p>
                    <p className="font-semibold text-slate-800">{timeline.recipientCity} ({timeline.recipientPincode})</p>
                    <p className="text-xs text-slate-500 mt-0.5">Recipient: {timeline.recipientName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkpoints Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Shipment Checkpoint Activity
              </h3>

              {timeline.events && timeline.events.length > 0 ? (
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timeline.events.map((event, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={event.id || idx} className="relative group">
                        {/* Dot */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            isLatest
                              ? "bg-indigo-600 border-indigo-200 ring-4 ring-indigo-50 text-white"
                              : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >
                          {event.status === "DELIVERED" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? "bg-white" : "bg-slate-400"}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-bold ${isLatest ? "text-indigo-950" : "text-slate-800"}`}>
                              {event.description}
                            </span>
                            <StatusBadge status={event.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {event.location}
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {new Date(event.eventTime).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No tracking events recorded yet. Package is awaiting courier pickup.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
