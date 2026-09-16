"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  History,
  Building2,
  TrendingDown,
  TrendingUp,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  getVendorInventoryApi,
  getVendorWarehousesApi,
  getVendorLowStockAlertsApi,
  adjustStockApi,
  transferStockApi,
  getVendorTransactionsApi,
} from "@/services/inventory-service";
import {
  Warehouse,
  WarehouseStock,
  InventoryTransaction,
  TransactionType,
  StockAdjustmentPayload,
  StockTransferPayload,
} from "@/types/inventory";

export default function VendorInventoryPage() {
  const [inventory, setInventory] = useState<WarehouseStock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<WarehouseStock[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "alerts" | "ledger">("matrix");

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<WarehouseStock | null>(null);
  const [adjustType, setAdjustType] = useState<TransactionType>("INBOUND_RECEIPT");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustRefType, setAdjustRefType] = useState("PURCHASE_ORDER");
  const [adjustRefId, setAdjustRefId] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferStockItem, setTransferStockItem] = useState<WarehouseStock | null>(null);
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [transferQty, setTransferQty] = useState<number>(5);
  const [transferNotes, setTransferNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const [invRes, whRes, alertRes, txRes] = await Promise.all([
        getVendorInventoryApi(token),
        getVendorWarehousesApi(token),
        getVendorLowStockAlertsApi(token),
        getVendorTransactionsApi(token, 0, 30),
      ]);

      if (invRes.success && invRes.data) setInventory(invRes.data);
      if (whRes.success && whRes.data) setWarehouses(whRes.data);
      if (alertRes.success && alertRes.data) setLowStockAlerts(alertRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data.content);
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjustModal = (item: WarehouseStock) => {
    setSelectedStock(item);
    setAdjustType("INBOUND_RECEIPT");
    setAdjustQty(10);
    setAdjustRefType("PURCHASE_ORDER");
    setAdjustRefId("");
    setAdjustNotes("");
    setErrorMsg(null);
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    if (adjustQty <= 0) {
      setErrorMsg("Quantity must be greater than 0");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const payload: StockAdjustmentPayload = {
        warehouseId: selectedStock.warehouseId,
        productId: selectedStock.productId,
        variantId: selectedStock.variantId || undefined,
        transactionType: adjustType,
        quantity: adjustQty,
        referenceType: adjustRefType || undefined,
        referenceId: adjustRefId.trim() || undefined,
        notes: adjustNotes.trim() || undefined,
      };

      const res = await adjustStockApi(payload, token);
      if (res.success) {
        setAdjustModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.message || "Failed to adjust stock");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e.message || "Unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const openTransferModal = (item: WarehouseStock) => {
    setTransferStockItem(item);
    const otherWh = warehouses.find((w) => w.id !== item.warehouseId);
    setTargetWarehouseId(otherWh ? otherWh.id : "");
    setTransferQty(Math.min(item.quantityAvailable, 5));
    setTransferNotes("");
    setErrorMsg(null);
    setTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStockItem || !targetWarehouseId) return;
    if (transferQty <= 0 || transferQty > transferStockItem.quantityAvailable) {
      setErrorMsg(`Transfer quantity must be between 1 and ${transferStockItem.quantityAvailable}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const payload: StockTransferPayload = {
        sourceWarehouseId: transferStockItem.warehouseId,
        destinationWarehouseId: targetWarehouseId,
        productId: transferStockItem.productId,
        variantId: transferStockItem.variantId || undefined,
        quantity: transferQty,
        notes: transferNotes.trim() || undefined,
      };

      const res = await transferStockApi(payload, token);
      if (res.success) {
        setTransferModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.message || "Failed to transfer stock");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e.message || "Unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const totalOnHand = inventory.reduce((sum, item) => sum + item.quantityOnHand, 0);
  const totalReserved = inventory.reduce((sum, item) => sum + item.quantityReserved, 0);
  const totalAvailable = inventory.reduce((sum, item) => sum + item.quantityAvailable, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Multi-Warehouse Inventory</h1>
          <p className="text-xs text-brand-slate-500">
            Real-time stock ledger, cross-location transfers, safety buffers, and audit transaction logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Total On-Hand</p>
              <p className="text-xl font-bold text-brand-slate-900">{totalOnHand}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Reserved (Checkout)</p>
              <p className="text-xl font-bold text-amber-600">{totalReserved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Available to Sell</p>
              <p className="text-xl font-bold text-emerald-600">{totalAvailable}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Low Stock Alerts</p>
              <p className="text-xl font-bold text-rose-600">{lowStockAlerts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "matrix"
              ? "border-brand-emerald-800 text-brand-emerald-800 font-bold"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Boxes className="w-3.5 h-3.5" /> Stock Matrix ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "alerts"
              ? "border-rose-500 text-rose-600 font-bold"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Low-Stock Warnings ({lowStockAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "ledger"
              ? "border-brand-emerald-800 text-brand-emerald-800 font-bold"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <History className="w-3.5 h-3.5" /> Transaction Audit Ledger
        </button>
      </div>

      {/* Tab: Stock Matrix */}
      {activeTab === "matrix" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse Hub</th>
                  <th className="px-4 py-3 text-center">On Hand</th>
                  <th className="px-4 py-3 text-center">Reserved</th>
                  <th className="px-4 py-3 text-center">Available</th>
                  <th className="px-4 py-3 text-center">Reorder Point</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-slate-400">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-brand-slate-400">
                      <Boxes className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                      <p className="font-semibold text-brand-slate-700">No inventory records allocated</p>
                      <p className="text-xs text-brand-slate-400 mt-1">
                        Register a warehouse and create products to track multi-node stock.
                      </p>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-brand-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-brand-slate-900">{item.productTitle}</div>
                        <div className="text-[11px] font-mono text-brand-slate-400">
                          {item.variantName ? `${item.variantSku} (${item.variantName})` : item.productSku}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-brand-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-brand-slate-400" />
                          {item.warehouseName}
                        </div>
                        <div className="text-[10px] font-mono text-brand-slate-400">{item.warehouseCode}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-brand-slate-800">
                        {item.quantityOnHand}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">
                        {item.quantityReserved}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block font-bold px-2 py-0.5 rounded ${
                            item.quantityAvailable === 0
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : item.lowStock
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {item.quantityAvailable}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-brand-slate-500 font-mono">
                        {item.reorderThreshold}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1 px-2 h-auto"
                            onClick={() => openAdjustModal(item)}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Adjust Stock
                          </Button>
                          {warehouses.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] py-1 px-2 h-auto text-blue-600 hover:bg-blue-50"
                              onClick={() => openTransferModal(item)}
                              disabled={item.quantityAvailable === 0}
                            >
                              <ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Low Stock Warnings */}
      {activeTab === "alerts" && (
        <Card className="p-6">
          <h2 className="font-bold text-brand-slate-900 text-sm mb-3">Reorder Threshold Triggers</h2>
          {lowStockAlerts.length === 0 ? (
            <div className="text-center py-8 text-emerald-600 font-semibold text-xs">
              All inventory levels are healthy and above minimum safety stock buffers!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-brand-slate-900">{item.productTitle}</span>
                      <div className="text-brand-slate-500 text-[11px]">
                        Located at: <span className="font-medium text-brand-slate-800">{item.warehouseName}</span> ({item.warehouseCode})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-amber-700 font-bold">
                        {item.quantityAvailable} units available
                      </div>
                      <div className="text-[10px] text-brand-slate-400">
                        Reorder trigger: {item.reorderThreshold} units
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openAdjustModal(item)}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Restock Intake
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Transaction Ledger */}
      {activeTab === "ledger" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-center">Change</th>
                  <th className="px-4 py-3 text-center">Balance</th>
                  <th className="px-4 py-3">Reference / Notes</th>
                  <th className="px-4 py-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-brand-slate-400">
                      No transaction history recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-slate-50/60">
                      <td className="px-4 py-3 text-brand-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            tx.transactionType.includes("INBOUND") || tx.transactionType.includes("ADD")
                              ? "success"
                              : tx.transactionType.includes("OUTBOUND") || tx.transactionType.includes("DAMAGE")
                              ? "danger"
                              : "neutral"
                          }
                        >
                          {tx.transactionType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brand-slate-900">{tx.productTitle}</div>
                        <div className="text-[10px] font-mono text-brand-slate-400">{tx.productSku}</div>
                      </td>
                      <td className="px-4 py-3 text-brand-slate-600">{tx.warehouseCode}</td>
                      <td
                        className={`px-4 py-3 text-center font-bold font-mono ${
                          tx.quantityChange > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-brand-slate-600">
                        {tx.quantityBefore} &rarr; <span className="font-bold">{tx.quantityAfter}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-brand-slate-500">
                        {tx.referenceId && (
                          <span className="font-mono text-[10px] bg-brand-slate-100 px-1.5 py-0.5 rounded mr-1">
                            {tx.referenceId}
                          </span>
                        )}
                        {tx.notes}
                      </td>
                      <td className="px-4 py-3 text-brand-slate-500 text-[11px]">{tx.performedByName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Audited Stock Adjustment"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs text-brand-slate-700">
          <div className="p-3 bg-brand-slate-50 rounded-lg border border-brand-slate-200">
            <div className="font-bold text-brand-slate-900">{selectedStock?.productTitle}</div>
            <div className="text-[11px] text-brand-slate-500 mt-0.5 flex justify-between">
              <span>Warehouse: {selectedStock?.warehouseName} ({selectedStock?.warehouseCode})</span>
              <span>Available: <strong>{selectedStock?.quantityAvailable}</strong> units</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Adjustment Type *
            </label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as TransactionType)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            >
              <option value="INBOUND_RECEIPT">Inbound Purchase Receipt (Add Stock)</option>
              <option value="ADJUSTMENT_ADD">Manual Cycle Count Increase (Add Stock)</option>
              <option value="ADJUSTMENT_SUBTRACT">Manual Cycle Count Correction (Deduct Stock)</option>
              <option value="DAMAGE_WRITE_OFF">Damaged / Defective Write-Off (Deduct Stock)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Reference Document
              </label>
              <select
                value={adjustRefType}
                onChange={(e) => setAdjustRefType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              >
                <option value="PURCHASE_ORDER">Purchase Order (PO)</option>
                <option value="SUPPLIER_INVOICE">Supplier Invoice</option>
                <option value="PHYSICAL_AUDIT">Physical Cycle Audit</option>
                <option value="DAMAGE_REPORT">Damage Report</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Reference ID / Doc #
              </label>
              <input
                type="text"
                placeholder="e.g. PO-2026-991"
                value={adjustRefId}
                onChange={(e) => setAdjustRefId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Audit Notes
            </label>
            <textarea
              rows={2}
              placeholder="Reason for adjustment, lot batch number, or inspection notes..."
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Stock */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Inter-Warehouse Stock Transfer"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs text-brand-slate-700">
          <div className="p-3 bg-brand-slate-50 rounded-lg border border-brand-slate-200">
            <div className="font-bold text-brand-slate-900">{transferStockItem?.productTitle}</div>
            <div className="text-[11px] text-brand-slate-500 mt-1 flex justify-between">
              <span>Origin Hub: <strong>{transferStockItem?.warehouseName}</strong></span>
              <span>Available to Move: <strong>{transferStockItem?.quantityAvailable}</strong> units</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Destination Warehouse *
            </label>
            <select
              value={targetWarehouseId}
              onChange={(e) => setTargetWarehouseId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            >
              {warehouses
                .filter((w) => w.id !== transferStockItem?.warehouseId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) - {w.city}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Transfer Quantity *
            </label>
            <input
              type="number"
              min="1"
              max={transferStockItem?.quantityAvailable || 1}
              value={transferQty}
              onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Transfer Notes / Dispatch Manifest
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Courier consignment #BLR-MUM-882, expedited road freight..."
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Initiate Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
