"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  Filter,
  User,
  Package,
  FileText,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getVendorTicketsApi,
  getVendorTicketByIdApi,
  addVendorTicketMessageApi,
  updateVendorTicketStatusApi,
} from "@/services/support-service";
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  OPEN: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  WAITING_ON_CUSTOMER: { label: "Waiting on Customer", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: AlertCircle },
  WAITING_ON_VENDOR: { label: "Action Needed", color: "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse", icon: AlertCircle },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
};

export default function VendorSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendorTicketsApi(0, 30);
      if (res.success && res.data) {
        setTickets(res.data.content);
        setSelectedTicket(prev => {
          if (!prev) return null;
          const updated = res.data.content.find((t: SupportTicket) => t.id === prev.id);
          return updated || prev;
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectTicket = async (ticketId: string) => {
    try {
      const res = await getVendorTicketByIdApi(ticketId);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await addVendorTicketMessageApi(selectedTicket.id, {
        message: replyText.trim(),
        isInternalNote,
      });
      if (res.success && res.data) {
        setReplyText("");
        setIsInternalNote(false);
        await handleSelectTicket(selectedTicket.id);
        fetchTickets();
      }
    } catch {
      // ignore
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await updateVendorTicketStatusApi(selectedTicket.id, newStatus);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
        fetchTickets();
      }
    } catch {
      // ignore
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "ACTION_NEEDED") return t.status === "WAITING_ON_VENDOR" || t.status === "OPEN";
    return t.status === statusFilter;
  });

  const actionNeededCount = tickets.filter(
    (t) => t.status === "WAITING_ON_VENDOR" || t.status === "OPEN"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-emerald-50 text-brand-emerald-800 rounded-lg">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-brand-slate-900">
              Vendor Support Desk & Disputes
            </h1>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Communicate with buyers, resolve inquiries, and coordinate with marketplace support agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>{actionNeededCount} Tickets Require Action</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {["ALL", "ACTION_NEEDED", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === st
                ? "bg-brand-emerald-800 text-white font-semibold shadow-xs"
                : "bg-white border border-brand-slate-200 text-brand-slate-600 hover:bg-brand-slate-50"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white border border-brand-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-brand-slate-100 bg-brand-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider">
              Tickets ({filteredTickets.length})
            </h2>
          </div>

          <div className="divide-y divide-brand-slate-100 max-h-[620px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-brand-slate-400">
                Loading vendor tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-slate-400">
                No tickets matching this filter.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
                const StatusIcon = statusInfo.icon;

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-brand-emerald-50/70 border-l-4 border-l-brand-emerald-800"
                        : "hover:bg-brand-slate-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-brand-emerald-900 bg-brand-emerald-100 px-1.5 py-0.5 rounded">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-brand-slate-900 truncate">
                        {t.subject}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-brand-slate-600">
                        <span className="font-medium text-brand-slate-800">
                          {t.customerName}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] text-brand-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 mt-2 transition-transform ${
                        isSelected ? "text-brand-emerald-800 translate-x-0.5" : "text-brand-slate-300"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & Thread */}
        <div className="lg:col-span-7 bg-white border border-brand-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[620px]">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-brand-slate-100 bg-brand-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-brand-emerald-900 bg-brand-emerald-100 px-2 py-0.5 rounded">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                          STATUS_CONFIG[selectedTicket.status]?.color
                        }`}
                      >
                        {STATUS_CONFIG[selectedTicket.status]?.label}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-brand-slate-500 bg-brand-slate-200 px-2 py-0.5 rounded">
                        {selectedTicket.priority} Priority
                      </span>
                    </div>

                    <h2 className="text-base font-extrabold text-brand-slate-900 mt-1">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  {/* Status Change Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-brand-slate-500 font-medium">Status:</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                      className="text-xs font-semibold p-1.5 bg-white border border-brand-slate-300 rounded-lg focus:ring-2 focus:ring-brand-emerald-800"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                      <option value="WAITING_ON_VENDOR">Action Needed</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Customer Context Info */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-brand-slate-200 text-xs text-brand-slate-600">
                  <div>
                    <span className="text-brand-slate-400 font-medium">Customer:</span>{" "}
                    <span className="font-semibold text-brand-slate-900">{selectedTicket.customerName}</span> (
                    {selectedTicket.customerEmail})
                  </div>
                  {selectedTicket.orderNumber && (
                    <div>
                      <span className="text-brand-slate-400 font-medium">Related Order:</span>{" "}
                      <span className="font-mono font-bold text-brand-emerald-800">
                        {selectedTicket.orderNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[380px]">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg) => {
                    const isVendorMsg = msg.senderType === "VENDOR";
                    const isStaffNote = msg.isInternalNote;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isVendorMsg ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                            isStaffNote
                              ? "bg-amber-100 text-amber-950 border border-amber-300 border-dashed"
                              : isVendorMsg
                              ? "bg-brand-emerald-900 text-white rounded-br-none"
                              : "bg-brand-slate-100 text-brand-slate-900 border border-brand-slate-200 rounded-bl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 border-b border-black/10 pb-1">
                            <span className="font-bold text-[11px] flex items-center gap-1">
                              {isStaffNote && <Lock className="w-3 h-3 text-amber-700" />}
                              <span>{msg.senderName} ({msg.senderType})</span>
                              {isStaffNote && <span className="text-[10px] text-amber-800 font-normal">[Staff Internal Note]</span>}
                            </span>
                            <span className="text-[9px] opacity-75">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-brand-slate-400">
                    No messages in this ticket yet.
                  </div>
                )}
              </div>

              {/* Reply Box */}
              <div className="p-3.5 border-t border-brand-slate-200 bg-brand-slate-50 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-brand-slate-700">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-brand-emerald-800 focus:ring-brand-emerald-800"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Internal staff note (Hidden from customer)</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder={
                      isInternalNote
                        ? "Add internal note visible to admin and seller staff..."
                        : "Type reply to customer..."
                    }
                    className="flex-1 text-xs px-3 py-2 bg-white border border-brand-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendingReply}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Reply</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-12 h-12 text-brand-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-brand-slate-800">
                No Ticket Selected
              </h3>
              <p className="text-xs text-brand-slate-500 max-w-xs mt-1">
                Select a ticket from the left column to view customer communications and dispatch updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
