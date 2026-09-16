import { apiClient } from "./api-client";
import {
  Category,
  CategoryTree,
  Brand,
  ProductSummary,
  ProductDetail,
  ProductResponse,
  CreateProductPayload,
  UpdateProductPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateBrandPayload,
  UpdateBrandPayload,
  ProductSearchParams,
  ProductStatus,
} from "@/types/product";
import { PagedResponse } from "./vendor-service";
import { ApiResponse } from "@/types";

// ==========================================
// 1. Categories API
// ==========================================

export async function getPublicCategoryTreeApi(): Promise<ApiResponse<CategoryTree[]>> {
  return apiClient<CategoryTree[]>("/categories/tree");
}

export async function getPublicSubcategoriesApi(
  parentId: string
): Promise<ApiResponse<Category[]>> {
  return apiClient<Category[]>(`/categories/${parentId}/subcategories`);
}

export async function getCategoryBySlugApi(slug: string): Promise<ApiResponse<Category>> {
  return apiClient<Category>(`/categories/${slug}`);
}

export async function adminListCategoriesApi(token: string): Promise<ApiResponse<Category[]>> {
  return apiClient<Category[]>("/admin/categories", { token });
}

export async function adminCreateCategoryApi(
  payload: CreateCategoryPayload,
  token: string
): Promise<ApiResponse<Category>> {
  return apiClient<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function adminUpdateCategoryApi(
  id: string,
  payload: UpdateCategoryPayload,
  token: string
): Promise<ApiResponse<Category>> {
  return apiClient<Category>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function adminDeleteCategoryApi(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/categories/${id}`, {
    method: "DELETE",
    token,
  });
}

// ==========================================
// 2. Brands API
// ==========================================

export async function getActiveBrandsApi(): Promise<ApiResponse<Brand[]>> {
  return apiClient<Brand[]>("/brands");
}

export async function getBrandBySlugApi(slug: string): Promise<ApiResponse<Brand>> {
  return apiClient<Brand>(`/brands/${slug}`);
}

export async function adminListBrandsApi(
  token: string,
  search?: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PagedResponse<Brand>>> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<PagedResponse<Brand>>(`/admin/brands${query}`, { token });
}

export async function adminCreateBrandApi(
  payload: CreateBrandPayload,
  token: string
): Promise<ApiResponse<Brand>> {
  return apiClient<Brand>("/admin/brands", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function adminUpdateBrandApi(
  id: string,
  payload: UpdateBrandPayload,
  token: string
): Promise<ApiResponse<Brand>> {
  return apiClient<Brand>(`/admin/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function adminDeleteBrandApi(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/admin/brands/${id}`, {
    method: "DELETE",
    token,
  });
}

// ==========================================
// 3. Public Products API
// ==========================================

export async function searchProductsApi(
  searchParams: ProductSearchParams
): Promise<ApiResponse<PagedResponse<ProductSummary>>> {
  const params = new URLSearchParams();
  if (searchParams.categoryId) params.append("category", searchParams.categoryId);
  if (searchParams.brandId) params.append("brandId", searchParams.brandId);
  if (searchParams.vendorId) params.append("vendorId", searchParams.vendorId);
  if (searchParams.search) params.append("search", searchParams.search);
  if (searchParams.minPrice !== undefined) params.append("minPrice", searchParams.minPrice.toString());
  if (searchParams.maxPrice !== undefined) params.append("maxPrice", searchParams.maxPrice.toString());
  if (searchParams.inStock !== undefined) params.append("inStock", searchParams.inStock.toString());
  if (searchParams.page !== undefined) params.append("page", searchParams.page.toString());
  if (searchParams.size !== undefined) params.append("size", searchParams.size.toString());
  if (searchParams.sort) params.append("sort", searchParams.sort);

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<PagedResponse<ProductSummary>>(`/products${query}`);
}

export async function getProductBySlugApi(slug: string): Promise<ApiResponse<ProductDetail>> {
  return apiClient<ProductDetail>(`/products/${slug}`);
}

export async function getFeaturedProductsApi(limit: number = 10): Promise<ApiResponse<ProductSummary[]>> {
  return apiClient<ProductSummary[]>(`/products/featured?limit=${limit}`);
}

export async function getRelatedProductsApi(slug: string, limit: number = 6): Promise<ApiResponse<ProductSummary[]>> {
  return apiClient<ProductSummary[]>(`/products/${slug}/related?limit=${limit}`);
}

// ==========================================
// 4. Vendor Products API
// ==========================================

export async function getVendorProductsApi(
  token: string,
  status?: ProductStatus,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PagedResponse<ProductResponse>>> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<PagedResponse<ProductResponse>>(`/vendor/products${query}`, { token });
}

export async function getVendorProductByIdApi(
  id: string,
  token: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>(`/vendor/products/${id}`, { token });
}

export async function createVendorProductApi(
  payload: CreateProductPayload,
  token: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>("/vendor/products", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateVendorProductApi(
  id: string,
  payload: UpdateProductPayload,
  token: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>(`/vendor/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function submitVendorProductReviewApi(
  id: string,
  token: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>(`/vendor/products/${id}/submit`, {
    method: "PUT",
    token,
  });
}

export async function deleteVendorProductApi(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/vendor/products/${id}`, {
    method: "DELETE",
    token,
  });
}

// ==========================================
// 5. Admin Products API
// ==========================================

export async function adminListProductsApi(
  token: string,
  status?: ProductStatus,
  categoryId?: string,
  vendorId?: string,
  search?: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PagedResponse<ProductResponse>>> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (categoryId) params.append("categoryId", categoryId);
  if (vendorId) params.append("vendorId", vendorId);
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<PagedResponse<ProductResponse>>(`/admin/products${query}`, { token });
}

export async function adminGetProductByIdApi(
  id: string,
  token: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>(`/admin/products/${id}`, { token });
}

export async function adminUpdateProductStatusApi(
  id: string,
  status: ProductStatus,
  rejectionReason?: string,
  token?: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>(`/admin/products/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, rejectionReason }),
    token,
  });
}

export async function adminToggleFeaturedProductApi(
  id: string,
  featured: boolean,
  token: string
): Promise<ApiResponse<ProductResponse>> {
  return apiClient<ProductResponse>(`/admin/products/${id}/featured?featured=${featured}`, {
    method: "PUT",
    token,
  });
}
