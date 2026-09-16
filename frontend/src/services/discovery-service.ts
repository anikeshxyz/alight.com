import { ApiResponse, PageResponse } from "@/types";
import { BundleSummary, PersonalizationOverview, Wishlist } from "@/types/discovery";
import { ProductSummary } from "@/types/product";
import { apiClient } from "./api-client";

const withToken = (token?: string) => (token ? { token } : {});

export const getWishlistApi = (token: string) => apiClient<Wishlist>("/wishlist", withToken(token));
export const addWishlistItemApi = (productId: string, token: string) =>
  apiClient<Wishlist>("/wishlist/items", { method: "POST", body: JSON.stringify({ productId }), token });
export const removeWishlistItemApi = (productId: string, token: string) =>
  apiClient<Wishlist>(`/wishlist/items/${productId}`, { method: "DELETE", token });
export const getBundlesApi = (page = 0, size = 12) =>
  apiClient<PageResponse<BundleSummary>>("/bundles", { params: { page, size } });
export const getTrendingApi = () => apiClient<ProductSummary[]>("/personalization/trending");
export const getPersonalizationOverviewApi = (token: string) =>
  apiClient<PersonalizationOverview>("/personalization/overview", withToken(token));
export const recordProductViewApi = (productId: string, token: string) =>
  apiClient<void>(`/personalization/views/${productId}`, { method: "POST", token });
