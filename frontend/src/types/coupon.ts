export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export type CouponScope = "GLOBAL" | "VENDOR" | "CATEGORY" | "PRODUCT" | "FIRST_ORDER";

export interface Coupon {
  id: string;
  code: string;
  couponCode?: string; // alias
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  minOrderSubtotal?: number; // alias
  usageLimitTotal?: number;
  usageLimitPerUser: number;
  totalUsedCount: number;
  usedCount?: number; // alias
  validFrom: string;
  startDate?: string; // alias
  validUntil?: string;
  endDate?: string; // alias
  isActive: boolean;
  scope: CouponScope;
  isPublic?: boolean;
  vendorId?: string;
  vendorStoreName?: string;
  categoryId?: string;
  categoryName?: string;
  productId?: string;
  productTitle?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponRequest {
  code?: string;
  couponCode?: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  minOrderSubtotal?: number;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  validFrom?: string;
  startDate?: string;
  validUntil?: string;
  endDate?: string;
  isActive?: boolean;
  isPublic?: boolean;
  scope?: CouponScope;
  vendorId?: string;
  categoryId?: string;
  productId?: string;
}

export type CreateCouponPayload = CreateCouponRequest;

export interface CartItemContext {
  productId: string;
  variantId?: string;
  vendorId?: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface ApplyCouponRequest {
  couponCode: string;
  cartSubtotal: number;
  shippingAmount?: number;
  items?: CartItemContext[];
}

export interface VendorDiscountBreakdown {
  vendorId: string;
  vendorStoreName: string;
  eligibleSubtotal: number;
  allocatedDiscount: number;
}

export interface CouponValidationResponse {
  valid: boolean;
  message: string;
  couponId?: string;
  couponCode?: string;
  title?: string;
  coupon?: {
    id: string;
    couponCode: string;
    title: string;
    discountType: CouponDiscountType;
    discountValue: number;
  };
  discountType?: CouponDiscountType;
  discountValue?: number;
  discountAmount: number;
  calculatedDiscount?: number; // alias
  revisedSubtotal?: number;
  revisedShipping?: number;
  revisedGrandTotal?: number;
  vendorBreakdowns?: VendorDiscountBreakdown[];
}

export interface PromotionBanner {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  bannerImageUrl?: string;
  bannerTag?: string;
  badgeText?: string;
  discountText?: string;
  couponCode?: string;
  ctaText?: string;
  targetUrl?: string;
  startTime?: string;
  startDate?: string;
  endTime?: string;
  endDate?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponStatsSummary {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalDiscountGranted: number;
}
