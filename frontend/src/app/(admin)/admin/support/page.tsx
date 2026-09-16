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
  Search,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Package,
  Lock,
  Flame,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getAdminTicketsApi,
  getAdminTicketByIdApi,
  addAdminTicketMessageApi,
  updateAdminTicketStatusApi,
  resolveAdminTicketApi,
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
  WAITING_ON_VENDOR: { label: "Action Needed by Vendor", color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
};

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Resolve Dialog
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getAdminTicketsApi({
        status: statusFilter !== "ALL" ? (statusFilter as TicketStatus) : undefined,
        priority: priorityFilter !== "ALL" ? (priorityFilter as TicketPriority) : undefined,
        search: searchQuery.trim() || undefined,
        page: 0,
        size: 50,
      });
      if (res.success && res.data) {
        setTickets(res.data.content);
        if (selectedTicket) {
          const updated = res.data.content.find((t: SupportTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticketId: string) => {
    try {
      const res = await getAdminTicketByIdApi(ticketId);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await addAdminTicketMessageApi(selectedTicket.id, {
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
      const res = await updateAdminTicketStatusApi(selectedTicket.id, newStatus);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
        fetchTickets();
      }
    } catch {
      // ignore
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setResolving(true);
    try {
      const res = await resolveAdminTicketApi(selectedTicket.id, resolutionSummary);
      if (res.success && res.data) {
        setResolveModalOpen(false);
        setResolutionSummary("");
        setSelectedTicket(res.data);
        fetchTickets();
      }
    } catch {
      // ignore
    } finally {
      setResolving(false);
    }
  };

  // Stats calculation
  const totalOpen = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const waitingVendor = tickets.filter((t) => t.status === "WAITING_ON_VENDOR").length;
  const urgentCount = tickets.filter(
    (t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "RESOLVED" && t.status !== "CLOSED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-gold-500/10 text-brand-gold-400 rounded-lg border border-brand-gold-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Support Desk & Dispute Resolution Center
            </h1>
          </div>
          <p className="text-xs text-brand-slate-400 mt-0.5">
            Platform-wide customer disputes, vendor SLAs, and omnichannel resolution workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <div className="text-xs bg-red-950/80 text-red-300 border border-red-700/50 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 animate-pulse">
              <Flame className="w-4 h-4 text-red-400" />
              <span>{urgentCount} High/Urgent SLA Cases</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
          <span className="text-xs text-brand-slate-400 font-medium">New Open Cases</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalOpen}</p>
        </div>
        <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
          <span className="text-xs text-brand-slate-400 font-medium">In Progress</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{inProgress}</p>
        </div>
        <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
          <span className="text-xs text-brand-slate-400 font-medium">Awaiting Vendor Action</span>
          <p className="text-2xl font-bold text-orange-400 mt-1">{waitingVendor}</p>
        </div>
        <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-4">
          <span className="text-xs text-brand-slate-400 font-medium">SLA Attention Needed</span>
          <p className="text-2xl font-bold text-red-400 mt-1">{urgentCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-brand-slate-850 border border-brand-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
            placeholder="Search ticket #, subject, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-900 border border-brand-slate-750 rounded-lg text-white placeholder:text-brand-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
          />
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-brand-slate-500" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-slate-900 border border-brand-slate-750 text-white rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-emerald-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
            <option value="WAITING_ON_VENDOR">Waiting on Vendor</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-brand-slate-900 border border-brand-slate-750 text-white rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-emerald-800"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <Button
            onClick={fetchTickets}
            variant="primary"
            size="sm"
            className="text-xs"
          >
            Filter
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Ticket List */}
        <div className="lg:col-span-5 bg-brand-slate-850 border border-brand-slate-800 rounded-xl overflow-hidden">
          <div className="p-3.5 border-b border-brand-slate-800 bg-brand-slate-900 flex items-center justify-between">
            <h2 className="text-xs font-bold text-brand-slate-200 uppercase tracking-wider">
              Marketplace Tickets ({tickets.length})
            </h2>
          </div>

          <div className="divide-y divide-brand-slate-800 max-h-[640px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-brand-slate-500">
                Loading all platform tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-slate-500">
                No tickets matching criteria.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-brand-emerald-950/40 border-l-4 border-l-brand-gold-500"
                        : "hover:bg-brand-slate-800/60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-brand-gold-400 bg-brand-gold-500/10 px-1.5 py-0.5 rounded border border-brand-gold-500/20">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        {t.priority === "URGENT" && (
                          <span className="text-[9px] bg-red-900/80 text-red-200 px-1.5 py-0.5 rounded font-bold uppercase">
                            URGENT
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-white truncate">
                        {t.subject}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-brand-slate-400 truncate">
                        <span>Customer: {t.customerName}</span>
                        {t.vendorName && <span>• Vendor: {t.vendorName}</span>}
                      </div>

                      <span className="text-[10px] text-brand-slate-500 block mt-1">
                        {new Date(t.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 mt-2 transition-transform ${
                        isSelected ? "text-brand-gold-400 translate-x-0.5" : "text-brand-slate-600"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & Workbench */}
        <div className="lg:col-span-7 bg-brand-slate-850 border border-brand-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[640px]">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-brand-slate-800 bg-brand-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-brand-gold-400 bg-brand-gold-500/10 px-2 py-0.5 rounded border border-brand-gold-500/20">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                          STATUS_CONFIG[selectedTicket.status]?.color
                        }`}
                      >
                        {STATUS_CONFIG[selectedTicket.status]?.label}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-brand-slate-300 bg-brand-slate-800 px-2 py-0.5 rounded">
                        {selectedTicket.priority} Priority
                      </span>
                    </div>

                    <h2 className="text-base font-extrabold text-white mt-1">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                      <Button
                        onClick={() => setResolveModalOpen(true)}
                        variant="primary"
                        size="sm"
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve Ticket</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Parties Context Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-brand-slate-800 text-xs text-brand-slate-300">
                  <div>
                    <span className="text-brand-slate-500 block text-[10px] uppercase">Customer</span>
                    <span className="font-semibold text-white">{selectedTicket.customerName}</span>
                    <p className="text-[11px] text-brand-slate-400">{selectedTicket.customerEmail}</p>
                  </div>

                  <div>
                    <span className="text-brand-slate-500 block text-[10px] uppercase">Vendor</span>
                    <span className="font-semibold text-white">
                      {selectedTicket.vendorName || "General Marketplace"}
                    </span>
                  </div>

                  <div>
                    <span className="text-brand-slate-500 block text-[10px] uppercase">Status Action</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                      className="mt-0.5 text-xs font-semibold p-1 bg-brand-slate-800 border border-brand-slate-700 rounded text-white focus:ring-2 focus:ring-brand-emerald-800"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                      <option value="WAITING_ON_VENDOR">Waiting on Vendor</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resolution Notes Banner */}
              {selectedTicket.resolutionNotes && (
                <div className="p-3 bg-emerald-950/40 border-b border-emerald-800/40 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Resolution Summary</h4>
                    <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                      {selectedTicket.resolutionNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Thread */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[380px]">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg) => {
                    const isStaffNote = msg.isInternalNote;
                    const isAdmin = msg.senderType === "ADMIN";
                    const isCustomer = msg.senderType === "CUSTOMER";

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isAdmin && !isStaffNote ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                            isStaffNote
                              ? "bg-amber-950/70 text-amber-200 border border-amber-600/50"
                              : isAdmin
                              ? "bg-brand-emerald-900 text-white border border-brand-emerald-700 rounded-br-none"
                              : isCustomer
                              ? "bg-brand-slate-800 text-brand-slate-100 border border-brand-slate-700 rounded-bl-none"
                              : "bg-amber-900/40 text-amber-100 border border-amber-700/40 rounded-bl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-1">
                            <span className="font-bold text-[11px] flex items-center gap-1">
                              {isStaffNote && <Lock className="w-3 h-3 text-amber-400" />}
                              <span>{msg.senderName} ({msg.senderType})</span>
                              {isStaffNote && (
                                <span className="text-[10px] text-amber-400 font-normal">[Staff Internal Note]</span>
                              )}
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
                  <div className="text-center py-8 text-xs text-brand-slate-500">
                    No messages in this ticket thread yet.
                  </div>
                )}
              </div>

              {/* Reply Box */}
              <div className="p-3.5 border-t border-brand-slate-800 bg-brand-slate-900 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-brand-slate-300">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-brand-gold-500 focus:ring-brand-gold-500"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Internal staff note (Visible only to Admin & Vendor staff)</span>
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
                        ? "Post internal mediation note or action plan..."
                        : "Type response to customer and vendor..."
                    }
                    className="flex-1 text-xs px-3 py-2 bg-brand-slate-950 border border-brand-slate-750 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendingReply}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1 text-xs bg-brand-gold-500 text-brand-slate-950 hover:bg-brand-gold-400"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <LifeBuoy className="w-12 h-12 text-brand-slate-700 mb-3" />
              <h3 className="text-sm font-bold text-brand-slate-300">
                No Support Ticket Selected
              </h3>
              <p className="text-xs text-brand-slate-500 max-w-xs mt-1">
                Select a ticket from the left column to view communications, assign staff, and mediate resolutions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {resolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-brand-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-slate-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white">
              Resolve Support Ticket {selectedTicket.ticketNumber}
            </h3>
            <p className="text-xs text-brand-slate-400 mt-1">
              Provide resolution notes that will be recorded in audit logs and communicated to the customer.
            </p>

            <form onSubmit={handleResolveTicket} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-slate-300 mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="e.g., Replacement unit dispatched via Fedex #TRK-98124, customer confirmed satisfaction."
                  className="w-full p-2 bg-brand-slate-950 border border-brand-slate-750 rounded-lg text-white text-xs font-medium focus:ring-2 focus:ring-brand-gold-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-slate-800">
                <Button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  variant="outline"
                  size="sm"
                  className="text-white border-brand-slate-700 hover:bg-brand-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resolving || !resolutionSummary.trim()}
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {resolving ? "Resolving..." : "Confirm Resolution"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
