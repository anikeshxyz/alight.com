"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  Printer,
  QrCode,
  FileText,
  AlertCircle,
  X,
  Send,
  Building,
  MapPin,
  Calendar,
} from "lucide-react";
import { getVendorOrdersApi, updateVendorOrderFulfillmentApi } from "@/services/order-service";
import {
  createVendorShipmentApi,
  getShippingLabelApi,
} from "@/services/logistics-service";
import { VendorOrder, FulfillmentStatus } from "@/types/order";
import { ShippingLabelDto } from "@/types/logistics";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const COURIER_PARTNERS = [
  { code: "DELHIVERY", name: "Delhivery Express" },
  { code: "BLUEDART", name: "Blue Dart Express" },
  { code: "SHIPROCKET", name: "Shiprocket Surface" },
  { code: "DTDC", name: "DTDC Courier" },
];

function VendorOrdersContent() {
  const { token, user } = useAuth();
  const { formatMoney } = useCurrency();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus || "ALL");
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);

  useEffect(() => {
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
  }, [urlStatus]);

  // Manual Status Update Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<FulfillmentStatus>("PROCESSING");
  const [courierPartner, setCourierPartner] = useState("Delhivery");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [fulfillmentNotes, setFulfillmentNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Automated Shipment Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchCarrier, setDispatchCarrier] = useState("DELHIVERY");
  const [dispatchWeight, setDispatchWeight] = useState("0.5");
  const [dispatchLength, setDispatchLength] = useState("15");
  const [dispatchWidth, setDispatchWidth] = useState("10");
  const [dispatchHeight, setDispatchHeight] = useState("5");
  const [isBookingShipment, setIsBookingShipment] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Thermal Shipping Label Modal
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [shippingLabel, setShippingLabel] = useState<ShippingLabelDto | null>(null);
  const [loadingLabel, setLoadingLabel] = useState(false);

  const fetchOrders = React.useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    const filter = statusFilter !== "ALL" ? (statusFilter as FulfillmentStatus) : undefined;
    getVendorOrdersApi(token, filter, 0, 30)
      .then((res) => {
        if (res.success && res.data) {
          setOrders(res.data.content);
        }
      })
      .catch((err) => console.error("Error loading vendor orders:", err))
      .finally(() => setIsLoading(false));
  }, [token, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenModal = (vo: VendorOrder) => {
    setSelectedOrder(vo);
    setEditStatus(vo.fulfillmentStatus || "PROCESSING");
    setCourierPartner(vo.courierPartner || "Delhivery");
    setTrackingNumber(vo.trackingNumber || "");
    setFulfillmentNotes(vo.notes || "");
    setModalOpen(true);
  };

  const handleSaveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedOrder) return;

    setIsUpdating(true);
    try {
      const res = await updateVendorOrderFulfillmentApi(
        selectedOrder.id,
        {
          fulfillmentStatus: editStatus,
          courierPartner: courierPartner.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          notes: fulfillmentNotes.trim() || undefined,
        },
        token
      );
      if (res.success) {
        setModalOpen(false);
        fetchOrders();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDispatchModal = (vo: VendorOrder) => {
    setSelectedOrder(vo);
    setBookingSuccessMsg(null);
    setDispatchModalOpen(true);
  };

  const handleBookShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedOrder) return;

    setIsBookingShipment(true);
    try {
      const res = await createVendorShipmentApi(
        {
          vendorOrderId: selectedOrder.id,
          carrierCode: dispatchCarrier,
          serviceType: "STANDARD",
          deadWeightGrams: Math.round(parseFloat(dispatchWeight || "0.5") * 1000),
          lengthCm: parseFloat(dispatchLength || "15"),
          widthCm: parseFloat(dispatchWidth || "10"),
          heightCm: parseFloat(dispatchHeight || "5"),
          pickupAddressLine1: "Central Warehouse Dispatch Bay 4",
          pickupCity: "Mumbai",
          pickupState: "Maharashtra",
          pickupPincode: "400001",
          pickupContactPhone: "+919876543210",
          recipientName: selectedOrder.masterOrder?.customerName || "Customer",
          recipientPhone: selectedOrder.masterOrder?.customerPhone || "+919999988888",
          recipientAddressLine1: "Customer Delivery Address",
          recipientCity: "New Delhi",
          recipientState: "Delhi",
          recipientPincode: "110001",
        },
        token
      );

      if (res.success && res.data) {
        setBookingSuccessMsg(`Consignment Booked! Carrier AWB: ${res.data.awbNumber}`);
        setTimeout(() => {
          setDispatchModalOpen(false);
          fetchOrders();
        }, 1200);
      }
    } catch (err) {
      console.error("Booking error", err);
    } finally {
      setIsBookingShipment(false);
    }
  };

  const handleViewShippingLabel = async (vo: VendorOrder) => {
    if (!token) return;
    setSelectedOrder(vo);
    setLabelModalOpen(true);
    setLoadingLabel(true);
    try {
      // Fetch label by package or order ID
      const res = await getShippingLabelApi(vo.id, token);
      if (res.success && res.data) {
        setShippingLabel(res.data);
      } else {
        const addr = (vo as any).masterOrder?.shippingAddress;
        const recipientCityState = addr ? `${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || ''}`.trim() : "";
        setShippingLabel({
          awbNumber: vo.trackingNumber || `AWB-${vo.subOrderNumber}`,
          orderNumber: vo.subOrderNumber,
          carrierCode: vo.courierPartner?.toUpperCase() || "STANDARD",
          carrierName: vo.courierPartner || "Standard Delivery",
          serviceType: "SURFACE",
          routingCode: "STANDARD-HUB",
          isCod: false,
          billedWeightGrams: 500,
          originName: user?.email || "Vendor Partner",
          originAddress: "Merchant Fulfillment Facility",
          originCityStatePincode: "India",
          originPhone: user?.phone || "",
          recipientName: (vo as any).masterOrder?.customerName || "Customer",
          recipientAddress: addr?.addressLine1 || "Customer Delivery Address",
          recipientCityStatePincode: recipientCityState,
          recipientPhone: (vo as any).masterOrder?.customerPhone || addr?.phoneNumber || "",
          barcodeData: `*${vo.trackingNumber || vo.subOrderNumber}*`,
          qrCodeData: `AWB:${vo.trackingNumber || vo.subOrderNumber}|ORDER:${vo.subOrderNumber}`,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch {
      setShippingLabel(null);
    } finally {
      setLoadingLabel(false);
    }
  };

  const getFulfillmentBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "SHIPPED":
      case "IN_TRANSIT":
        return <Badge variant="info">In Transit</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Processing / Packed</Badge>;
      case "CANCELLED":
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-slate-900 tracking-tight">
            Vendor Order Fulfillment & Logistics
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Book multi-carrier courier pickups, generate AWB waybills, print thermal 4x6 labels, and track deliveries.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-brand-slate-200 shadow-2xs">
          {["ALL", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-brand-burgundy text-white shadow-xs"
                  : "text-brand-slate-600 hover:text-brand-slate-900 hover:bg-brand-slate-50"
              }`}
            >
              {st === "ALL" ? "All Orders" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-brand-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-brand-slate-400">
            <div className="w-8 h-8 border-2 border-brand-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading order consignments...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-brand-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-brand-slate-300" />
            <p className="text-sm font-semibold text-brand-slate-700">No Orders Found</p>
            <p className="text-xs text-brand-slate-500">
              Orders assigned to your store will appear here for dispatch and logistics processing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-slate-50/80 border-b border-brand-slate-200 text-[11px] font-bold text-brand-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Sub-Order #</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Logistics / AWB</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-xs">
                {orders.map((vo) => (
                  <tr key={vo.id} className="hover:bg-brand-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-brand-slate-900 block">
                        {vo.subOrderNumber}
                      </span>
                      <span className="text-[10px] text-brand-slate-400">
                        {new Date(vo.createdAt).toLocaleDateString("en-IN", { dateStyle: "short" })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-brand-slate-800">
                        {vo.items?.length || 0} items
                      </span>
                      <div className="text-[11px] text-brand-slate-500 truncate max-w-[180px]">
                        {vo.items?.[0]?.productTitle || "Products"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-brand-slate-900">
                      {formatMoney(vo.grandTotal)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getFulfillmentBadge(vo.fulfillmentStatus)}
                    </td>

                    <td className="py-3.5 px-4">
                      {vo.trackingNumber ? (
                        <div className="space-y-0.5">
                          <Link
                            href={`/track?awb=${encodeURIComponent(vo.trackingNumber)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <Truck className="w-3 h-3" />
                            {vo.trackingNumber}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                          <span className="text-[10px] text-brand-slate-500 block">
                            via {vo.courierPartner || "Delhivery"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-brand-slate-400 italic text-[11px]">
                          Unmanifested
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {vo.trackingNumber ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewShippingLabel(vo)}
                            className="text-xs px-2.5 py-1 flex items-center gap-1 text-slate-700 hover:bg-slate-100"
                            title="Print 4x6 Shipping Label"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Label
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenDispatchModal(vo)}
                            className="text-xs px-2.5 py-1 flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Dispatch Courier
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(vo)}
                          className="text-xs p-1.5 text-brand-slate-500 hover:text-brand-slate-900"
                          title="Edit Status Manually"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automated Shipment Dispatch Modal */}
      {dispatchModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <div className="flex items-center gap-2 text-brand-slate-900 font-bold">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Book Courier Dispatch & Generate AWB</span>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-brand-slate-400 hover:text-brand-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {bookingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleBookShipment} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sub-Order Ref:</span>
                    <strong className="font-mono text-slate-900">{selectedOrder.subOrderNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Amount:</span>
                    <strong className="text-slate-900">{formatMoney(selectedOrder.grandTotal)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Carrier Integration</label>
                  <select
                    value={dispatchCarrier}
                    onChange={(e) => setDispatchCarrier(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {COURIER_PARTNERS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dead Weight (Kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={dispatchWeight}
                      onChange={(e) => setDispatchWeight(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dimensions (L x W x H cm)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="L"
                        value={dispatchLength}
                        onChange={(e) => setDispatchLength(e.target.value)}
                        className="w-1/3 p-2 text-center bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                      <input
                        type="number"
                        placeholder="W"
                        value={dispatchWidth}
                        onChange={(e) => setDispatchWidth(e.target.value)}
                        className="w-1/3 p-2 text-center bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                      <input
                        type="number"
                        placeholder="H"
                        value={dispatchHeight}
                        onChange={(e) => setDispatchHeight(e.target.value)}
                        className="w-1/3 p-2 text-center bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-[11px] leading-relaxed">
                  Booking will automatically assign an official <strong>Air Waybill (AWB)</strong>, register pickup manifest at your local hub, and update customer tracking timeline.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDispatchModalOpen(false)}
                    disabled={isBookingShipment}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isBookingShipment}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isBookingShipment ? "Generating AWB..." : "Confirm & Manifest"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Printable Thermal Shipping Label Modal */}
      {labelModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Printer className="w-4 h-4 text-brand-burgundy" />
                <span>Thermal Shipping Label (4x6 Format)</span>
              </div>
              <button
                onClick={() => setLabelModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingLabel || !shippingLabel ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-brand-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Rendering thermal layout...
              </div>
            ) : (
              <div className="space-y-4">
                {/* 4x6 Thermal Label Container */}
                <div
                  id="printable-shipping-label"
                  className="bg-white border-2 border-slate-900 p-4 rounded-lg font-sans text-slate-900 text-xs space-y-3 shadow-inner select-none"
                >
                  {/* Top Bar: Carrier & Routing Code */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                    <div>
                      <h2 className="text-base font-black tracking-tight uppercase">
                        {shippingLabel.carrierName}
                      </h2>
                      <span className="text-[10px] font-bold text-slate-600">
                        {shippingLabel.serviceType}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold block text-slate-500">ROUTING</span>
                      <span className="text-sm font-black font-mono">
                        {shippingLabel.routingCode || "DEL/HUB"}
                      </span>
                    </div>
                  </div>

                  {/* Barcode Simulated Visual */}
                  <div className="text-center py-2 border-b-2 border-slate-900 space-y-1">
                    <div className="h-12 bg-slate-900 flex items-center justify-center text-white tracking-[0.3em] font-mono font-bold text-xs uppercase px-2">
                      ||| | |||| || | ||||| ||| | ||| |||||
                    </div>
                    <p className="font-mono font-black text-sm tracking-wider">
                      AWB #{shippingLabel.awbNumber}
                    </p>
                  </div>

                  {/* Destination & Origin Details */}
                  <div className="grid grid-cols-2 gap-2 border-b-2 border-slate-900 pb-2">
                    <div className="border-r border-slate-300 pr-2 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">SHIP TO:</span>
                      <p className="font-bold text-[11px] leading-tight">{shippingLabel.recipientName}</p>
                      <p className="text-[10px] text-slate-700 leading-tight">{shippingLabel.recipientAddress}</p>
                      <p className="font-bold text-[11px] mt-1">{shippingLabel.recipientCityStatePincode}</p>
                      <p className="text-[10px] font-mono">Ph: {shippingLabel.recipientPhone}</p>
                    </div>

                    <div className="pl-1 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">RETURN IF UNDELIVERED:</span>
                      <p className="font-semibold text-[10px] leading-tight">{shippingLabel.originName}</p>
                      <p className="text-[10px] text-slate-700 leading-tight">{shippingLabel.originAddress}</p>
                      <p className="font-semibold text-[10px]">{shippingLabel.originCityStatePincode}</p>
                      <p className="text-[10px] font-mono">Ph: {shippingLabel.originPhone}</p>
                    </div>
                  </div>

                  {/* Package Metadata */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div>
                      <span>Weight: <strong>{(shippingLabel.billedWeightGrams / 1000).toFixed(2)} KG</strong></span>
                      <span className="ml-2">Order: <strong className="font-mono">{shippingLabel.orderNumber}</strong></span>
                    </div>
                    <div className="font-bold px-2 py-0.5 border border-slate-900 rounded">
                      {shippingLabel.isCod ? `COD: ₹${shippingLabel.codAmount}` : "PREPAID"}
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button variant="outline" size="sm" onClick={() => setLabelModalOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.print()}
                    className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    Print Thermal Label
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Status Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-brand-slate-900 border-b border-brand-slate-100 pb-2">
              Update Fulfillment - {selectedOrder.subOrderNumber}
            </h3>

            <form onSubmit={handleSaveFulfillment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-brand-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as FulfillmentStatus)}
                  className="w-full p-2.5 bg-brand-slate-50 border border-brand-slate-200 rounded-xl"
                >
                  <option value="PROCESSING">Processing / Packed</option>
                  <option value="SHIPPED">Shipped (Dispatched to Courier)</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-slate-700 mb-1">Courier Partner</label>
                <input
                  type="text"
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart, DTDC"
                  className="w-full p-2.5 bg-white border border-brand-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-slate-700 mb-1">AWB / Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DEL-88291048"
                  className="w-full p-2.5 bg-white border border-brand-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-brand-slate-100">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VendorOrdersContent />
    </Suspense>
  );
}
