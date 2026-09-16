export interface Warehouse {
  id: string;
  vendorId: string | null;
  vendorStoreName: string;
  name: string;
  code: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  primary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehousePayload {
  name: string;
  code: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
  primary?: boolean;
}

export interface UpdateWarehousePayload {
  name?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
  primary?: boolean;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productTitle: string;
  productSku: string;
  variantId: string | null;
  variantName: string | null;
  variantSku: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderThreshold: number;
  safetyStock: number;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'INBOUND_RECEIPT'
  | 'OUTBOUND_SALE'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_SUBTRACT'
  | 'DAMAGE_WRITE_OFF'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RESERVATION_HOLD'
  | 'RESERVATION_RELEASE';

export interface StockAdjustmentPayload {
  warehouseId: string;
  productId: string;
  variantId?: string;
  transactionType: TransactionType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface StockTransferPayload {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productTitle: string;
  productSku: string;
  variantId: string | null;
  variantName: string | null;
  transactionType: TransactionType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  performedByName: string;
  createdAt: string;
}

export interface StockReservationPayload {
  reservationToken?: string;
  productId: string;
  variantId?: string;
  warehouseId?: string;
  quantity: number;
  ttlMinutes?: number;
}

export interface StockReservation {
  id: string;
  reservationToken: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productTitle: string;
  variantId: string | null;
  variantName: string | null;
  reservedQuantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
}

export interface ProductStockOverview {
  productId: string;
  productTitle: string;
  productSku: string;
  totalAvailableQuantity: number;
  inStock: boolean;
  lowStock: boolean;
  warehouseBreakdown: WarehouseStock[];
}
