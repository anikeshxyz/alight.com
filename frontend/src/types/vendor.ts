export type VendorStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type BusinessType =
  | "INDIVIDUAL"
  | "PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "PRIVATE_LIMITED"
  | "PUBLIC_LIMITED";

export interface VendorBusinessDetails {
  id: string;
  legalBusinessName: string;
  businessType: BusinessType;
  taxIdGstin?: string;
  panNumber?: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  bankAccountHolderName: string;
  businessLicenseUrl?: string;
  taxCertificateUrl?: string;
  idProofUrl?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPickupAddress {
  id: string;
  contactPerson: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  primary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  userEmail: string;
  storeName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  supportEmail: string;
  supportPhone: string;
  commissionPercentage: number;
  status: VendorStatus;
  rejectionReason?: string;
  businessDetails?: VendorBusinessDetails;
  pickupAddresses?: VendorPickupAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicVendorStore {
  id: string;
  storeName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  supportEmail: string;
  supportPhone: string;
  memberSince: string;
}

export interface VendorApplicationPayload {
  storeName: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  supportEmail: string;
  supportPhone: string;
  legalBusinessName: string;
  businessType: BusinessType;
  taxIdGstin?: string;
  panNumber?: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  bankAccountHolderName: string;
  pickupContactPerson: string;
  pickupContactPhone: string;
  pickupAddressLine1: string;
  pickupAddressLine2?: string;
  pickupCity: string;
  pickupState: string;
  pickupPostalCode: string;
  pickupCountry?: string;
}

export interface UpdateVendorProfilePayload {
  storeName: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  supportEmail: string;
  supportPhone: string;
}

export interface UpdateBusinessDetailsPayload {
  legalBusinessName: string;
  businessType: BusinessType;
  taxIdGstin?: string;
  panNumber?: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  bankAccountHolderName: string;
  businessLicenseUrl?: string;
  taxCertificateUrl?: string;
  idProofUrl?: string;
}

export interface UpdateKycDocumentsPayload {
  businessLicenseUrl?: string;
  taxCertificateUrl?: string;
  idProofUrl?: string;
}

export interface CreatePickupAddressPayload {
  contactPerson: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  primary?: boolean;
}

export interface UpdateVendorStatusPayload {
  status: VendorStatus;
  rejectionReason?: string;
}

export interface UpdateCommissionPayload {
  commissionPercentage: number;
}
