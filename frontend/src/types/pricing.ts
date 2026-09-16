export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
  exchangeRateToBase: number;
  updatedAt?: string;
}

export interface ConvertCurrencyPayload {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface ConvertCurrencyResult {
  originalAmount: number;
  fromCurrency: string;
  convertedAmount: number;
  toCurrency: string;
  effectiveRate: number;
  formattedConverted: string;
}

export interface TaxCategory {
  id: string;
  code: string;
  name: string;
  hsnSacCode?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface TaxComponentBreakdown {
  componentType: "CGST" | "SGST" | "IGST" | "VAT" | "SALES_TAX" | "CESS" | "CUSTOMS";
  ratePercent: number;
  taxAmount: number;
}

export interface TaxCalculationPayload {
  unitPrice: number;
  quantity?: number;
  taxCategoryCode?: string;
  hsnSacCode?: string;
  originCountry?: string;
  originState?: string;
  destinationCountry?: string;
  destinationState?: string;
  destinationPostalCode?: string;
  isTaxInclusive?: boolean;
}

export interface TaxCalculationResult {
  baseUnitPrice: number;
  quantity: number;
  taxableSubtotal: number;
  totalTaxRatePercent: number;
  totalTaxAmount: number;
  grandTotal: number;
  isInterState: boolean;
  taxRegime: string;
  ruleName: string;
  isTaxInclusive: boolean;
  components: TaxComponentBreakdown[];
}

export interface ProductTierPrice {
  id: string;
  productId: string;
  variantId?: string;
  minQuantity: number;
  maxQuantity?: number;
  tierPrice: number;
  discountPercent?: number;
}

export interface CreateTierPricePayload {
  variantId?: string;
  minQuantity: number;
  maxQuantity?: number;
  tierPrice: number;
  discountPercent?: number;
}

export interface PriceCalculationPayload {
  productId: string;
  variantId?: string;
  quantity?: number;
  targetCurrency?: string;
  originState?: string;
  destinationState?: string;
  destinationCountry?: string;
  destinationPostalCode?: string;
}

export interface PriceCalculationResult {
  productId: string;
  variantId?: string;
  quantity: number;
  currency: string;
  currencySymbol: string;
  regularUnitPrice: number;
  effectiveUnitPrice: number;
  discountPercentage: number;
  isTierPriceApplied: boolean;
  subtotal: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  formattedGrandTotal: string;
  taxDetails?: TaxCalculationResult;
  availableTiers?: ProductTierPrice[];
}
