export type ReviewStatus = 'PENDING_MODERATION' | 'APPROVED' | 'REJECTED' | 'FLAGGED_SPAM';
export type VoteType = 'HELPFUL' | 'UNHELPFUL';
export type QuestionStatus = 'PENDING_MODERATION' | 'APPROVED' | 'REJECTED';
export type AuthorType = 'VENDOR' | 'ADMIN' | 'VERIFIED_BUYER' | 'CUSTOMER';

export interface ReviewResponse {
  id: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  vendorId: string;
  vendorStoreName?: string;
  userId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  images: string[];
  status: ReviewStatus;
  helpfulCount: number;
  unhelpfulCount: number;
  userVote?: 'HELPFUL' | 'UNHELPFUL' | null;
  vendorResponse?: string;
  vendorRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStatsResponse {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
  ratingPercentages: Record<number, number>;
  verifiedPurchasesCount: number;
  withPhotosCount: number;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface VendorReplyRequest {
  responseText: string;
}

export interface ReviewModerationRequest {
  status: ReviewStatus;
  moderationNotes?: string;
}

export interface AnswerResponse {
  id: string;
  questionId: string;
  userId?: string;
  authorType: AuthorType;
  authorName: string;
  answerText: string;
  verifiedSeller: boolean;
  accepted: boolean;
  status: QuestionStatus;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionResponse {
  id: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  vendorId: string;
  vendorStoreName?: string;
  userId: string;
  customerName: string;
  questionText: string;
  status: QuestionStatus;
  upvotes: number;
  userUpvoted: boolean;
  answers: AnswerResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionRequest {
  productId: string;
  questionText: string;
}

export interface CreateAnswerRequest {
  answerText: string;
}
