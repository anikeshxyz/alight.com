"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  Calendar,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { getVendorQuotesApi, submitVendorOfferApi } from "@/services/quote-service";
import { Quote, QuoteStatus, QuoteOfferPayload } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function VendorQuotesContent() {
  const { token, user } = useAuth();
  const { formatMoney } = useCurrency();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus || "ALL");

  useEffect(() => {
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
  }, [urlStatus]);

  // Offer Modal State
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [offerPrices, setOfferPrices] = useState<Record<string, number>>({});
  const [offeredShipping, setOfferedShipping] = useState<number>(0);
  const [sellerNotes, setSellerNotes] = useState<string>("");
  const [validDays, setValidDays] = useState<number>(7);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchQuotes = React.useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    const filter = statusFilter !== "ALL" ? (statusFilter as QuoteStatus) : undefined;
    getVendorQuotesApi(token, filter, 0, 30)
      .then((res) => {
        if (res.success && res.data) {
          setQuotes(res.data.content);
        }
      })
      .catch((err) => console.error("Error loading vendor quotes:", err))
      .finally(() => setIsLoading(false));
  }, [token, statusFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleOpenOfferModal = (q: Quote) => {
    setSelectedQuote(q);
    const initialPrices: Record<string, number> = {};
    q.items.forEach((item) => {
      initialPrices[item.id] = item.offeredUnitPrice || item.targetUnitPrice || 100;
    });
    setOfferPrices(initialPrices);
    setOfferedShipping(q.offeredShippingAmount || 0);
    setSellerNotes(q.sellerNotes || "");
    setValidDays(7);
    setModalOpen(true);
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedQuote) return;

    setIsSubmitting(true);
    try {
      const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      const payload: QuoteOfferPayload = {
        items: selectedQuote.items.map((i) => ({
          quoteItemId: i.id,
          offeredUnitPrice: Number(offerPrices[i.id] || i.targetUnitPrice || 100),
        })),
        offeredShippingAmount: Number(offeredShipping),
        sellerNotes: sellerNotes.trim() || undefined,
        validUntil,
      };

      const res = await submitVendorOfferApi(selectedQuote.id, payload, token);
      if (res.success) {
        setModalOpen(false);
        fetchQuotes();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">New Buyer Request</Badge>;
      case "OFFERED":
        return <Badge variant="brand">Offer Sent</Badge>;
      case "ACCEPTED":
        return <Badge variant="success">Accepted by Buyer</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Declined</Badge>;
      case "EXPIRED":
        return <Badge variant="neutral">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-slate-900">
            B2B Quotation (RFQ) Inquiries
          </h1>
          <p className="text-xs text-brand-slate-500 mt-1">
            Review custom wholesale RFQs submitted by buyers and provide negotiable counter-offers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-brand-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
          >
            <option value="ALL">All RFQs</option>
            <option value="PENDING">Pending Counter-Offer</option>
            <option value="OFFERED">Offered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Declined</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-12 text-center">
            <div className="w-8 h-8 border-3 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-brand-slate-500">Loading incoming quote requests...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-12 text-center text-brand-slate-500">
            <FileText className="w-10 h-10 mx-auto text-brand-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-brand-slate-700">No Inquiries Found</h3>
            <p className="text-xs text-brand-slate-400 mt-1">
              Custom bulk quote inquiries from buyers will appear here.
            </p>
          </div>
        ) : (
          quotes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-brand-emerald-950 bg-brand-slate-100 px-2 py-0.5 rounded">
                      {q.quoteNumber}
                    </span>
                    {getStatusBadge(q.status)}
                    <span className="text-xs text-brand-slate-400">
                      From {q.buyerName} ({q.buyerEmail})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs">
                    <span className="text-brand-slate-400 block">Buyer Target</span>
                    <span className="text-sm font-bold text-brand-slate-900">
                      {formatMoney(q.totalTargetAmount)}
                    </span>
                  </div>

                  {(q.status === "PENDING" || q.status === "OFFERED") && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenOfferModal(q)}
                      className="rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{q.status === "OFFERED" ? "Revise Offer" : "Submit Counter-Offer"}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {q.items.map((i) => (
                  <div key={i.id} className="bg-brand-slate-50 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-brand-slate-900">{i.productTitle}</h4>
                      <p className="text-brand-slate-500 text-[11px]">
                        Quantity: <strong>{i.requestedQuantity}</strong> • Target Price: {formatMoney(i.targetUnitPrice || 0)}
                      </p>
                      {i.buyerNotes && <p className="text-[11px] text-brand-slate-400 italic">&ldquo;{i.buyerNotes}&rdquo;</p>}
                    </div>
                    <div className="text-right">
                      {i.offeredUnitPrice ? (
                        <div>
                          <span className="text-xs text-brand-slate-400 block">Your Offer</span>
                          <span className="text-sm font-bold text-brand-emerald-950 font-mono">
                            {formatMoney(i.offeredUnitPrice)} / unit
                          </span>
                        </div>
                      ) : (
                        <span className="text-brand-slate-400 italic">Not yet offered</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Offer Modal */}
      {modalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-brand-slate-900 mb-1">
              Submit Wholesale Counter-Offer
            </h3>
            <p className="text-xs text-brand-slate-500 mb-4 font-mono">
              {selectedQuote.quoteNumber} • {selectedQuote.buyerName}
            </p>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-brand-slate-800">
                  Line Item Offered Unit Prices (₹)
                </label>
                {selectedQuote.items.map((item) => (
                  <div key={item.id} className="bg-brand-slate-50 p-3 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-brand-slate-900 truncate">
                      {item.productTitle} (Qty: {item.requestedQuantity})
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-slate-500">Unit Price: ₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={offerPrices[item.id] || ""}
                        onChange={(e) =>
                          setOfferPrices({
                            ...offerPrices,
                            [item.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-32 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-brand-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Offered Freight / Shipping Total (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offeredShipping}
                  onChange={(e) => setOfferedShipping(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-brand-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  placeholder="0.00 (Free Shipping)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Offer Validity (Days)
                </label>
                <select
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-brand-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Standard)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Seller Terms & Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  placeholder="e.g. Special bulk tier pricing approved for dispatch within 48 hours."
                  className="w-full px-3 py-2 rounded-xl border border-brand-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="rounded-xl font-bold">
                  {isSubmitting ? "Submitting..." : "Send Counter-Offer to Buyer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorQuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VendorQuotesContent />
    </Suspense>
  );
}

