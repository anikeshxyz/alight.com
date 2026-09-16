import { PublicVendorStore } from "./vendor";

export interface Category {
  id: string;
  parentId?: string;
  parentName?: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  displayOrder: number;
  active: boolean;
  children: CategoryTree[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "INACTIVE"
  | "REJECTED";

export interface ProductImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  primary: boolean;
}

export interface ProductAttribute {
  id?: string;
  attributeName: string;
  attributeValue: string;
  displayOrder: number;
}

export interface ProductVariant {
  id?: string;
  variantSku: string;
  variantName: string;
  price: number;
  stockQuantity: number;
  attributesJson?: string;
  active: boolean;
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  basePrice: number;
  discountPrice?: number;
  primaryImageUrl?: string;
  categoryName?: string;
  categorySlug?: string;
  brandName?: string;
  vendorStoreName?: string;
  vendorSlug?: string;
  stockQuantity: number;
  inStock: boolean;
  featured: boolean;
  status: ProductStatus;
}

export interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  inStock: boolean;
  status: ProductStatus;
  featured: boolean;
  category?: Category;
  brand?: Brand;
  vendor?: PublicVendorStore;
  images: ProductImage[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: string;
  vendorId: string;
  vendorStoreName: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  status: ProductStatus;
  rejectionReason?: string;
  featured: boolean;
  images: ProductImage[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  categoryId: string;
  brandId?: string;
  title: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
}

export interface UpdateProductPayload {
  categoryId: string;
  brandId?: string;
  title: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  discountPrice?: number;
  stockQuantity: number;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
}

export interface CreateCategoryPayload {
  parentId?: string;
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdateCategoryPayload {
  parentId?: string;
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  displayOrder: number;
  active: boolean;
}

export interface CreateBrandPayload {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  active?: boolean;
}

export interface UpdateBrandPayload {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  active: boolean;
}

export interface ProductSearchParams {
  categoryId?: string;
  brandId?: string;
  vendorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
