import { ProductSummary } from "./product";

export interface WishlistItem {
  id: string;
  productId: string;
  product: ProductSummary;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  name: string;
  isPublic: boolean;
  itemCount: number;
  items: WishlistItem[];
  createdAt: string;
}

export interface BundleSummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  totalOriginalPrice: number;
  totalDiscountedPrice: number;
  totalSavings: number;
  itemCount: number;
  primaryImageUrl?: string;
  createdAt: string;
}

export interface PersonalizationOverview {
  recentlyViewed: ProductSummary[];
  recommended: ProductSummary[];
  trending: ProductSummary[];
}
