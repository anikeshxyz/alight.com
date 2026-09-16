import { UserProfile } from "./auth";
import { Order } from "./order";
import { RmaRequest } from "./returns";

export interface DashboardMetrics {
  totalOrders: number;
  activeOrders: number;
  wishlistCount: number;
  openSupportTickets: number;
  activeRfqs: number;
  savedAddressesCount: number;
  walletBalance: number;
  rewardPoints: number;
}

export interface CustomerDashboardData {
  metrics: DashboardMetrics;
  recentOrders: any[];
  recentReturns: RmaRequest[];
  profile: UserProfile;
}
