"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  X,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Package,
  UserCheck,
  Bot,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getCustomerTicketsApi,
  getCustomerTicketByIdApi,
  createCustomerTicketApi,
  addCustomerTicketMessageApi,
  closeCustomerTicketApi,
} from "@/services/support-service";
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ORDER_ISSUE: "Order & Delivery Issue",
  PRODUCT_QUESTION: "Product & Specification Inquiry",
  RETURN_RMA: "Returns & RMA Assistance",
  BILLING_PAYMENT: "Billing & Payment Inquiry",
  TECHNICAL_SUPPORT: "Technical & Account Support",
  VENDOR_INQUIRY: "Direct Vendor Inquiry",
  GENERAL_INQUIRY: "General Marketplace Question",
};

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  OPEN: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  WAITING_ON_CUSTOMER: { label: "Awaiting Your Reply", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: AlertCircle },
  WAITING_ON_VENDOR: { label: "Awaiting Vendor Reply", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
};

export default function CustomerSupportPage() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New Ticket Form State
  const [category, setCategory] = useState<TicketCategory>("ORDER_ISSUE");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = React.useCallback(async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getCustomerTicketsApi(0, 25);
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
  }, [user]);

  const handleSelectTicket = async (ticketId: string) => {
    try {
      const res = await getCustomerTicketByIdApi(ticketId);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    setSubmitting(true);
    try {
      const res = await createCustomerTicketApi({
        category,
        priority,
        subject,
        initialMessage,
      });

      if (res.success && res.data) {
        setSubject("");
        setInitialMessage("");
        setOrderNumber("");
        setModalOpen(false);
        await fetchTickets();
        setSelectedTicket(res.data);
      }
    } catch {
      // error handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await addCustomerTicketMessageApi(selectedTicket.id, {
        message: replyText.trim(),
      });
      if (res.success && res.data) {
        setReplyText("");
        await handleSelectTicket(selectedTicket.id);
        fetchTickets();
      }
    } catch {
      // ignore
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await closeCustomerTicketApi(selectedTicket.id);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
        fetchTickets();
      }
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-brand-emerald-50 text-brand-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LifeBuoy className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-brand-slate-900 mb-2">
          Customer Support & Help Desk
        </h1>
        <p className="text-sm text-brand-slate-600 mb-6 max-w-md mx-auto">
          Please log in to your Alight account to submit support tickets, message vendors directly, and track resolutions.
        </p>
        <Link href="/">
          <Button variant="primary">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-brand-emerald-100 text-brand-emerald-800 rounded-lg">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-slate-900">
              Customer Support Desk
            </h1>
          </div>
          <p className="text-xs text-brand-slate-500">
            Direct dispute resolution, product inquiries, and SLA-guaranteed support.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Ticket</span>
        </Button>
      </div>

      {/* Support Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="bg-white border border-brand-slate-200 rounded-xl p-4 shadow-xs flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-brand-slate-900">Buyer Protection</h3>
            <p className="text-[11px] text-brand-slate-500 mt-0.5">
              Escrow-backed transactions and hassle-free dispute mediation.
            </p>
          </div>
        </div>

        <div className="bg-white border border-brand-slate-200 rounded-xl p-4 shadow-xs flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-brand-slate-900">Direct Returns & RMAs</h3>
            <p className="text-[11px] text-brand-slate-500 mt-0.5">
              Automated RMA labels and fast inspection turnaround.
            </p>
          </div>
        </div>

        <div className="bg-white border border-brand-slate-200 rounded-xl p-4 shadow-xs flex items-start gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-brand-slate-900">24h Priority SLA</h3>
            <p className="text-[11px] text-brand-slate-500 mt-0.5">
              Dedicated support staff actively overseeing vendor communication.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 bg-white border border-brand-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-brand-slate-100 bg-brand-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider">
              Your Tickets ({tickets.length})
            </h2>
          </div>

          <div className="divide-y divide-brand-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-brand-slate-400">
                Loading support tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <HelpCircle className="w-8 h-8 text-brand-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-brand-slate-700">No tickets found</p>
                <p className="text-[11px] text-brand-slate-500 mt-1">
                  Have a question or issue? Click &quot;Open New Ticket&quot; above.
                </p>
              </div>
            ) : (
              tickets.map((t) => {
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

                      <p className="text-[11px] text-brand-slate-500 mt-0.5">
                        {CATEGORY_LABELS[t.category] || t.category}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-brand-slate-400">
                        <span>
                          Created {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                        {t.vendorName && (
                          <span>• Vendor: {t.vendorName}</span>
                        )}
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

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-7 bg-white border border-brand-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-4 border-b border-brand-slate-100 bg-brand-slate-50 flex items-start justify-between gap-4">
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
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Category: {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                  </p>
                </div>

                {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                  <Button
                    onClick={handleCloseTicket}
                    variant="outline"
                    size="sm"
                    className="text-xs text-brand-slate-600 hover:text-red-600"
                  >
                    Close Ticket
                  </Button>
                )}
              </div>

              {/* Resolution Banner if resolved */}
              {selectedTicket.resolutionNotes && (
                <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">Resolution Summary</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {selectedTicket.resolutionNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Thread */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px]">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg) => {
                    const isUser = msg.senderType === "CUSTOMER";
                    const isAgent = msg.senderType === "ADMIN";
                    const isVendor = msg.senderType === "VENDOR";

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              isAgent
                                ? "bg-brand-emerald-800"
                                : isVendor
                                ? "bg-amber-600"
                                : "bg-brand-slate-600"
                            }`}
                          >
                            {isAgent ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                            isUser
                              ? "bg-brand-emerald-900 text-white rounded-br-none"
                              : isAgent
                              ? "bg-brand-slate-100 text-brand-slate-900 border border-brand-slate-200 rounded-bl-none"
                              : "bg-amber-50 text-amber-950 border border-amber-200 rounded-bl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 border-b border-black/10 pb-1">
                            <span className="font-bold text-[11px]">
                              {msg.senderName} ({msg.senderType})
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
              {selectedTicket.status !== "CLOSED" ? (
                <div className="p-3 border-t border-brand-slate-200 bg-brand-slate-50 flex items-center gap-2">
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
                    placeholder="Type your response to the support team or vendor..."
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
                    <span>Send</span>
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-brand-slate-100 text-center text-xs text-brand-slate-500 border-t border-brand-slate-200">
                  This ticket has been marked as closed.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-12 h-12 text-brand-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-brand-slate-800">
                No Ticket Selected
              </h3>
              <p className="text-xs text-brand-slate-500 max-w-xs mt-1">
                Select a ticket from the list on the left to view the communication thread or open a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-brand-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-brand-slate-100">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-brand-emerald-800" />
                <h3 className="text-base font-bold text-brand-slate-900">
                  Open Support Ticket
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-brand-slate-400 hover:text-brand-slate-700 hover:bg-brand-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-slate-700 mb-1">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full p-2 bg-brand-slate-50 border border-brand-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                    <option key={cat} value={cat}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full p-2 bg-brand-slate-50 border border-brand-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
                  >
                    <option value="LOW">Low - General query</option>
                    <option value="MEDIUM">Medium - Standard inquiry</option>
                    <option value="HIGH">High - Urgent issue</option>
                    <option value="URGENT">Urgent - Order blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-brand-slate-700 mb-1">
                    Related Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. ORD-2026-0012"
                    className="w-full p-2 bg-brand-slate-50 border border-brand-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue or question"
                  className="w-full p-2 bg-brand-slate-50 border border-brand-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Please provide full details, including product names, serials, or screenshots if applicable..."
                  className="w-full p-2 bg-brand-slate-50 border border-brand-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-slate-100">
                <Button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !subject.trim() || !initialMessage.trim()}
                  variant="primary"
                  size="sm"
                >
                  {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
