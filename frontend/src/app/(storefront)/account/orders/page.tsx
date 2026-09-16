"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
} from "lucide-react";
import { getCustomerOrdersApi } from "@/services/order-service";
import { Order, OrderStatus } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const STATUS_FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: "All Orders", value: undefined },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function CustomerOrdersPage() {
  const { token, user } = useAuth();
  const { formatMoney } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getCustomerOrdersApi(token, currentPage, 10, selectedFilter)
      .then((res) => {
        if (res.success && res.data) {
          setOrders(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
        }
      })
      .catch((err) => console.error("Failed to fetch orders:", err))
      .finally(() => setIsLoading(false));
  }, [token, currentPage, selectedFilter]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
      case "PLACED":
        return <Badge variant="info">Confirmed</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Processing</Badge>;
      case "SHIPPED":
        return <Badge variant="brand">Shipped</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Orders & Shipments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time fulfillment across all marketplace vendor partners
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/account/returns">
            <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RMA Returns</span>
            </Button>
          </Link>
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>B2B RFQs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {STATUS_FILTERS.map((f) => {
          const active = selectedFilter === f.value;
          return (
            <button
              key={f.label}
              onClick={() => {
                setSelectedFilter(f.value);
                setCurrentPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                active
                  ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Orders Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            {selectedFilter
              ? `You do not have any orders currently marked as ${selectedFilter}.`
              : "You have not placed any orders yet. Discover our premium hardware catalog."}
          </p>
          <Link href="/">
            <Button variant="primary" size="sm">
              Explore Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              {/* Top Order Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    #{order.orderNumber}
                  </span>
                  {getStatusBadge(order.status)}
                  <span className="text-xs text-slate-400">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Grand Total:
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatMoney(order.totalAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Multi-Vendor Sub-Orders Breakdown */}
              <div className="space-y-2">
                {order.vendorOrders && order.vendorOrders.length > 0 ? (
                  order.vendorOrders.map((vo) => (
                    <div
                      key={vo.id}
                      className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            Vendor: {vo.vendorStoreName || "Alight Merchant"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Sub-order #{vo.subOrderNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {vo.items?.map((it) => `${it.productTitle} (×${it.quantity})`).join(", ")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Badge variant="neutral" size="sm">
                          {vo.fulfillmentStatus}
                        </Badge>
                        <Link href={`/orders/${order.orderNumber}`}>
                          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                            Track Sub-order
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">
                    {order.items?.map((it) => `${it.productTitle} (Qty: ${it.quantity})`).join(", ")}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Payment: <strong className="text-slate-700">{order.paymentMethod || "Prepaid"}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Link href={`/account/returns?orderNumber=${order.orderNumber}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-emerald-800 h-8">
                      Return Item
                    </Button>
                  </Link>
                  <Link href={`/orders/${order.orderNumber}`}>
                    <Button variant="primary" size="sm" className="text-xs flex items-center gap-1 h-8">
                      <span>View Full Order</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage + 1 >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
