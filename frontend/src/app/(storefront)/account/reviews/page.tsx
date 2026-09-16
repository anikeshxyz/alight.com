"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Star, CheckCircle2, MessageSquare, ThumbsUp, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SubmittedReview {
  id: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export default function CustomerReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending");

  const submittedReviews: SubmittedReview[] = [
    {
      id: "rev-1",
      productName: "Heritage Brass Mortise Door Handle (Antique Finish)",
      rating: 5,
      comment: "Exceptional craftsmanship and weight. Installed on main teak double doors, mechanism is silent and solid.",
      date: "12 Sep 2026",
      verifiedPurchase: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Reviews & Ratings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Share verified feedback on hardware performance, packaging, and build quality
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === "pending"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Reviews
          </button>
          <button
            onClick={() => setActiveTab("submitted")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === "submitted"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Submitted ({submittedReviews.length})
          </button>
        </div>
      </div>

      {activeTab === "pending" ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto shadow-2xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            You don&apos;t have any unrated delivered items right now. Reviews become eligible once items are successfully marked delivered.
          </p>
          <Link href="/account/orders">
            <Button variant="outline" size="sm">
              Check Order Status
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submittedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rev.productName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{rev.rating}/5</span>
                    {rev.verifiedPurchase && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs text-slate-400">{rev.date}</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
