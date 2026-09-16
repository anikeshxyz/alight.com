"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getBuyerQuotesApi, acceptQuoteApi, rejectQuoteApi } from "@/services/quote-service";
import { Quote, QuoteStatus } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function BuyerQuotesPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const { formatMoney } = useCurrency();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuotes = React.useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    getBuyerQuotesApi(token, 0, 20)
      .then((res) => {
        if (res.success && res.data) {
          setQuotes(res.data.content);
        }
      })
      .catch((err) => console.error("Failed to fetch quotes:", err))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchQuotes();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchQuotes]);

  const handleAccept = async (quoteId: string) => {
    if (!token) return;
    setActionLoading(quoteId);
    try {
      const res = await acceptQuoteApi(quoteId, token);
      if (res.success) {
        fetchQuotes();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (quoteId: string) => {
    if (!token) return;
    const reason = prompt("Enter optional reason for rejecting this offer:");
    setActionLoading(quoteId);
    try {
      const res = await rejectQuoteApi(quoteId, reason || undefined, token);
      if (res.success) {
        fetchQuotes();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Under Manufacturer Review</Badge>;
      case "OFFERED":
        return <Badge variant="brand">Counter-Offer Received</Badge>;
      case "ACCEPTED":
        return <Badge variant="success">Offer Accepted</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      case "EXPIRED":
        return <Badge variant="neutral">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900">
            B2B Request for Quote (RFQ)
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate-500 mt-1">
            Negotiate wholesale volumes and custom pricing directly with verified vendors
          </p>
        </div>

        <Link href="/cart">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
            View Shopping Cart
          </Button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-emerald-50 text-brand-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-brand-slate-900 mb-1">No Active RFQs</h3>
          <p className="text-xs text-brand-slate-500 mb-6">
            You haven&apos;t requested any custom bulk price quotes yet.
          </p>
          <Link href="/">
            <Button variant="primary" size="md" className="rounded-xl">
              Browse Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              {/* RFQ Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-brand-emerald-950 bg-brand-emerald-50 px-2 py-0.5 rounded">
                      {q.quoteNumber}
                    </span>
                    {getStatusBadge(q.status)}
                    <span className="text-xs text-brand-slate-400">
                      Requested {new Date(q.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                  <p className="text-xs text-brand-slate-600 mt-1 flex items-center gap-1.5 font-semibold">
                    <Store className="w-3.5 h-3.5 text-brand-slate-400" />
                    <span>Vendor: {q.vendorStoreName}</span>
                  </p>
                </div>

                <div className="text-right">
                  {q.totalOfferedAmount ? (
                    <div>
                      <span className="text-[10px] text-brand-slate-400 uppercase tracking-wider block">
                        Vendor Offered Total
                      </span>
                      <span className="text-xl font-black text-brand-emerald-800">
                        {formatMoney(q.grandOfferedTotal || q.totalOfferedAmount)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-brand-slate-400 uppercase tracking-wider block">
                        Target Total
                      </span>
                      <span className="text-lg font-bold text-brand-slate-800">
                        {formatMoney(q.totalTargetAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                {q.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-brand-slate-50 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-brand-slate-900">{item.productTitle}</h4>
                      <p className="text-brand-slate-500 text-[11px]">
                        Qty: <strong>{item.requestedQuantity}</strong> • Target Price: {formatMoney(item.targetUnitPrice || 0)} / unit
                      </p>
                      {item.buyerNotes && (
                        <p className="text-[11px] text-brand-slate-400 italic">&ldquo;{item.buyerNotes}&rdquo;</p>
                      )}
                    </div>

                    <div className="text-right">
                      {item.offeredUnitPrice ? (
                        <span className="text-sm font-extrabold text-brand-emerald-950">
                          {formatMoney(item.offeredUnitPrice)} / unit
                        </span>
                      ) : (
                        <span className="text-brand-slate-400 italic">Awaiting seller offer</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Seller Notes & Actions */}
              {q.sellerNotes && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs">
                  <strong>Seller Note:</strong> {q.sellerNotes}
                </div>
              )}

              {q.status === "OFFERED" && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === q.id}
                    onClick={() => handleReject(q.id)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    <span>Decline Offer</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading === q.id}
                    onClick={() => handleAccept(q.id)}
                    className="rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept & Proceed</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
