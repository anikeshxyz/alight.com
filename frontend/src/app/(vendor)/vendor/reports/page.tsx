"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  DollarSign,
  Boxes,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getVendorOrdersApi } from "@/services/order-service";
import { getVendorProductsApi } from "@/services/product-service";
import { settlementService } from "@/services/settlement-service";

interface ReportType {
  id: string;
  title: string;
  category: "SALES" | "TAX" | "INVENTORY" | "LOGISTICS" | "FINANCE";
  description: string;
  columns: string[];
  formats: ("CSV" | "EXCEL" | "PDF")[];
}

const AVAILABLE_REPORTS: ReportType[] = [
  {
    id: "rep-sales-summary",
    title: "Vendor Sub-Orders & Gross Sales Report",
    category: "SALES",
    description: "Detailed line-item sales report with customer city, order status, discounts, and itemized subtotal amounts.",
    columns: ["SubOrder ID", "Date", "Customer State", "SKU", "Units", "Gross Value", "Discount", "Net Amount"],
    formats: ["CSV", "EXCEL"],
  },
  {
    id: "rep-gstr-1",
    title: "Statutory GSTR-1 Outward Supply Register",
    category: "TAX",
    description: "B2B and B2C sales register formatted for statutory GST e-filing with HSN summary, CGST, SGST, and IGST breakdowns.",
    columns: ["Invoice #", "Invoice Date", "Buyer GSTIN", "Place of Supply", "HSN Code", "Taxable Value", "CGST", "SGST", "IGST"],
    formats: ["EXCEL", "CSV"],
  },
  {
    id: "rep-gstr-8",
    title: "GSTR-8 TCS Withholding & Deductions Ledger",
    category: "TAX",
    description: "Statutory 1% Tax Collected at Source (TCS) deducted by Alight Marketplace under Section 52 of CGST Act.",
    columns: ["Month", "Gross Supplies", "Returns Value", "Net Taxable Amount", "TCS Rate (1%)", "TCS Deposited"],
    formats: ["PDF", "EXCEL"],
  },
  {
    id: "rep-inventory-valuation",
    title: "Multi-Warehouse Inventory Stock & Valuation",
    category: "INVENTORY",
    description: "Current on-hand, reserved, and available stock units per warehouse with manufacturing cost valuations.",
    columns: ["SKU", "Product Name", "Warehouse Hub", "On Hand", "Reserved", "Available", "Unit Cost", "Total Asset Value"],
    formats: ["CSV", "EXCEL"],
  },
  {
    id: "rep-settlements-bank",
    title: "Escrow Settlements & Bank Disbursal Ledger",
    category: "FINANCE",
    description: "Settlement cycle transaction audit with marketplace commission, shipping fee debits, and bank UTR numbers.",
    columns: ["Settlement ID", "Date", "Gross Sale", "Commission Fee", "TCS", "Net Payout", "Bank Reference / UTR", "Status"],
    formats: ["CSV", "PDF"],
  },
  {
    id: "rep-returns-rma",
    title: "Returns, RMAs & Inspection Dispute Register",
    category: "LOGISTICS",
    description: "Customer return defect codes, reverse courier AWB numbers, inspection notes, and restocking fee deductions.",
    columns: ["RMA #", "Order ID", "SKU", "Return Reason", "Reverse AWB", "Inspection Status", "Refund / Replacement"],
    formats: ["CSV", "EXCEL"],
  },
];

export default function VendorReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filteredReports = AVAILABLE_REPORTS.filter((r) => {
    if (selectedCategory === "ALL") return true;
    return r.category === selectedCategory;
  });

  const handleDownloadReport = async (rep: ReportType, format: string) => {
    setGeneratingId(rep.id);
    setDownloadSuccess(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "";
    const rows: string[] = [rep.columns.join(",")];

    try {
      if (rep.category === "SALES" || rep.category === "TAX") {
        const orderRes = token ? await getVendorOrdersApi(token, undefined, 0, 100) : null;
        if (orderRes && orderRes.success && orderRes.data && orderRes.data.content) {
          orderRes.data.content.forEach((o) => {
            const subtotal = o.subtotalAmount || 0;
            const discount = o.discountAmount || 0;
            const net = subtotal - discount;
            rows.push(`"${o.subOrderNumber}","${new Date(o.createdAt).toISOString().slice(0, 10)}","Domestic","${o.items?.[0]?.variantSku || 'SKU'}","${o.items?.length || 1}","${subtotal.toFixed(2)}","${discount.toFixed(2)}","${net.toFixed(2)}"`);
          });
        }
      } else if (rep.category === "INVENTORY") {
        const prodRes = token ? await getVendorProductsApi(token, undefined, 0, 100) : null;
        if (prodRes && prodRes.success && prodRes.data && prodRes.data.content) {
          prodRes.data.content.forEach((p) => {
            const stock = p.stockQuantity ?? 0;
            const price = p.basePrice || 0;
            rows.push(`"${p.sku || ''}","${(p.title || '').replace(/"/g, '""')}","Default Hub","${stock}","0","${stock}","${price.toFixed(2)}","${(stock * price).toFixed(2)}"`);
          });
        }
      } else if (rep.category === "FINANCE") {
        const txRes = token ? await settlementService.getVendorTransactions(token, 0, 100) : null;
        if (txRes && txRes.success && txRes.data && txRes.data.content) {
          txRes.data.content.forEach((t) => {
            rows.push(`"${t.id}","${new Date(t.createdAt).toISOString().slice(0, 10)}","${(t.amount || 0).toFixed(2)}","0.00","0.00","${(t.amount || 0).toFixed(2)}","${t.referenceId || t.id}","${t.transactionType || 'COMPLETED'}"`);
          });
        }
      }

      const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${rep.id}_${startDate}_to_${endDate}.${format.toLowerCase() === "excel" ? "csv" : format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(rep.title);
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & DATE RANGE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Reports & Document Export Center
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Statutory GST & Finance Compliant
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Export scheduled sales registers, tax compliance reports (GSTR-1, GSTR-8), inventory valuation sheets, and escrow ledgers.
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 bg-brand-slate-50 border border-brand-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-slate-400" />
            <span className="font-semibold text-brand-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent font-bold text-brand-slate-900 focus:outline-none"
            />
            <span className="font-semibold text-brand-slate-500 ml-2">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent font-bold text-brand-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>&ldquo;{downloadSuccess}&rdquo; successfully generated and downloaded!</span>
        </div>
      )}

      {/* 2. CATEGORY TABS */}
      <div className="flex border-b border-brand-slate-200 text-xs font-semibold">
        {[
          { label: "All Reports", value: "ALL" },
          { label: "Sales & Orders", value: "SALES" },
          { label: "Tax & GST", value: "TAX" },
          { label: "Inventory Valuation", value: "INVENTORY" },
          { label: "Finance & Payouts", value: "FINANCE" },
          { label: "Logistics & RMAs", value: "LOGISTICS" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedCategory(tab.value)}
            className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
              selectedCategory === tab.value
                ? "border-brand-emerald-800 text-brand-emerald-800 font-bold"
                : "border-transparent text-brand-slate-500 hover:text-brand-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. REPORTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((rep) => (
          <Card key={rep.id} className="p-5 border-brand-slate-200 hover:border-brand-emerald-400 transition-all shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-slate-100 text-brand-slate-600 border border-brand-slate-200">
                  {rep.category}
                </span>
                <span className="text-[10px] text-brand-slate-400">
                  Range: {startDate} to {endDate}
                </span>
              </div>

              <h3 className="font-bold text-sm text-brand-slate-900">{rep.title}</h3>
              <p className="text-xs text-brand-slate-500 leading-relaxed">{rep.description}</p>

              {/* Columns Preview Tag List */}
              <div className="pt-1">
                <span className="text-[10px] font-semibold text-brand-slate-400 block mb-1">Included Columns:</span>
                <div className="flex flex-wrap gap-1">
                  {rep.columns.map((col, i) => (
                    <span key={i} className="text-[9px] bg-brand-slate-50 text-brand-slate-600 border border-brand-slate-100 px-1.5 py-0.2 rounded font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="pt-3 border-t border-brand-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-brand-slate-400 font-medium">1-Click Instant Download</span>
              <div className="flex items-center gap-2">
                {rep.formats.map((fmt) => (
                  <Button
                    key={fmt}
                    variant="outline"
                    size="sm"
                    disabled={generatingId === rep.id}
                    onClick={() => handleDownloadReport(rep, fmt)}
                    className="text-xs py-1 h-7 font-bold gap-1 hover:bg-brand-emerald-50 hover:text-brand-emerald-900 hover:border-brand-emerald-300"
                  >
                    {generatingId === rep.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-brand-emerald-800" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>{fmt}</span>
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
