"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Eye,
  Trash2,
  Package,
  Store,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  QuestionResponse,
  QuestionStatus,
  ReviewModerationRequest,
  ReviewResponse,
  ReviewStatus,
} from "@/types/review";
import { reviewService } from "@/services/review-service";
import { getStoredToken } from "@/services/auth-service";

export default function AdminReviewsModerationPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "questions">("reviews");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [token, setToken] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Action status feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t);
    if (t) {
      loadReviews(t, statusFilter);
      loadQuestions(t, statusFilter);
    }
  }, [statusFilter]);

  const loadReviews = async (authToken: string, filter: string) => {
    setLoadingReviews(true);
    try {
      const statusParam = filter !== "ALL" ? (filter as ReviewStatus) : undefined;
      const res = await reviewService.getAdminReviews(authToken, statusParam, 0, 50);
      if (res.success && res.data) {
        setReviews(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load admin reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadQuestions = async (authToken: string, filter: string) => {
    setLoadingQuestions(true);
    try {
      const statusParam = filter !== "ALL" ? (filter as QuestionStatus) : undefined;
      const res = await reviewService.getAdminQuestions(authToken, statusParam, 0, 50);
      if (res.success && res.data) {
        setQuestions(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load admin questions", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleModerateReview = async (reviewId: string, status: ReviewStatus) => {
    if (!token) return;
    try {
      const res = await reviewService.adminModerateReview(reviewId, { status }, token);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
        );
        setActionFeedback(`Review status changed to ${status}`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Failed to moderate review", err);
    }
  };

  const handleModerateQuestion = async (questionId: string, status: QuestionStatus) => {
    if (!token) return;
    try {
      const res = await reviewService.adminModerateQuestion(questionId, status, token);
      if (res.success) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, status } : q))
        );
        setActionFeedback(`Question status changed to ${status}`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Failed to moderate question", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-slate-900 tracking-tight">
            Reviews & Community Q&A Moderation Desk
          </h1>
          <p className="text-xs text-brand-slate-500">
            Moderate customer feedback, audit user content, and filter marketplace spam
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Tabs & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-slate-200 pb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 pb-2 text-xs font-bold transition-all relative ${
              activeTab === "reviews"
                ? "text-brand-emerald-800 border-b-2 border-brand-emerald-800"
                : "text-brand-slate-500 hover:text-brand-slate-800"
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Product Reviews ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 pb-2 text-xs font-bold transition-all relative ${
              activeTab === "questions"
                ? "text-brand-emerald-800 border-b-2 border-brand-emerald-800"
                : "text-brand-slate-500 hover:text-brand-slate-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-emerald-700" />
            <span>Community Questions ({questions.length})</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "APPROVED", "PENDING_MODERATION", "REJECTED", "FLAGGED_SPAM"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                statusFilter === st
                  ? "bg-brand-emerald-800 text-white border-brand-emerald-800"
                  : "bg-white text-brand-slate-600 border-brand-slate-200 hover:bg-brand-slate-50"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS TABLE */}
      {activeTab === "reviews" && (
        <Card className="overflow-hidden border-brand-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-brand-slate-200">
              <thead className="bg-brand-slate-50 text-brand-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Rating & Review</th>
                  <th className="px-4 py-3">Product & Vendor</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {loadingReviews ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                      Loading reviews for moderation...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                      No reviews found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 max-w-sm space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= r.rating ? "fill-amber-400 text-amber-400" : "text-amber-200"
                                }`}
                              />
                            ))}
                          </div>
                          {r.title && (
                            <span className="font-bold text-brand-slate-900 truncate max-w-[200px]">
                              {r.title}
                            </span>
                          )}
                        </div>
                        <p className="text-brand-slate-600 line-clamp-2">{r.comment}</p>
                        {r.images && r.images.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-brand-slate-500 pt-0.5">
                            <span className="font-bold">{r.images.length} photos attached</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5 whitespace-nowrap">
                        <div className="font-semibold text-brand-slate-900 truncate max-w-[180px]">
                          {r.productTitle || "Catalog Product"}
                        </div>
                        <div className="text-[10px] text-brand-slate-500 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>{r.vendorStoreName || "Vendor"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5 whitespace-nowrap">
                        <div className="font-semibold text-brand-slate-800">{r.customerName}</div>
                        {r.verifiedPurchase && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            r.status === "APPROVED"
                              ? "success"
                              : r.status === "REJECTED" || r.status === "FLAGGED_SPAM"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {r.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status !== "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModerateReview(r.id, "APPROVED")}
                              className="text-[11px] h-7 px-2 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                            >
                              Approve
                            </Button>
                          )}
                          {r.status !== "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModerateReview(r.id, "REJECTED")}
                              className="text-[11px] h-7 px-2 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                            >
                              Reject
                            </Button>
                          )}
                          {r.status !== "FLAGGED_SPAM" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModerateReview(r.id, "FLAGGED_SPAM")}
                              className="text-[11px] h-7 px-2 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                            >
                              Flag Spam
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* QUESTIONS TABLE */}
      {activeTab === "questions" && (
        <Card className="overflow-hidden border-brand-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-brand-slate-200">
              <thead className="bg-brand-slate-50 text-brand-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Question & Inquirer</th>
                  <th className="px-4 py-3">Target Product & Vendor</th>
                  <th className="px-4 py-3">Answers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100">
                {loadingQuestions ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                      Loading community questions...
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                      No questions found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.id} className="hover:bg-brand-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 max-w-sm space-y-1">
                        <div className="font-bold text-brand-slate-900">{q.questionText}</div>
                        <div className="text-[10px] text-brand-slate-400">
                          Asked by {q.customerName} • {new Date(q.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5 whitespace-nowrap">
                        <div className="font-semibold text-brand-slate-900 truncate max-w-[180px]">
                          {q.productTitle || "Catalog Item"}
                        </div>
                        <div className="text-[10px] text-brand-slate-500">
                          {q.vendorStoreName || "Vendor"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-brand-slate-800">
                          {q.answers.length} Answers
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            q.status === "APPROVED"
                              ? "success"
                              : q.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {q.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status !== "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModerateQuestion(q.id, "APPROVED")}
                              className="text-[11px] h-7 px-2 text-emerald-700"
                            >
                              Approve
                            </Button>
                          )}
                          {q.status !== "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModerateQuestion(q.id, "REJECTED")}
                              className="text-[11px] h-7 px-2 text-rose-700"
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
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
