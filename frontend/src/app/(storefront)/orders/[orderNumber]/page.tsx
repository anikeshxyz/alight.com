"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Package,
  Truck,
  Store,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  RotateCcw,
  AlertCircle,
  Check,
} from "lucide-react";
import { getOrderByNumberApi } from "@/services/order-service";
import { paymentService } from "@/services/payment-service";
import { createReturnRequestApi } from "@/services/returns-service";
import { CreateRmaRequest, ReturnReason, ReturnType } from "@/types/returns";
import { Order, OrderStatus, FulfillmentStatus } from "@/types/order";
import { PaymentTransaction } from "@/types/payment";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Return/RMA Modal State
  const [isRmaModalOpen, setIsRmaModalOpen] = useState<boolean>(false);
  const [selectedVendorOrder, setSelectedVendorOrder] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<{ [itemId: string]: number }>({});
  const [returnReason, setReturnReason] = useState<ReturnReason>("SIZE_FIT_ISSUE");
  const [returnType, setReturnType] = useState<ReturnType>("REFUND");
  const [customerComments, setCustomerComments] = useState<string>("");
  const [proofImages, setProofImages] = useState<string>("");
  const [isSubmittingRma, setIsSubmittingRma] = useState<boolean>(false);
  const [rmaSuccessData, setRmaSuccessData] = useState<any>(null);

  const handleOpenRmaModal = (vo: any) => {
    setSelectedVendorOrder(vo);
    // Initialize item selection with 1 unit each
    const initial: { [itemId: string]: number } = {};
    vo.items.forEach((item: any) => {
      initial[item.id] = 1;
    });
    setReturnItems(initial);
    setRmaSuccessData(null);
    setIsRmaModalOpen(true);
  };

  const handleRmaSubmit = async () => {
    if (!order || !selectedVendorOrder || !token) return;

    const itemsToSubmit = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => {
        const orderItem = selectedVendorOrder.items.find((i: any) => i.id === orderItemId);
        return {
          orderItemId,
          productId: orderItem?.productId,
          variantId: orderItem?.variantId || undefined,
          quantity,
        };
      });

    if (itemsToSubmit.length === 0) {
      alert("Please select at least 1 item quantity to return");
      return;
    }

    setIsSubmittingRma(true);
    try {
      const payload: CreateRmaRequest = {
        orderId: order.id,
        vendorOrderId: selectedVendorOrder.id,
        returnType,
        reason: returnReason,
        customerComments,
        proofImages: proofImages || undefined,
        items: itemsToSubmit,
      };

      const res = await createReturnRequestApi(payload, token);
      if (res.success && res.data) {
        setRmaSuccessData(res.data);
      } else {
        alert(res.message || "Failed to submit return request");
      }
    } catch (e: any) {
      alert(e.message || "Error submitting return request");
    } finally {
      setIsSubmittingRma(false);
    }
  };

  useEffect(() => {
    if (!orderNumber) return;

    setIsLoading(true);
    getOrderByNumberApi(orderNumber, token || undefined)
      .then(async (res) => {
        if (res.success && res.data) {
          setOrder(res.data);
          try {
            const txRes = await paymentService.getOrderTransactions(res.data.id, token || undefined);
            if (txRes.success && txRes.data) {
              setTransactions(txRes.data);
            }
          } catch (e) {
            console.error("Could not load payment transactions:", e);
          }
        } else {
          setError(res.message || "Order not found");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load order details");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderNumber, token]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-brand-slate-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-3xl flex items-center justify-center mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-brand-slate-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-brand-slate-500 mb-6">{error || "Could not retrieve the requested order."}</p>
        <Link href="/">
          <Button variant="primary">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
      case "PLACED":
        return <Badge variant="info">Order Confirmed</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Processing in Hub</Badge>;
      case "SHIPPED":
        return <Badge variant="brand">Dispatched</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getFulfillmentBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case "PENDING":
      case "UNFULFILLED":
        return <Badge variant="neutral">Pending Dispatch</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Packing in Warehouse</Badge>;
      case "SHIPPED":
      case "IN_TRANSIT":
        return <Badge variant="brand">In Transit</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Top Banner / Confirmation */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/"
          className="text-xs font-semibold text-brand-slate-500 hover:text-brand-emerald-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print Tax Invoice</span>
          </Button>
        </div>
      </div>

      {/* Hero Confirmation Card */}
      <div className="bg-gradient-to-r from-brand-emerald-900 to-brand-emerald-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-emerald-800 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand-gold-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-brand-emerald-200 uppercase tracking-wider font-semibold">
                  Master Order Confirmation
                </span>
                {getOrderStatusBadge(order.status)}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <p className="text-xs sm:text-sm text-brand-emerald-100 mt-1">
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Today"} • Linked to {order.vendorOrders.length} manufacturer fulfillment node(s)
              </p>
            </div>
          </div>

          <div className="sm:text-right bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10">
            <span className="text-xs text-brand-emerald-200 block">Total Amount Paid</span>
            <span className="text-2xl sm:text-3xl font-black text-brand-gold-400">
              {formatMoney(order.totalAmount)}
            </span>
            <span className="text-[10px] text-brand-emerald-200 block mt-0.5">
              Payment via {order.paymentMethod} ({order.paymentStatus})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vendor Sub-Orders */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-brand-emerald-800" />
              <span>Multi-Vendor Sub-Orders & Dispatch Tracking</span>
            </h2>
            <span className="text-xs text-brand-slate-500 font-medium">
              {order.vendorOrders.length} Sub-Order(s)
            </span>
          </div>

          {order.vendorOrders.map((vo) => (
            <div
              key={vo.id}
              className="bg-white rounded-2xl border border-brand-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Sub-order Header */}
              <div className="bg-brand-slate-50 px-5 py-4 border-b border-brand-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-emerald-950 bg-brand-emerald-100/70 px-2 py-0.5 rounded">
                      {vo.subOrderNumber}
                    </span>
                    {getFulfillmentBadge(vo.fulfillmentStatus)}
                  </div>
                  <p className="text-xs text-brand-slate-600 mt-1 font-semibold flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-brand-slate-400" />
                    <span>Manufacturer: {vo.vendorStoreName}</span>
                    {vo.vendorState && (
                      <span className="text-[11px] text-brand-slate-400">({vo.vendorState} Hub)</span>
                    )}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-brand-slate-500 block">Sub-Order Total</span>
                  <span className="text-sm font-bold text-brand-slate-900">
                    {formatMoney(vo.subtotalAmount + vo.taxAmount + vo.shippingAmount)}
                  </span>
                </div>
              </div>

              {/* Courier & Tracking Details */}
              {(vo.courierPartner || vo.trackingNumber) && (
                <div className="bg-brand-emerald-50/50 border-b border-brand-emerald-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-brand-emerald-900 font-medium">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span>
                          Courier: <strong>{vo.courierPartner || "Blue Dart / Delhivery Express"}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          AWB: <strong className="font-mono text-indigo-700">{vo.trackingNumber}</strong>
                        </span>
                      </div>

                      <Link
                        href={`/track?awb=${encodeURIComponent(vo.trackingNumber || "")}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition border border-indigo-200"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Live Track Consignment
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>

                  {vo.shippedAt && (
                    <span className="text-brand-emerald-800 text-[11px] block mt-1">
                      Dispatched on {new Date(vo.shippedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  )}
                </div>
              )}

              {/* Line Items */}
              <div className="divide-y divide-brand-slate-100">
                {vo.items.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-brand-slate-200">
                      {item.primaryImageUrl ? (
                        <Image
                          src={item.primaryImageUrl}
                          alt={item.productTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-slate-400">
                          <ShoppingBag className="w-6 h-6 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-brand-slate-900 line-clamp-1">
                        {item.productTitle}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-brand-slate-600 bg-brand-slate-100 px-1.5 py-0.5 rounded">
                          {item.variantName || "Standard"}
                        </span>
                        <span className="text-[11px] text-brand-slate-400 font-mono">
                          SKU: {item.variantSku}
                        </span>
                      </div>
                      <p className="text-xs text-brand-slate-500 mt-1">
                        Qty: {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-brand-slate-900 block">
                        {formatMoney(item.totalAmount || item.unitPrice * item.quantity)}
                      </span>
                      {item.totalTaxAmount > 0 && (
                        <span className="text-[10px] text-brand-slate-400 block font-mono">
                          Incl. GST: {formatMoney(item.totalTaxAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-Order Actions Footer */}
              <div className="bg-brand-slate-50/70 border-t border-brand-slate-200 px-5 py-3 flex items-center justify-between text-xs">
                <span className="text-brand-slate-500 font-medium">
                  30-Day Hassle-Free Returns on Architectural Grade Fixtures
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenRmaModal(vo)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-brand-emerald-50 text-brand-emerald-800 border border-brand-emerald-200 rounded-xl font-semibold shadow-sm transition hover:border-brand-emerald-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Request Return / RMA</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Address & Summary Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shipping Details */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-brand-emerald-800" />
              <span>Delivery Address</span>
            </h3>
            {order.shippingAddress ? (
              <div className="text-xs text-brand-slate-600 space-y-1">
                <p className="font-bold text-brand-slate-900 text-sm">
                  {order.shippingAddress.fullName}
                </p>
                {order.shippingAddress.companyName && (
                  <p className="font-semibold text-brand-slate-700">
                    {order.shippingAddress.companyName}
                  </p>
                )}
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <p className="text-brand-slate-500">Phone: {order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-brand-slate-500">Standard Customer Address</p>
            )}
          </div>

          {/* Payment & GST Summary */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-brand-emerald-800" />
              <span>Payment & Financials</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-brand-slate-600">
                <span>Payment Mode</span>
                <span className="font-semibold text-brand-slate-900">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-brand-slate-600">
                <span>Payment Status</span>
                <span className="font-semibold text-brand-emerald-800">{order.paymentStatus}</span>
              </div>
              {transactions.length > 0 && (
                <div className="bg-brand-slate-50 p-2.5 rounded-lg border border-brand-slate-150 space-y-1 text-[11px]">
                  <div className="flex justify-between text-brand-slate-500">
                    <span>Gateway:</span>
                    <span className="font-mono font-medium text-brand-slate-700">
                      {transactions[0].gatewayType}
                    </span>
                  </div>
                  {(transactions[0].transactionReference || transactions[0].gatewayPaymentId) && (
                    <div className="flex justify-between text-brand-slate-500">
                      <span>Tx Reference:</span>
                      <span className="font-mono font-medium text-brand-slate-800">
                        {transactions[0].transactionReference || transactions[0].gatewayPaymentId}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {order.customerGstNumber && (
                <div className="flex justify-between text-brand-slate-600">
                  <span>Buyer GSTIN</span>
                  <span className="font-mono font-semibold text-brand-slate-900">
                    {order.customerGstNumber}
                  </span>
                </div>
              )}

              <div className="border-t border-brand-slate-100 pt-3 space-y-2">
                <div className="flex justify-between text-brand-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Wholesale Tier Savings</span>
                    <span>-{formatMoney(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-slate-600">
                  <span>Total Taxes (GST)</span>
                  <span>{formatMoney(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-brand-slate-600">
                  <span>Shipping & Handling</span>
                  <span>{order.shippingAmount === 0 ? "Free" : formatMoney(order.shippingAmount)}</span>
                </div>
                <div className="border-t border-brand-slate-200 pt-2 flex justify-between items-baseline font-bold text-sm text-brand-slate-900">
                  <span>Grand Total</span>
                  <span className="text-lg font-black text-brand-emerald-950">
                    {formatMoney(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return & RMA Request Modal */}
      {isRmaModalOpen && selectedVendorOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-brand-slate-200 relative animate-in fade-in zoom-in duration-150 my-8">
            <button
              onClick={() => setIsRmaModalOpen(false)}
              className="absolute top-6 right-6 text-brand-slate-400 hover:text-brand-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-slate-100"
            >
              ✕
            </button>

            {rmaSuccessData ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-brand-slate-900">
                  Return Request Submitted!
                </h3>
                <p className="text-sm text-brand-slate-600 max-w-md mx-auto">
                  Your return reference number is{" "}
                  <strong className="font-mono text-brand-emerald-800 font-bold">
                    {rmaSuccessData.rmaNumber}
                  </strong>
                  . The manufacturer ({selectedVendorOrder.vendorStoreName}) has been notified to review and schedule reverse pickup.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href={`/account/returns/${rmaSuccessData.rmaNumber}`}>
                    <Button variant="primary">
                      Track Return Status
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setIsRmaModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-emerald-800 uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4" />
                    <span>Return Merchandise Authorization (RMA)</span>
                  </div>
                  <h3 className="text-xl font-black text-brand-slate-900 mt-1">
                    Request Return for {selectedVendorOrder.subOrderNumber}
                  </h3>
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Select items and quantity you would like to return or exchange from {selectedVendorOrder.vendorStoreName}.
                  </p>
                </div>

                {/* Items to return */}
                <div className="border border-brand-slate-200 rounded-2xl p-4 divide-y divide-brand-slate-100 bg-brand-slate-50/50 space-y-3">
                  <span className="text-xs font-bold text-brand-slate-700 block">
                    Select Returned Items & Quantity:
                  </span>
                  {selectedVendorOrder.items.map((item: any) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-brand-slate-900 line-clamp-1">
                          {item.productTitle}
                        </p>
                        <p className="text-[11px] text-brand-slate-500 font-mono">
                          {item.variantName || "Standard"} • {formatMoney(item.unitPrice)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="text-xs text-brand-slate-600 font-medium">Return Qty:</label>
                        <select
                          value={returnItems[item.id] || 0}
                          onChange={(e) =>
                            setReturnItems({
                              ...returnItems,
                              [item.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-white border border-brand-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                        >
                          <option value="0">0 (Do not return)</option>
                          {Array.from({ length: item.quantity }, (_, i) => i + 1).map((qty) => (
                            <option key={qty} value={qty}>
                              {qty} unit{qty > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reason & Return Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                      Reason for Return *
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                      className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                    >
                      <option value="SIZE_FIT_ISSUE">Size or Dimension Incompatible</option>
                      <option value="DEFECTIVE">Manufacturing Defect / Non-functional</option>
                      <option value="DAMAGED_IN_TRANSIT">Damaged during courier transit</option>
                      <option value="WRONG_ITEM_SENT">Incorrect item delivered</option>
                      <option value="NOT_AS_DESCRIBED">Item different from catalog listing</option>
                      <option value="CHANGED_MIND">No longer needed / Changed mind</option>
                      <option value="OTHER">Other / Miscellaneous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                      Preferred Resolution *
                    </label>
                    <select
                      value={returnType}
                      onChange={(e) => setReturnType(e.target.value as ReturnType)}
                      className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                    >
                      <option value="REFUND">Full Refund to Original Payment Source</option>
                      <option value="REPLACEMENT">Direct Replacement with New Unit</option>
                      <option value="STORE_CREDIT">Alight Marketplace Wallet Credit</option>
                    </select>
                  </div>
                </div>

                {/* Customer Comments */}
                <div>
                  <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                    Condition Notes & Comments
                  </label>
                  <textarea
                    rows={2}
                    value={customerComments}
                    onChange={(e) => setCustomerComments(e.target.value)}
                    placeholder="Describe condition of the packaging, seals, or defect details..."
                    className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                </div>

                {/* Photo Proof */}
                <div>
                  <ImageUploadDropzone
                    label="Attach Defect or Packaging Photos (Optional)"
                    helperText="Upload damage proof or packaging photos for fast vendor claim approval"
                    multiple={false}
                    value={proofImages}
                    onChange={(url) => setProofImages(typeof url === "string" ? url : url[0] || "")}
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRmaModalOpen(false)}
                    disabled={isSubmittingRma}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRmaSubmit}
                    isLoading={isSubmittingRma}
                  >
                    Submit Return Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
