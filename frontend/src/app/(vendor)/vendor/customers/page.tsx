"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Search,
  Filter,
  Send,
  RefreshCw,
  CornerDownRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorReviewsApi,
  vendorReplyReviewApi,
  getVendorQuestionsApi,
  vendorAnswerQuestionApi,
} from "@/services/review-service";
import { ReviewResponse, QuestionResponse, AnswerResponse } from "@/types/review";

export default function VendorCustomersPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"reviews" | "qa">("reviews");
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Review Reply State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Q&A Answer State
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [revRes, qRes] = await Promise.all([
        getVendorReviewsApi(token, undefined, 0, 50),
        getVendorQuestionsApi(token, undefined, 0, 50),
      ]);
      if (revRes.success && revRes.data) setReviews(revRes.data.content || []);
      if (qRes.success && qRes.data) setQuestions(qRes.data.content || []);
    } catch (err) {
      console.error("Failed to load customer experience data", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenReplyModal = (rev: ReviewResponse) => {
    setSelectedReview(rev);
    setReplyText(rev.vendorResponse || "");
    setReplyModalOpen(true);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReview || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await vendorReplyReviewApi(selectedReview.id, { responseText: replyText.trim() }, token);
      if (res.success) {
        setReplyModalOpen(false);
        loadData();
      }
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleOpenQaModal = (q: QuestionResponse) => {
    setSelectedQuestion(q);
    setAnswerText("");
    setQaModalOpen(true);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedQuestion || !answerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await vendorAnswerQuestionApi(selectedQuestion.id, { answerText: answerText.trim() }, token);
      if (res.success) {
        setQaModalOpen(false);
        loadData();
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const filteredReviews = starFilter
    ? reviews.filter((r) => r.rating === starFilter)
    : reviews;

  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : "4.8";

  const answeredCount = questions.filter((q) => q.answers && q.answers.length > 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & SUMMARY GAUGES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Customer Experience & Ratings Hub
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              Verified Buyer Sentiment
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Monitor product reviews, post official brand responses, and answer pre-purchase technical hardware questions.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} className="text-xs gap-1.5 font-bold">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* 2. RATINGS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-brand-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg">
            ★
          </div>
          <div>
            <span className="text-xs font-bold text-brand-slate-400">Average Rating</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-brand-slate-900">{avgRating}</span>
              <span className="text-xs text-brand-slate-500 font-semibold">/ 5.0</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-slate-400">Total Customer Reviews</span>
            <p className="text-2xl font-extrabold text-brand-slate-900 mt-0.5">{totalReviewsCount}</p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-slate-400">Response Rate</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {totalReviewsCount > 0 ? Math.round((reviews.filter(r => !!r.vendorResponse).length / totalReviewsCount) * 100) : 100}%
            </p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <HelpCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-slate-400">Buyer Inquiries</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-brand-slate-900">{questions.length}</span>
              <span className="text-xs text-emerald-700 font-bold">({answeredCount} resolved)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-brand-slate-200">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 px-1 ${
            activeTab === "reviews"
              ? "border-brand-emerald-800 text-brand-emerald-800"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
          }`}
        >
          <Star className="w-4 h-4" />
          Product Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab("qa")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 px-1 ${
            activeTab === "qa"
              ? "border-brand-emerald-800 text-brand-emerald-800"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Pre-Purchase Technical Q&A ({questions.length})
        </button>
      </div>

      {/* 4. REVIEWS TAB CONTENT */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {/* Star Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-brand-slate-500 mr-1">Filter Stars:</span>
            <Button
              variant={starFilter === null ? "primary" : "outline"}
              size="sm"
              onClick={() => setStarFilter(null)}
              className="text-xs h-7 py-0"
            >
              All Stars
            </Button>
            {[5, 4, 3, 2, 1].map((s) => (
              <Button
                key={s}
                variant={starFilter === s ? "primary" : "outline"}
                size="sm"
                onClick={() => setStarFilter(s)}
                className="text-xs h-7 py-0"
              >
                {s} ★
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-brand-slate-400">Loading verified customer reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-brand-slate-200">
              <Star className="w-10 h-10 text-brand-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-brand-slate-700">No customer reviews found</h3>
              <p className="text-xs text-brand-slate-500 mt-1">Verified buyer reviews for your catalog items will appear here.</p>
            </Card>
          ) : (
            filteredReviews.map((rev) => (
              <Card key={rev.id} className="p-5 border-brand-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-4 h-4 ${
                              idx < rev.rating ? "fill-amber-400 text-amber-400" : "text-brand-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-sm text-brand-slate-900">{rev.title || "Catalog Review"}</span>
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      By <span className="font-semibold text-brand-slate-700">{rev.customerName}</span> on {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReplyModal(rev)}
                    className="text-xs font-bold gap-1"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    {rev.vendorResponse ? "Edit Official Reply" : "Post Official Reply"}
                  </Button>
                </div>

                <p className="text-xs text-brand-slate-700 leading-relaxed bg-brand-slate-50/50 p-3 rounded-xl border border-brand-slate-100">
                  {rev.comment}
                </p>

                {rev.vendorResponse && (
                  <div className="bg-brand-emerald-50/40 p-3.5 rounded-xl border border-brand-emerald-200/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald-700" />
                      Official Vendor Response
                      <span className="text-[10px] text-brand-emerald-700 font-normal ml-2">
                        {rev.vendorRespondedAt ? new Date(rev.vendorRespondedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-brand-slate-800 italic pl-5">&ldquo;{rev.vendorResponse}&rdquo;</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* 5. Q&A TAB CONTENT */}
      {activeTab === "qa" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-brand-slate-400">Loading customer inquiries...</div>
          ) : questions.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-brand-slate-200">
              <MessageSquare className="w-10 h-10 text-brand-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-brand-slate-700">No customer questions</h3>
              <p className="text-xs text-brand-slate-500 mt-1">Pre-order technical questions submitted on your product pages will appear here.</p>
            </Card>
          ) : (
            questions.map((q) => (
              <Card key={q.id} className="p-5 border-brand-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald-800">
                      Product Question
                    </span>
                    <h4 className="font-bold text-sm text-brand-slate-900 mt-0.5">{q.questionText}</h4>
                    <p className="text-[11px] text-brand-slate-400 mt-0.5">
                      Asked by {q.customerName || "Prospective Customer"} on {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenQaModal(q)}
                    className="text-xs h-7 py-0.5 font-bold"
                  >
                    Answer Question
                  </Button>
                </div>

                {q.answers && q.answers.length > 0 ? (
                  <div className="p-3 bg-brand-slate-50 rounded-xl space-y-2 text-xs">
                    {q.answers.map((a: AnswerResponse, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <span className="font-bold text-brand-slate-900">{a.authorName} ({a.authorType}):</span>
                        <p className="text-brand-slate-600">{a.answerText}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-semibold">Awaiting merchant answer to display publicly on product page.</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reply Modal */}
      <Modal isOpen={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="Post Official Seller Response">
        <form onSubmit={handleSubmitReply} className="space-y-4 text-xs text-brand-slate-700">
          <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
            <span className="font-bold text-brand-slate-900">{selectedReview?.title}</span>
            <p className="text-[11px] text-brand-slate-500 mt-1">{selectedReview?.comment}</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Your Public Reply *</label>
            <textarea
              rows={3}
              placeholder="Thank the customer, provide warranty guidance, or clarify technical specifications..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-xl focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setReplyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingReply}>
              {submittingReply ? "Submitting..." : "Publish Reply"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Q&A Modal */}
      <Modal isOpen={qaModalOpen} onClose={() => setQaModalOpen(false)} title="Answer Pre-Purchase Technical Question">
        <form onSubmit={handleSubmitAnswer} className="space-y-4 text-xs text-brand-slate-700">
          <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
            <span className="text-[10px] font-bold uppercase text-brand-emerald-800">Question</span>
            <p className="font-bold text-brand-slate-900 mt-1">{selectedQuestion?.questionText}</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Manufacturer Technical Answer *</label>
            <textarea
              rows={3}
              placeholder="Provide exact dimension specifications, material grade, or compatibility notes..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-xl focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setQaModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingAnswer}>
              {submittingAnswer ? "Submitting..." : "Publish Answer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function HelpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
