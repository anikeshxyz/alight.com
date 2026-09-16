"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  RefreshCw,
  AlertTriangle,
  History,
  Building2,
  TrendingUp,
  Activity,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getGlobalInventoryAdminApi,
  getGlobalLowStockAdminApi,
  getGlobalTransactionsAdminApi,
} from "@/services/inventory-service";
import { WarehouseStock, InventoryTransaction } from "@/types/inventory";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<WarehouseStock[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<WarehouseStock[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "alerts" | "ledger">("matrix");

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const [invRes, alertRes, txRes] = await Promise.all([
        getGlobalInventoryAdminApi(token),
        getGlobalLowStockAdminApi(token),
        getGlobalTransactionsAdminApi(token, 0, 40),
      ]);

      if (invRes.success && invRes.data) setInventory(invRes.data);
      if (alertRes.success && alertRes.data) setLowStockAlerts(alertRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data.content);
    } catch (err) {
      console.error("Failed to load global inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOnHand = inventory.reduce((sum, item) => sum + item.quantityOnHand, 0);
  const totalReserved = inventory.reduce((sum, item) => sum + item.quantityReserved, 0);
  const totalAvailable = inventory.reduce((sum, item) => sum + item.quantityAvailable, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Global Inventory Telemetry</h1>
          <p className="text-xs text-brand-slate-500">
            Platform-wide stock distribution, safety threshold compliance, and real-time checkout reservation telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-slate-500">Global Units On-Hand</p>
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
              <p className="text-[11px] font-medium text-brand-slate-500">Active Checkout Holds</p>
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
              <p className="text-[11px] font-medium text-brand-slate-500">Low Stock Nodes</p>
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
              ? "border-brand-burgundy text-brand-burgundy"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Boxes className="w-3.5 h-3.5" /> All Locations Stock ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "alerts"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Reorder Triggers ({lowStockAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "ledger"
              ? "border-brand-burgundy text-brand-burgundy"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <History className="w-3.5 h-3.5" /> Global Audit Ledger ({transactions.length})
        </button>
      </div>

      {/* Tab: Matrix */}
      {activeTab === "matrix" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Fulfillment Warehouse</th>
                  <th className="px-4 py-3 text-center">On Hand</th>
                  <th className="px-4 py-3 text-center">Reserved</th>
                  <th className="px-4 py-3 text-center">Available</th>
                  <th className="px-4 py-3 text-center">Safety Buffer</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-slate-400">
                      Loading global inventory telemetry...
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-brand-slate-400">
                      <Boxes className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                      <p className="font-semibold text-brand-slate-700">No inventory allocated</p>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-brand-slate-50/60">
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
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">
                        {item.quantityAvailable}
                      </td>
                      <td className="px-4 py-3 text-center text-brand-slate-500 font-mono">
                        {item.safetyStock} / {item.reorderThreshold}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.quantityAvailable === 0 ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : item.lowStock ? (
                          <Badge variant="warning">Reorder Warning</Badge>
                        ) : (
                          <Badge variant="success">Optimal</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Low Stock */}
      {activeTab === "alerts" && (
        <Card className="p-6">
          <h2 className="font-bold text-brand-slate-900 text-sm mb-3">Reorder Threshold Triggers</h2>
          {lowStockAlerts.length === 0 ? (
            <div className="text-center py-8 text-emerald-600 font-semibold text-xs">
              All marketplace warehouse locations have sufficient stock levels!
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
                        Warehouse: <span className="font-medium text-brand-slate-800">{item.warehouseName}</span> ({item.warehouseCode})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-700 font-bold">
                      {item.quantityAvailable} available
                    </div>
                    <div className="text-[10px] text-brand-slate-400">
                      Reorder threshold: {item.reorderThreshold} units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Ledger */}
      {activeTab === "ledger" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-center">Delta</th>
                  <th className="px-4 py-3 text-center">Balance</th>
                  <th className="px-4 py-3">Reference / Notes</th>
                  <th className="px-4 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-brand-slate-400">
                      No transactions recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-slate-50/60">
                      <td className="px-4 py-3 text-brand-slate-400 text-[11px] whitespace-nowrap">
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
                      <td className="px-4 py-3 text-brand-slate-500 max-w-xs truncate">
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
    </div>
  );
}
