export type ShipmentStatus =
  | 'MANIFESTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RTO_INITIATED'
  | 'RTO_DELIVERED'
  | 'CANCELLED';

export interface ShippingCarrier {
  id: string;
  carrierCode: string;
  carrierName: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string;
  isActive: boolean;
  supportsPickup: boolean;
  supportsCod: boolean;
  rating?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceabilityCheckRequest {
  pickupPincode?: string;
  deliveryPincode: string;
  isCod?: boolean;
}

export interface ServiceabilityResponseDto {
  pincode: string;
  city: string;
  state: string;
  zoneType?: string;
  zoneTier?: string;
  serviceable?: boolean;
  isServiceable?: boolean;
  codAvailable?: boolean;
  isCodServiceable?: boolean;
  isPrepaidServiceable?: boolean;
  isExpressServiceable?: boolean;
  estimatedTransitDays?: number;
  estimatedDeliveryMinDays?: number;
  estimatedDeliveryMaxDays?: number;
  estimatedDeliveryDate?: string;
  remoteSurcharge?: number;
  primaryCourierPartner?: string;
  availableCarriers?: string[];
}

export interface RateCalculationRequest {
  pickupPincode: string;
  deliveryPincode: string;
  deadWeightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  serviceType?: string;
  isCod?: boolean;
  codAmount?: number;
}

export interface ShippingRateDto {
  carrierCode: string;
  carrierName: string;
  serviceType: string;
  zoneType: string;
  chargeableWeightGrams: number;
  baseRate: number;
  weightSurcharge: number;
  codFee: number;
  fuelSurcharge: number;
  totalShippingCost: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
}

export interface CreateShipmentRequest {
  vendorOrderId: string;
  carrierCode: string;
  serviceType?: string;
  deadWeightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isCod?: boolean;
  codAmount?: number;
  pickupAddressLine1: string;
  pickupAddressLine2?: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  pickupContactPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddressLine1: string;
  recipientAddressLine2?: string;
  recipientCity: string;
  recipientState: string;
  recipientPincode: string;
  packageDescription?: string;
}

export interface ShipmentPackageDto {
  id: string;
  vendorOrderId: string;
  orderNumber: string;
  carrierCode: string;
  carrierName: string;
  awbNumber: string;
  serviceType: string;
  status: ShipmentStatus;
  deadWeightGrams: number;
  volumetricWeightGrams?: number;
  billedWeightGrams: number;
  shippingCost: number;
  codAmount?: number;
  isCod: boolean;
  originCity: string;
  originPincode: string;
  recipientName: string;
  recipientCity: string;
  recipientPincode: string;
  pickupScheduledDate?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryDate?: string;
  currentLocation?: string;
  publicTrackingUrl?: string;
  shippingLabelUrl?: string;
  createdAt: string;
}

export interface TrackingEventDto {
  id: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  carrierStatusCode?: string;
  eventTime: string;
  createdAt: string;
}

export interface TrackingTimelineDto {
  awbNumber: string;
  carrierCode: string;
  carrierName: string;
  orderNumber: string;
  status: ShipmentStatus;
  statusLabel: string;
  originCity: string;
  originPincode: string;
  recipientName: string;
  recipientCity: string;
  recipientPincode: string;
  estimatedDeliveryDate?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  currentLocation?: string;
  events: TrackingEventDto[];
}

export interface ShippingLabelDto {
  awbNumber: string;
  orderNumber: string;
  carrierCode: string;
  carrierName: string;
  serviceType: string;
  routingCode?: string;
  isCod: boolean;
  codAmount?: number;
  billedWeightGrams: number;
  originName: string;
  originAddress: string;
  originCityStatePincode: string;
  originPhone: string;
  recipientName: string;
  recipientAddress: string;
  recipientCityStatePincode: string;
  recipientPhone: string;
  barcodeData: string;
  qrCodeData: string;
  generatedAt: string;
}

export interface LogisticsOverviewDto {
  totalShipments: number;
  activeInTransit: number;
  outForDelivery: number;
  deliveredCount: number;
  rtoCount: number;
  activeCarriersCount: number;
  onTimeDeliveryRate: number;
  recentShipments: ShipmentPackageDto[];
}

export interface AddTrackingEventRequest {
  status: ShipmentStatus;
  location: string;
  description: string;
  carrierStatusCode?: string;
  eventTime?: string;
}
