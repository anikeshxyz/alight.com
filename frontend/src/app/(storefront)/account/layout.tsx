"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomerSidebar } from "@/components/layout/CustomerSidebar";
import { useAuth } from "@/context/AuthContext";
import { getCustomerDashboardApi } from "@/services/user-service";
import { CustomerDashboardData } from "@/types/dashboard";
import { Menu, X, ShieldAlert, ArrowRight, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null);

  useEffect(() => {
    if (token) {
      getCustomerDashboardApi(token)
        .then((res) => {
          if (res.success && res.data) {
            setDashboardData(res.data);
          }
        })
        .catch(() => {});
    }
  }, [token, pathname]);

  // If auth is still resolving, show clean loading skeleton
  if (authLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Securing customer session...</p>
      </div>
    );
  }

  // If not logged in, prompt user to sign in
  if (!user && !authLoading) {
    return (
      <div className="py-16 max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/80 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer Account Access</h2>
        <p className="text-sm text-slate-600 mb-6">
          Please sign in with your verified credentials to access your orders, track shipments, manage returns, and explore B2B quotes.
        </p>
        <Link href={`/login?redirect=${encodeURIComponent(pathname || "/account")}`}>
          <Button variant="primary" className="w-full flex items-center justify-center gap-2">
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  // Build breadcrumb current title
  const getBreadcrumbTitle = () => {
    if (pathname === "/account") return "Dashboard Overview";
    if (pathname.startsWith("/account/orders")) return "Order History";
    if (pathname.startsWith("/account/returns")) return "Returns & RMA";
    if (pathname.startsWith("/account/addresses")) return "Saved Addresses";
    if (pathname.startsWith("/account/payments")) return "Payment History";
    if (pathname.startsWith("/account/wallet")) return "Wallet & Credits";
    if (pathname.startsWith("/account/coupons")) return "Coupons & Vouchers";
    if (pathname.startsWith("/account/reviews")) return "Reviews & Ratings";
    if (pathname.startsWith("/account/notifications")) return "Notification Center";
    if (pathname.startsWith("/account/business")) return "B2B Business Console";
    if (pathname.startsWith("/account/profile")) return "Personal Profile";
    if (pathname.startsWith("/account/security")) return "Login & Security";
    return "My Account";
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Mobile Navigation Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-emerald-800 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/account" className="hover:text-emerald-800 transition-colors">
            Account
          </Link>
          {pathname !== "/account" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">{getBreadcrumbTitle()}</span>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center gap-1.5 text-xs py-1 px-2.5 h-8 border-slate-300"
          >
            <Menu className="w-4 h-4 text-emerald-800" />
            <span>Menu</span>
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-6 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block sticky top-24">
          <CustomerSidebar metrics={dashboardData?.metrics} />
        </div>

        {/* Mobile Sidebar Modal/Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white p-3 z-10 shadow-2xl h-full overflow-y-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CustomerSidebar
                metrics={dashboardData?.metrics}
                className="w-full border-none shadow-none p-0"
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Account Page Child Area */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
