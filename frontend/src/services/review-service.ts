import { ApiResponse, PageResponse } from "@/types";
import {
  AnswerResponse,
  CreateAnswerRequest,
  CreateQuestionRequest,
  CreateReviewRequest,
  QuestionResponse,
  QuestionStatus,
  ReviewModerationRequest,
  ReviewResponse,
  ReviewStatsResponse,
  ReviewStatus,
  VendorReplyRequest,
  VoteType,
} from "@/types/review";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// PUBLIC REVIEWS & Q&A APIS
// -------------------------------------------------------------

export async function getProductReviewsApi(
  productId: string,
  page = 0,
  size = 10,
  token?: string | null
): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/${productId}/reviews?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    }
  );
  return res.json();
}

export async function getProductReviewStatsApi(
  productId: string
): Promise<ApiResponse<ReviewStatsResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/${productId}/reviews/stats`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );
  return res.json();
}

export async function voteReviewApi(
  reviewId: string,
  voteType: VoteType,
  token: string
): Promise<ApiResponse<ReviewResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/reviews/${reviewId}/vote`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ voteType }),
    }
  );
  return res.json();
}

export async function getProductQuestionsApi(
  productId: string,
  page = 0,
  size = 10,
  token?: string | null
): Promise<ApiResponse<PageResponse<QuestionResponse>>> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/${productId}/questions?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    }
  );
  return res.json();
}

export async function upvoteQuestionApi(
  questionId: string,
  token: string
): Promise<ApiResponse<QuestionResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/questions/${questionId}/upvote`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
    }
  );
  return res.json();
}

export async function answerQuestionApi(
  questionId: string,
  payload: CreateAnswerRequest,
  token: string
): Promise<ApiResponse<AnswerResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/questions/${questionId}/answers`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  return res.json();
}

// -------------------------------------------------------------
// CUSTOMER REVIEWS & QUESTIONS APIS
// -------------------------------------------------------------

export async function createReviewApi(
  payload: CreateReviewRequest,
  token: string
): Promise<ApiResponse<ReviewResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/reviews`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getMyReviewsApi(
  token: string,
  page = 0,
  size = 10
): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reviews/my-reviews?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    }
  );
  return res.json();
}

export async function checkPurchaseEligibilityApi(
  productId: string,
  token: string
): Promise<ApiResponse<{ productId: string; isVerifiedPurchaser: boolean }>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reviews/eligibility?productId=${productId}`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    }
  );
  return res.json();
}

export async function askQuestionApi(
  payload: CreateQuestionRequest,
  token: string
): Promise<ApiResponse<QuestionResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/reviews/questions`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// -------------------------------------------------------------
// VENDOR REVIEWS & Q&A APIS
// -------------------------------------------------------------

export async function getVendorReviewsApi(
  token: string,
  status?: ReviewStatus,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
  const url = new URL(`${API_BASE}/api/v1/vendor/reviews`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("size", size.toString());
  if (status) url.searchParams.append("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function vendorReplyReviewApi(
  reviewId: string,
  payload: VendorReplyRequest,
  token: string
): Promise<ApiResponse<ReviewResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/reviews/${reviewId}/reply`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getVendorQuestionsApi(
  token: string,
  status?: QuestionStatus,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<QuestionResponse>>> {
  const url = new URL(`${API_BASE}/api/v1/vendor/questions`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("size", size.toString());
  if (status) url.searchParams.append("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function vendorAnswerQuestionApi(
  questionId: string,
  payload: CreateAnswerRequest,
  token: string
): Promise<ApiResponse<AnswerResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/vendor/questions/${questionId}/answer`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  return res.json();
}

export async function vendorAcceptAnswerApi(
  answerId: string,
  token: string
): Promise<ApiResponse<AnswerResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/vendor/answers/${answerId}/accept`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
    }
  );
  return res.json();
}

// -------------------------------------------------------------
// ADMIN REVIEWS & Q&A MODERATION APIS
// -------------------------------------------------------------

export async function getAdminReviewsApi(
  token: string,
  status?: ReviewStatus,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
  const url = new URL(`${API_BASE}/api/v1/admin/reviews`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("size", size.toString());
  if (status) url.searchParams.append("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function adminModerateReviewApi(
  reviewId: string,
  payload: ReviewModerationRequest,
  token: string
): Promise<ApiResponse<ReviewResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/admin/reviews/${reviewId}/moderate`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  return res.json();
}

export async function getAdminQuestionsApi(
  token: string,
  status?: QuestionStatus,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<QuestionResponse>>> {
  const url = new URL(`${API_BASE}/api/v1/admin/questions`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("size", size.toString());
  if (status) url.searchParams.append("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function adminModerateQuestionApi(
  questionId: string,
  status: QuestionStatus,
  token: string
): Promise<ApiResponse<QuestionResponse>> {
  const res = await fetch(
    `${API_BASE}/api/v1/admin/questions/${questionId}/moderate?status=${status}`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
    }
  );
  return res.json();
}

// Export default object
export const reviewService = {
  getProductReviews: getProductReviewsApi,
  getProductReviewStats: getProductReviewStatsApi,
  voteReview: voteReviewApi,
  getProductQuestions: getProductQuestionsApi,
  upvoteQuestion: upvoteQuestionApi,
  answerQuestion: answerQuestionApi,
  createReview: createReviewApi,
  getMyReviews: getMyReviewsApi,
  checkEligibility: checkPurchaseEligibilityApi,
  askQuestion: askQuestionApi,
  getVendorReviews: getVendorReviewsApi,
  vendorReplyReview: vendorReplyReviewApi,
  getVendorQuestions: getVendorQuestionsApi,
  vendorAnswerQuestion: vendorAnswerQuestionApi,
  vendorAcceptAnswer: vendorAcceptAnswerApi,
  getAdminReviews: getAdminReviewsApi,
  adminModerateReview: adminModerateReviewApi,
  getAdminQuestions: getAdminQuestionsApi,
  adminModerateQuestion: adminModerateQuestionApi,
};
