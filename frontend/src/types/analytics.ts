export interface RevenueTrajectory {
  periodLabel: string;
  gmv: number;
  netCommission: number;
  netSettlement?: number;
  orderCount: number;
}

export interface CategorySalesShare {
  categoryName: string;
  salesAmount: number;
  percentageShare: number;
  itemsSold: number;
}

export interface VendorLeaderboard {
  vendorId: string;
  storeName: string;
  grossSales: number;
  ordersFulfilled: number;
  fulfillmentRate: number;
  customerRating: number;
}

export interface AdminAnalyticsOverview {
  grossMerchandiseValue: number;
  netPlatformRevenue: number;
  escrowInTransit: number;
  totalPayoutsDisbursed: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  activeVendorsCount: number;
  activeCustomersCount: number;
  averageOrderValue: number;
  returnDisputeRate: number;
  revenueTrajectory: RevenueTrajectory[];
  topCategories: CategorySalesShare[];
  topVendors: VendorLeaderboard[];
}

export interface VendorTopProduct {
  productId: string;
  title: string;
  sku: string;
  categoryName: string;
  imageUrl?: string;
  unitsSold: number;
  revenue: number;
  stockQuantity: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface VendorAnalyticsOverview {
  range?: "7d" | "30d" | "90d" | string;
  totalGrossSales: number;
  grossSalesDelta?: number | null;
  netEarnings: number;
  totalCommissionPaid: number;
  totalTcsDeducted: number;
  pendingEscrow: number;
  availableBalance: number;
  totalOrdersCount: number;
  orderVolumeDelta?: number | null;
  fulfillmentRate?: number | null;
  returnRate?: number | null;
  cancellationRate?: number | null;
  averageRating?: number | null;

  // Real operational counts across store
  awaitingDispatchCount?: number | null;
  activeShipmentsCount?: number | null;
  lowStockCount?: number | null;
  outOfStockCount?: number | null;
  pendingRmaCount?: number | null;
  pendingQuoteCount?: number | null;

  // Real top selling products
  topProducts?: VendorTopProduct[];

  monthlySales: RevenueTrajectory[];
}

export interface VendorOperationalBadges {
  orders: number;
  fulfillment: number;
  lowStock: number;
  outOfStock: number;
  returns: number;
  quotes: number;
}
