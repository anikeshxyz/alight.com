"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMyReviewsApi } from "@/services/review-service";
import { Star, CheckCircle2, MessageSquare, ThumbsUp, ShoppingBag, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SubmittedReview {
  id: string;
  productName: string;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  images?: string[];
}

export default function CustomerReviewsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"submitted" | "pending">("submitted");
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserReviews() {
      setIsLoading(true);
      let list: SubmittedReview[] = [];

      // 1. Load from localStorage
      try {
        const stored = localStorage.getItem("alight_submitted_user_reviews");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            list = [...parsed];
          }
        }
      } catch (err) {
        console.warn("Failed to load local reviews", err);
      }

      // 2. Load from Backend API if logged in
      if (token) {
        try {
          const res = await getMyReviewsApi(token);
          if (res.success && res.data && res.data.content) {
            const apiItems: SubmittedReview[] = res.data.content.map((item: any) => ({
              id: item.id,
              productName: item.productTitle || item.productName || "Marketplace Product",
              rating: item.rating,
              title: item.title,
              comment: item.comment,
              date: item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "Recently",
              verifiedPurchase: item.verifiedPurchase ?? true,
              images: item.images || [],
            }));

            const map = new Map<string, SubmittedReview>();
            list.forEach((item) => map.set(item.id, item));
            apiItems.forEach((item) => map.set(item.id, item));
            list = Array.from(map.values());
          }
        } catch (err) {
          console.warn("Failed to fetch API reviews", err);
        }
      }

      // Default sample review if empty
      if (list.length === 0) {
        list = [
          {
            id: "rev-sample-1",
            productName: "Hettich LeMans II Soft-Close Corner Carousel",
            rating: 5,
            title: "Top class quality & silent soft-close",
            comment: "Excellent finish and heavy stainless steel build. Installed effortlessly and works smoothly.",
            date: "17 Sep 2026",
            verifiedPurchase: true,
          },
        ];
      }

      setSubmittedReviews(list);
      setActiveTab("submitted");
      setIsLoading(false);
    }

    loadUserReviews();
  }, [token]);

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
            onClick={() => setActiveTab("submitted")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === "submitted"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Submitted ({submittedReviews.length})
          </button>
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
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading your reviews...</div>
      ) : activeTab === "pending" ? (
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
          {submittedReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No submitted reviews found yet.
            </div>
          ) : (
            submittedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">{rev.date}</span>
                </div>

                {rev.title && (
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{rev.title}</h4>
                )}

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {rev.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Review upload"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
