"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Package,
  Store,
  CornerDownRight,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReviewResponse, QuestionResponse, ReviewStatus, QuestionStatus } from "@/types/review";
import { reviewService } from "@/services/review-service";
import { getStoredToken } from "@/services/auth-service";

export default function VendorReviewsDeskPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "questions">("reviews");
  const [token, setToken] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Notification feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t);
    if (t) {
      loadVendorReviews(t);
      loadVendorQuestions(t);
    }
  }, []);

  const loadVendorReviews = async (authToken: string) => {
    setLoadingReviews(true);
    try {
      const res = await reviewService.getVendorReviews(authToken, undefined, 0, 50);
      if (res.success && res.data) {
        setReviews(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load vendor reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadVendorQuestions = async (authToken: string) => {
    setLoadingQuestions(true);
    try {
      const res = await reviewService.getVendorQuestions(authToken, undefined, 0, 50);
      if (res.success && res.data) {
        setQuestions(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load vendor questions", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSendReply = async (reviewId: string) => {
    if (!token || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await reviewService.vendorReplyReview(reviewId, { responseText: replyText.trim() }, token);
      if (res.success && res.data) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? res.data! : r))
        );
        setReplyingReviewId(null);
        setReplyText("");
        setActionSuccessMsg("Your official vendor response has been published.");
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to post vendor reply", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSendAnswer = async (questionId: string) => {
    if (!token || !answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      const res = await reviewService.vendorAnswerQuestion(questionId, { answerText: answerText.trim() }, token);
      if (res.success) {
        setAnsweringQuestionId(null);
        setAnswerText("");
        setActionSuccessMsg("Your official answer has been posted to the product Q&A.");
        setTimeout(() => setActionSuccessMsg(null), 4000);
        if (token) loadVendorQuestions(token);
      }
    } catch (err) {
      console.error("Failed to post vendor answer", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Metrics
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0";
  const verifiedReviewsCount = reviews.filter((r) => r.verifiedPurchase).length;
  const pendingQuestionsCount = questions.filter((q) => q.answers.length === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-slate-900 tracking-tight">
            Customer Reviews & Product Q&A Desk
          </h1>
          <p className="text-xs text-brand-slate-500">
            Monitor buyer feedback, maintain high store ratings, and answer pre-sales questions
          </p>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Average Store Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-brand-slate-900">
            {avgRating} <span className="text-xs font-semibold text-brand-slate-400">/ 5.0</span>
          </div>
          <p className="text-[10px] text-brand-slate-400">Across all catalogue products</p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-brand-emerald-700" />
          </div>
          <div className="text-2xl font-black text-brand-slate-900">{totalReviews}</div>
          <p className="text-[10px] text-brand-slate-400">{verifiedReviewsCount} verified buyers</p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Total Inquiries</span>
            <HelpCircle className="w-4 h-4 text-brand-burgundy" />
          </div>
          <div className="text-2xl font-black text-brand-slate-900">{questions.length}</div>
          <p className="text-[10px] text-brand-slate-400">Customer questions received</p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-slate-500 font-medium">
            <span>Unanswered Inquiries</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingQuestionsCount}</div>
          <p className="text-[10px] text-amber-600/80 font-medium">Awaiting vendor answer</p>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-4 border-b border-brand-slate-200">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
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
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "questions"
              ? "text-brand-emerald-800 border-b-2 border-brand-emerald-800"
              : "text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-brand-emerald-700" />
          <span>Product Inquiries & Q&A ({questions.length})</span>
        </button>
      </div>

      {/* REVIEWS TAB */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {loadingReviews ? (
            <div className="text-center py-12 text-xs text-brand-slate-400">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-12 text-center space-y-3 bg-white border-brand-slate-200">
              <MessageSquare className="w-10 h-10 text-brand-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-brand-slate-800">No Customer Reviews Yet</h3>
              <p className="text-xs text-brand-slate-400 max-w-sm mx-auto">
                Customer reviews and ratings for your catalog items will be displayed here once submitted.
              </p>
            </Card>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id} className="p-5 space-y-3 border-brand-slate-200 bg-white">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-slate-900">
                        {rev.customerName}
                      </span>
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}
                      <span className="text-[10px] text-brand-slate-400">
                        • {new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <Link
                      href={rev.productSlug ? `/products/${rev.productSlug}` : "#"}
                      className="text-xs font-semibold text-brand-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{rev.productTitle || "Catalogue Product"}</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-amber-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 ml-1">{rev.rating}.0</span>
                  </div>
                </div>

                {rev.title && (
                  <h4 className="text-xs font-bold text-brand-slate-900">{rev.title}</h4>
                )}

                <p className="text-xs text-brand-slate-700 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>

                {/* Proof Photos */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer">
                        <img
                          src={img}
                          alt="Customer photo"
                          className="w-14 h-14 object-cover rounded-lg border border-brand-slate-200 hover:opacity-90"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Official Response */}
                {rev.vendorResponse ? (
                  <div className="p-3 bg-brand-slate-50 rounded-xl border-l-4 border-brand-burgundy space-y-1 mt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-brand-burgundy flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" />
                        Your Official Response
                      </span>
                      {rev.vendorRespondedAt && (
                        <span className="text-[10px] text-brand-slate-400">
                          {new Date(rev.vendorRespondedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-slate-700 italic">
                      &ldquo;{rev.vendorResponse}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div>
                    {replyingReviewId === rev.id ? (
                      <div className="space-y-2 pt-2 border-t border-brand-slate-100 animate-in fade-in">
                        <label className="text-[11px] font-bold text-brand-slate-700 block">
                          Write Official Store Response:
                        </label>
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Thank customer for their feedback and clarify any maintenance or installation tips..."
                          className="w-full p-2.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingReviewId(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={submittingReply || !replyText.trim()}
                            onClick={() => handleSendReply(rev.id)}
                          >
                            {submittingReply ? "Publishing..." : "Publish Official Response"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-brand-slate-100 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplyingReviewId(rev.id)}
                          className="text-xs"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 mr-1" />
                          <span>Reply to Review</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* QUESTIONS TAB */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {loadingQuestions ? (
            <div className="text-center py-12 text-xs text-brand-slate-400">
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <Card className="p-12 text-center space-y-3 bg-white border-brand-slate-200">
              <HelpCircle className="w-10 h-10 text-brand-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-brand-slate-800">No Product Inquiries Yet</h3>
              <p className="text-xs text-brand-slate-400 max-w-sm mx-auto">
                Customer technical questions and compatibility inquiries will appear here for you to answer.
              </p>
            </Card>
          ) : (
            questions.map((q) => (
              <Card key={q.id} className="p-5 space-y-4 border-brand-slate-200 bg-white">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-brand-slate-100 text-brand-slate-700 rounded font-mono text-[10px]">
                        Q
                      </span>
                      {q.questionText}
                    </span>
                    <Badge variant={q.answers.length > 0 ? "success" : "warning"} size="sm">
                      {q.answers.length > 0 ? `${q.answers.length} Answered` : "Needs Answer"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-brand-slate-400 pl-6">
                    <span>Asked by {q.customerName} on {new Date(q.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                    <span>•</span>
                    <Link href={q.productSlug ? `/products/${q.productSlug}` : "#"} className="text-brand-emerald-800 hover:underline">
                      Product: {q.productTitle}
                    </Link>
                  </div>
                </div>

                {/* Existing Answers */}
                <div className="space-y-2 pl-6 border-l-2 border-brand-slate-100">
                  {q.answers.map((ans) => (
                    <div key={ans.id} className="p-3 bg-brand-slate-50 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-brand-slate-800">
                        <span>{ans.authorName}</span>
                        <span className="text-[10px] text-brand-slate-400 font-normal">
                          {new Date(ans.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-brand-slate-700">{ans.answerText}</p>
                    </div>
                  ))}

                  {/* Inline Answer Form */}
                  {answeringQuestionId === q.id ? (
                    <div className="space-y-2 pt-2 animate-in fade-in">
                      <label className="text-[11px] font-bold text-brand-slate-700 block">
                        Your Official Seller Answer:
                      </label>
                      <textarea
                        rows={3}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Provide exact dimensions, material grade, or compatibility guidelines..."
                        className="w-full p-2.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAnsweringQuestionId(null);
                            setAnswerText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={submittingAnswer || !answerText.trim()}
                          onClick={() => handleSendAnswer(q.id)}
                        >
                          {submittingAnswer ? "Posting..." : "Post Official Answer"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAnsweringQuestionId(q.id)}
                        className="text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        <span>Answer Inquiry</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
