"use client";

import React, { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
  Send,
  Code,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  channel: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
  triggerEvent: string;
  subject?: string;
  body: string;
  variables: string[];
  active: boolean;
}

const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "notif-1",
    code: "VENDOR_APPLICATION_APPROVED",
    name: "Vendor Onboarding Approved",
    channel: "EMAIL",
    triggerEvent: "vendor.lifecycle.approved",
    subject: "Welcome to Alight International Marketplace — Vendor Account Approved",
    body: "Hello {{vendorName}},\n\nYour merchant store registration for {{storeName}} (ID: {{vendorId}}) has been approved. You may now log in to the Merchant Portal and configure your fulfillment catalog.\n\nBest Regards,\nAlight Merchant Governance",
    variables: ["vendorName", "storeName", "vendorId"],
    active: true,
  },
  {
    id: "notif-2",
    code: "ORDER_CONSIGNMENT_DISPATCHED",
    name: "Consignment Dispatched (SMS)",
    channel: "SMS",
    triggerEvent: "order.consignment.shipped",
    body: "Alight: Your order {{orderNumber}} (Consignment {{consignmentId}}) has been shipped via {{carrierName}} (AWB: {{awbNumber}}). Track delivery at {{trackingUrl}}",
    variables: ["orderNumber", "consignmentId", "carrierName", "awbNumber", "trackingUrl"],
    active: true,
  },
  {
    id: "notif-3",
    code: "SETTLEMENT_PAYOUT_RELEASED",
    name: "Vendor Settlement Transferred",
    channel: "EMAIL",
    triggerEvent: "settlement.payout.executed",
    subject: "Payout Disbursed — UTR {{utrNumber}} for {{settlementAmount}}",
    body: "Dear {{vendorName}},\n\nSettlement payout batch {{payoutBatchId}} has been processed. Total amount of {{settlementAmount}} has been remitted to your bank account ending in {{bankAccountLast4}} (UTR: {{utrNumber}}).\n\nView invoice: {{invoiceUrl}}",
    variables: ["vendorName", "payoutBatchId", "settlementAmount", "bankAccountLast4", "utrNumber", "invoiceUrl"],
    active: true,
  },
  {
    id: "notif-4",
    code: "DISPUTE_EVIDENCE_REQUEST",
    name: "Dispute Evidence Request",
    channel: "EMAIL",
    triggerEvent: "dispute.evidence.requested",
    subject: "Action Required: Evidence Requested for Dispute {{disputeId}}",
    body: "Dear {{participantName}},\n\nRegarding transaction dispute {{disputeId}} for Order {{orderNumber}}, the marketplace arbitration team has requested additional proof. Please upload high-resolution inspection photos within 48 hours.\n\nSubmit proof: {{disputeUrl}}",
    variables: ["participantName", "disputeId", "orderNumber", "disputeUrl"],
    active: true,
  },
];

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_NOTIFICATION_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [previewModal, setPreviewModal] = useState(false);
  const [notification, setNotification] = useState("");

  const filtered = templates.filter((t) => {
    return channelFilter === "ALL" || t.channel === channelFilter;
  });

  const handleToggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
    setNotification("Template status toggled");
    setTimeout(() => setNotification(""), 3000);
  };

  const getInterpolatedPreview = (tpl: NotificationTemplate) => {
    let preview = tpl.body;
    tpl.variables.forEach((v) => {
      preview = preview.replaceAll(`{{${v}}}`, `[${v}]`);
    });
    return preview;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-emerald-400" />
            Notification Center & Communication Templates
          </h1>
          <p className="text-xs text-brand-slate-400">
            Manage transactional email, SMS, and in-app templates with dynamic variable interpolation.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-brand-slate-700 text-xs">
        {(["ALL", "EMAIL", "SMS", "PUSH", "IN_APP"] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`px-4 py-2.5 font-semibold capitalize border-b-2 transition-all ${
              channelFilter === ch
                ? "border-brand-emerald-500 text-brand-emerald-400 bg-brand-slate-800/40"
                : "border-transparent text-brand-slate-400 hover:text-white"
            }`}
          >
            {ch === "ALL" ? "All Channels" : ch}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((tpl) => (
          <div key={tpl.id} className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tpl.channel === "EMAIL" && <Mail className="w-4 h-4 text-cyan-400" />}
                {tpl.channel === "SMS" && <Smartphone className="w-4 h-4 text-brand-gold-400" />}
                {tpl.channel === "IN_APP" && <Bell className="w-4 h-4 text-emerald-400" />}
                <span className="font-bold text-white text-xs">{tpl.name}</span>
              </div>
              <button
                onClick={() => handleToggleTemplate(tpl.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  tpl.active
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {tpl.active ? "Active" : "Disabled"}
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-brand-slate-400 text-[11px] font-mono">
                Trigger: {tpl.triggerEvent}
              </div>
              {tpl.subject && (
                <div className="text-white font-medium">
                  Subject: {tpl.subject}
                </div>
              )}
              <div className="p-2.5 bg-brand-slate-900 rounded-lg text-brand-slate-300 font-mono text-[11px] whitespace-pre-wrap max-h-24 overflow-y-auto">
                {tpl.body}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              {tpl.variables.map((v) => (
                <span key={v} className="px-1.5 py-0.5 rounded bg-brand-slate-700 text-brand-gold-300 font-mono text-[10px]">
                  {`{{${v}}}`}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-slate-700">
              <button
                onClick={() => {
                  setSelectedTemplate(tpl);
                  setPreviewModal(true);
                }}
                className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview Modal */}
      {previewModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-emerald-400" />
                Rendered Notification Preview
              </h3>
              <button onClick={() => setPreviewModal(false)} className="text-brand-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-brand-slate-900 rounded-lg border border-brand-slate-750 space-y-2">
                <div className="text-brand-slate-400">
                  <strong>Channel:</strong> {selectedTemplate.channel}
                </div>
                {selectedTemplate.subject && (
                  <div className="text-white font-semibold">
                    <strong>Subject:</strong> {selectedTemplate.subject}
                  </div>
                )}
                <div className="p-3 bg-brand-slate-800/80 rounded border border-brand-slate-700 text-white whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {getInterpolatedPreview(selectedTemplate)}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewModal(false)}
                  className="px-4 py-1.5 bg-brand-slate-700 text-white rounded-lg hover:bg-brand-slate-600 font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
