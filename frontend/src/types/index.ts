export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  traceId?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  traceId?: string;
  timestamp?: string;
  path?: string;
  validationErrors?: Record<string, string>;
}

export interface HealthData {
  status: string;
  version?: string;
  environment?: string;
  timestamp?: string;
  uptimeSeconds?: number;
  database?: {
    status: string;
    databaseProductName?: string;
    databaseProductVersion?: string;
    responseTimeMs?: number;
  };
  memory?: {
    maxMb: number;
    totalMb: number;
    freeMb: number;
    usedMb: number;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
}

export * from './logistics';
export * from './returns';
export * from './coupon';
