export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantSku: string;
  variantName: string;
  primaryImageUrl?: string;
  vendorId?: string;
  vendorStoreName: string;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  lineTotal: number;
  lineTax: number;
  lineDiscount: number;
  availableStock: number;
  hsnCode?: string;
  taxRate?: number;
  minOrderQuantity?: number;
}

export interface VendorCartGroup {
  vendorId: string;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
  groupSubtotal: number;
  groupDiscount: number;
  groupTax: number;
  groupShipping: number;
  groupTotal: number;
  totalItems: number;
}

export interface CartResponse {
  cartId?: string;
  userId?: string;
  guestSessionId?: string;
  items: CartItem[];
  vendorGroups: VendorCartGroup[];
  totalItems: number;
  uniqueItems: number;
  subtotalAmount: number;
  discountAmount: number;
  estimatedTaxAmount: number;
  estimatedShippingAmount: number;
  grandTotal: number;
  currency: string;
}

export interface AddToCartPayload {
  variantId: string;
  quantity: number;
  guestSessionId?: string;
}
