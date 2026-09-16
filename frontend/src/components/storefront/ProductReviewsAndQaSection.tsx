"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Send,
  Search,
  Filter,
  Image as ImageIcon,
  User,
  Sparkles,
  AlertCircle,
  Store,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import {
  AnswerResponse,
  CreateAnswerRequest,
  CreateQuestionRequest,
  CreateReviewRequest,
  QuestionResponse,
  ReviewResponse,
  ReviewStatsResponse,
} from "@/types/review";
import { reviewService } from "@/services/review-service";
import { getStoredToken, getStoredUser } from "@/services/auth-service";

interface ProductReviewsAndQaSectionProps {
  productId: string;
  productTitle: string;
  vendorStoreName?: string;
}

export function ProductReviewsAndQaSection({
  productId,
  productTitle,
  vendorStoreName,
}: ProductReviewsAndQaSectionProps) {
  const [activeTab, setActiveTab] = useState<"reviews" | "qa">("reviews");
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);

  // Write review modal state
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImageInput, setReviewImageInput] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionSearch, setQuestionSearch] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccessMsg, setQuestionSuccessMsg] = useState<string | null>(null);

  // Answer question state
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [newAnswerText, setNewAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const loadReviews = React.useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await reviewService.getProductReviews(productId, 0, 50, getStoredToken());
      if (res.success && res.data) {
        setReviews(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  const loadStats = React.useCallback(async () => {
    try {
      const res = await reviewService.getProductReviewStats(productId);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load review stats", err);
    }
  }, [productId]);

  const loadQuestions = React.useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const res = await reviewService.getProductQuestions(productId, 0, 50, getStoredToken());
      if (res.success && res.data) {
        setQuestions(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to load questions", err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [productId]);

  useEffect(() => {
    const t = getStoredToken();
    const u = getStoredUser();
    setToken(t);
    setCurrentUser(u);

    if (t) {
      reviewService.checkEligibility(productId, t)
        .then((res) => {
          if (res.success && res.data) {
            setIsVerifiedBuyer(res.data.isVerifiedPurchaser);
          }
        })
        .catch(() => {});
    }

    loadReviews();
    loadStats();
    loadQuestions();
  }, [productId, loadReviews, loadStats, loadQuestions]);

  const handleAddImage = () => {
    if (reviewImageInput && reviewImageInput.trim().startsWith("http")) {
      setReviewImages([...reviewImages, reviewImageInput.trim()]);
      setReviewImageInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setReviewErrorMsg("Please sign in as a customer to submit a review.");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewErrorMsg("Please enter your review feedback.");
      return;
    }

    setSubmittingReview(true);
    setReviewErrorMsg(null);
    try {
      const payload: CreateReviewRequest = {
        productId,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        images: reviewImages.length > 0 ? reviewImages : undefined,
      };

      const res = await reviewService.createReview(payload, token);
      if (res.success) {
        setReviewSuccessMsg("Thank you! Your verified review has been posted.");
        setShowWriteReview(false);
        setReviewTitle("");
        setReviewComment("");
        setReviewImages([]);
        loadReviews();
        loadStats();
      } else {
        setReviewErrorMsg(res.message || "Failed to submit review.");
      }
    } catch (err) {
      setReviewErrorMsg("An error occurred while submitting your review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: "HELPFUL" | "UNHELPFUL") => {
    if (!token) {
      alert("Please sign in to vote on reviews.");
      return;
    }

    try {
      const res = await reviewService.voteReview(reviewId, voteType, token);
      if (res.success && res.data) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? res.data! : r))
        );
      }
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("Please sign in to ask a question.");
      return;
    }
    if (!newQuestionText.trim()) return;

    setSubmittingQuestion(true);
    try {
      const res = await reviewService.askQuestion(
        { productId, questionText: newQuestionText.trim() },
        token
      );
      if (res.success) {
        setNewQuestionText("");
        setQuestionSuccessMsg("Your question has been posted to the community!");
        setTimeout(() => setQuestionSuccessMsg(null), 4000);
        loadQuestions();
      }
    } catch (err) {
      console.error("Failed to post question", err);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    if (!token) {
      alert("Please sign in to upvote questions.");
      return;
    }

    try {
      const res = await reviewService.upvoteQuestion(questionId, token);
      if (res.success && res.data) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? res.data! : q))
        );
      }
    } catch (err) {
      console.error("Failed to upvote", err);
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    if (!token) {
      alert("Please sign in to answer questions.");
      return;
    }
    if (!newAnswerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await reviewService.answerQuestion(
        questionId,
        { answerText: newAnswerText.trim() },
        token
      );
      if (res.success) {
        setAnsweringQuestionId(null);
        setNewAnswerText("");
        loadQuestions();
      }
    } catch (err) {
      console.error("Failed to submit answer", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (starFilter === null) return true;
    return r.rating === starFilter;
  });

  const filteredQuestions = questions.filter((q) => {
    if (!questionSearch.trim()) return true;
    const term = questionSearch.toLowerCase();
    return (
      q.questionText.toLowerCase().includes(term) ||
      q.answers.some((a) => a.answerText.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 pt-8 border-t border-brand-slate-200">
      {/* Section Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all relative ${
              activeTab === "reviews"
                ? "text-brand-emerald-800 border-b-2 border-brand-emerald-800"
                : "text-brand-slate-500 hover:text-brand-slate-800"
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Customer Reviews ({stats?.totalReviews || reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("qa")}
            className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all relative ${
              activeTab === "qa"
                ? "text-brand-emerald-800 border-b-2 border-brand-emerald-800"
                : "text-brand-slate-500 hover:text-brand-slate-800"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-brand-emerald-700" />
            <span>Community Q&A ({questions.length})</span>
          </button>
        </div>

        {activeTab === "reviews" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowWriteReview(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Review</span>
          </Button>
        )}
      </div>

      {/* REVIEWS TAB CONTENT */}
      {activeTab === "reviews" && (
        <div className="space-y-8">
          {/* Rating Summary Breakdown Card */}
          <Card className="p-6 bg-brand-slate-50/70 border-brand-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Overall Score */}
              <div className="text-center md:border-r border-brand-slate-200 pr-4 space-y-2">
                <div className="text-4xl font-black text-brand-slate-900 tracking-tight">
                  {stats ? stats.averageRating.toFixed(1) : "0.0"}
                </div>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        stats && s <= Math.round(stats.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-brand-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-brand-slate-500 font-medium">
                  Based on {stats?.totalReviews || 0} verified customer reviews
                </p>
                {isVerifiedBuyer && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>You own this product</span>
                  </div>
                )}
              </div>

              {/* Progress Distribution Bars */}
              <div className="space-y-2 md:col-span-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats?.ratingBreakdown?.[rating] || 0;
                  const pct = stats?.ratingPercentages?.[rating] || 0;
                  const isSelected = starFilter === rating;

                  return (
                    <button
                      key={rating}
                      onClick={() => setStarFilter(isSelected ? null : rating)}
                      className={`w-full flex items-center gap-3 text-xs font-medium group hover:bg-white p-1 rounded-lg transition-colors ${
                        isSelected ? "bg-white ring-1 ring-brand-emerald-700" : ""
                      }`}
                    >
                      <span className="w-8 font-bold text-brand-slate-700 flex items-center gap-0.5">
                        {rating} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                      </span>
                      <div className="flex-1 h-2.5 bg-brand-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 group-hover:bg-amber-500 transition-all rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-brand-slate-500 text-[11px]">
                        {count} ({pct}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter tags */}
            {starFilter !== null && (
              <div className="mt-4 pt-3 border-t border-brand-slate-200 flex items-center justify-between text-xs">
                <span className="text-brand-slate-600">
                  Showing only <strong>{starFilter}-Star</strong> reviews
                </span>
                <button
                  onClick={() => setStarFilter(null)}
                  className="text-brand-emerald-800 font-bold hover:underline"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </Card>

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="text-center py-12 text-xs text-brand-slate-400">
              Loading customer reviews...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-brand-slate-200 space-y-3">
              <MessageSquare className="w-8 h-8 text-brand-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-brand-slate-700">No reviews found</p>
              <p className="text-xs text-brand-slate-400">
                {starFilter ? `No ${starFilter}-star reviews yet.` : "Be the first verified customer to share your thoughts!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => (
                <Card key={rev.id} className="p-5 space-y-3 border-brand-slate-200">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-slate-100 text-brand-slate-700 font-bold flex items-center justify-center text-xs">
                        {rev.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
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
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-brand-slate-400">
                          <span>{new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
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

                  {/* Review Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="group">
                          <img
                            src={img}
                            alt="Review proof"
                            className="w-16 h-16 object-cover rounded-lg border border-brand-slate-200 group-hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Official Vendor Response */}
                  {rev.vendorResponse && (
                    <div className="p-3 bg-brand-slate-50 rounded-xl border-l-4 border-brand-burgundy space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-burgundy">
                        <Store className="w-3.5 h-3.5" />
                        <span>Response from {rev.vendorStoreName || vendorStoreName || "Seller"}</span>
                      </div>
                      <p className="text-xs text-brand-slate-600 leading-relaxed italic">
                        &ldquo;{rev.vendorResponse}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Helpful Voting Controls */}
                  <div className="flex items-center justify-between text-[11px] text-brand-slate-500 pt-2 border-t border-brand-slate-100">
                    <span>Was this review helpful?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(rev.id, "HELPFUL")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors ${
                          rev.userVote === "HELPFUL"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                            : "bg-white text-brand-slate-600 border-brand-slate-200 hover:bg-brand-slate-50"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful ({rev.helpfulCount})</span>
                      </button>

                      <button
                        onClick={() => handleVote(rev.id, "UNHELPFUL")}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors ${
                          rev.userVote === "UNHELPFUL"
                            ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                            : "bg-white text-brand-slate-600 border-brand-slate-200 hover:bg-brand-slate-50"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>({rev.unhelpfulCount})</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMMUNITY Q&A TAB CONTENT */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          {/* Search and Ask Question */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Search questions and answers about dimensions, installation, compatibility..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-brand-slate-200 rounded-xl text-brand-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20 focus:border-brand-emerald-700"
              />
            </div>

            {/* Ask Question Box */}
            <Card className="p-4 bg-brand-slate-50/70 border-brand-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-slate-900">
                <HelpCircle className="w-4 h-4 text-brand-emerald-800" />
                <span>Have a question about this product?</span>
              </div>
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g. Can this be installed on 18mm MDF shutters? Does it include mounting template?"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingQuestion || !newQuestionText.trim()}
                  className="shrink-0"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Ask Question</span>
                </Button>
              </form>

              {questionSuccessMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{questionSuccessMsg}</span>
                </div>
              )}
            </Card>
          </div>

          {/* Question List */}
          {loadingQuestions ? (
            <div className="text-center py-12 text-xs text-brand-slate-400">
              Loading community questions...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-brand-slate-200 space-y-3">
              <HelpCircle className="w-8 h-8 text-brand-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-brand-slate-700">No questions yet</p>
              <p className="text-xs text-brand-slate-400">
                Ask the vendor or verified buyers anything about specifications and installation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => (
                <Card key={q.id} className="p-5 space-y-4 border-brand-slate-200">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 bg-brand-slate-200 text-brand-slate-800 rounded">
                          Q
                        </span>
                        <h4 className="text-xs font-bold text-brand-slate-900">
                          {q.questionText}
                        </h4>
                      </div>
                      <p className="text-[10px] text-brand-slate-400 pl-6">
                        Asked by {q.customerName} on {new Date(q.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleUpvoteQuestion(q.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors shrink-0 ${
                        q.userUpvoted
                          ? "bg-brand-emerald-50 text-brand-emerald-800 border-brand-emerald-300 font-bold"
                          : "bg-white text-brand-slate-600 border-brand-slate-200 hover:bg-brand-slate-50"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{q.upvotes}</span>
                    </button>
                  </div>

                  {/* Answers */}
                  <div className="space-y-2.5 pl-6 border-l-2 border-brand-slate-100">
                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((ans) => (
                        <div key={ans.id} className="p-3 bg-brand-slate-50 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-brand-slate-900">
                                {ans.authorName}
                              </span>
                              {ans.verifiedSeller && (
                                <Badge variant="success" size="sm">
                                  Official Seller
                                </Badge>
                              )}
                              {ans.accepted && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Accepted
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-brand-slate-400">
                              {new Date(ans.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-xs text-brand-slate-700 leading-relaxed">
                            {ans.answerText}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-brand-slate-400 italic">
                        No answers yet. Be the first to reply!
                      </p>
                    )}

                    {/* Inline Answer Form */}
                    {answeringQuestionId === q.id ? (
                      <div className="space-y-2 pt-2 animate-in fade-in">
                        <textarea
                          rows={2}
                          value={newAnswerText}
                          onChange={(e) => setNewAnswerText(e.target.value)}
                          placeholder="Provide your helpful answer..."
                          className="w-full p-2 text-xs bg-white border border-brand-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAnsweringQuestionId(null);
                              setNewAnswerText("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={submittingAnswer || !newAnswerText.trim()}
                            onClick={() => handleAnswerQuestion(q.id)}
                          >
                            Submit Answer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnsweringQuestionId(q.id)}
                        className="text-xs text-brand-emerald-800 font-bold hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Answer this Question</span>
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {showWriteReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-brand-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-slate-900">
                  Write a Customer Review
                </h3>
                <p className="text-xs text-brand-slate-500 truncate max-w-xs">{productTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWriteReview(false)}
                className="text-brand-slate-400 hover:text-brand-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {reviewErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reviewErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-slate-800 block">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(s)}
                      className="p-1 focus:outline-hidden transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= (hoverRating || reviewRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-brand-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-brand-slate-700 ml-2">
                    {hoverRating || reviewRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-slate-800 block">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Exceptional finish and heavy-duty quality!"
                  className="w-full px-3 py-2 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20"
                />
              </div>

              {/* Detailed Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-slate-800 block">
                  Review Feedback *
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about installation, build quality, damping performance, and your experience..."
                  required
                  className="w-full p-3 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-emerald-700/20"
                />
              </div>

              {/* Photos attachment */}
              <div className="space-y-2">
                <ImageUploadDropzone
                  label="Attach Photos (Optional)"
                  helperText="Upload pictures of your installation, unpacked box, or product details"
                  multiple={true}
                  maxFiles={4}
                  value={reviewImages}
                  onChange={(urls) => setReviewImages(Array.isArray(urls) ? urls : [urls])}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowWriteReview(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingReview}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
