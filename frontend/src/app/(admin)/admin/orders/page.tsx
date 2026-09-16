"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Edit,
  ExternalLink,
} from "lucide-react";
import { getAllOrdersAdminApi, updateOrderStatusAdminApi } from "@/services/order-service";
import { Order, OrderStatus } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Status Change State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("CONFIRMED");
  const [modalOpen, setModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = () => {
    if (!token) return;
    setIsLoading(true);
    const filter = statusFilter !== "ALL" ? (statusFilter as OrderStatus) : undefined;
    getAllOrdersAdminApi(token, filter, currentPage, 15)
      .then((res) => {
        if (res.success && res.data) {
          setOrders(res.data.content);
          setTotalPages(res.data.totalPages);
        }
      })
      .catch((err) => console.error("Error loading admin orders:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter, currentPage]);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedOrder) return;

    setIsUpdating(true);
    try {
      const res = await updateOrderStatusAdminApi(selectedOrder.id, newStatus, token);
      if (res.success) {
        setModalOpen(false);
        fetchOrders();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
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
      case "REFUNDED":
        return <Badge variant="neutral">Refunded</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-slate-900">
            Global Master Orders Explorer
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Platform-wide customer master orders, GST split analysis, and vendor sub-order oversight
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-brand-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-brand-slate-500">Loading marketplace orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-brand-slate-500">
            <Package className="w-10 h-10 mx-auto text-brand-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-brand-slate-700">No Orders Found</h3>
            <p className="text-xs text-brand-slate-400 mt-1">No orders match the current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 text-brand-slate-600 font-semibold border-b border-brand-slate-200">
                <tr>
                  <th className="py-3 px-4">Master Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sub-Orders</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Tax (GST)</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-emerald-950">
                      {o.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-brand-slate-900 block">{o.customerName}</span>
                        <span className="text-[11px] text-brand-slate-500 block">{o.customerEmail}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getOrderStatusBadge(o.status)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-brand-slate-700 bg-brand-slate-100 px-2 py-0.5 rounded">
                        {o.vendorOrders?.length || 0} Vendor Node(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{formatMoney(o.subtotalAmount)}</td>
                    <td className="py-3.5 px-4">{formatMoney(o.taxAmount)}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-slate-900">
                      {formatMoney(o.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStatusModal(o)}
                          className="rounded-lg text-xs font-semibold"
                        >
                          Status
                        </Button>
                        <Link href={`/orders/${o.orderNumber}`}>
                          <Button variant="outline" size="sm" className="rounded-lg text-xs font-semibold">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-brand-slate-600 px-2">
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

      {/* Status Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-brand-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-brand-slate-900 mb-1">Override Master Order Status</h3>
            <p className="text-xs text-brand-slate-500 mb-4 font-mono">{selectedOrder.orderNumber}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 bg-white"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isUpdating} className="rounded-xl font-bold">
                  {isUpdating ? "Saving..." : "Save Override"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
