export interface RevenueTrajectory {
  periodLabel: string;
  gmv: number;
  netCommission: number;
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

export interface VendorAnalyticsOverview {
  totalGrossSales: number;
  netEarnings: number;
  totalCommissionPaid: number;
  totalTcsDeducted: number;
  pendingEscrow: number;
  availableBalance: number;
  totalOrdersCount: number;
  fulfillmentRate: number;
  returnRate: number;
  averageRating: number;
  monthlySales: RevenueTrajectory[];
}
