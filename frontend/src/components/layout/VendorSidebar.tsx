"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Truck,
  RotateCcw,
  Receipt,
  Tag,
  Star,
  DollarSign,
  FileSpreadsheet,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  LifeBuoy,
  Settings,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Store,
  X,
} from "lucide-react";
import { getVendorOperationalBadgesApi } from "@/services/analytics-service";
import { VendorOperationalBadges } from "@/types/analytics";

interface NavLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  groupTitle: string;
  defaultOpen?: boolean;
  links: NavLink[];
}

export const VENDOR_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: "Core Operations",
    defaultOpen: true,
    links: [
      { label: "Dashboard", href: "/vendor", icon: LayoutDashboard },
      { label: "Products Catalog", href: "/vendor/products", icon: Package },
      { label: "Pricing & B2B Tiers", href: "/vendor/pricing", icon: DollarSign },
      { label: "Inventory Matrix", href: "/vendor/inventory", icon: Boxes },
      { label: "Warehouses & Hubs", href: "/vendor/warehouses", icon: Store },
    ],
  },
  {
    groupTitle: "Orders & Logistics",
    defaultOpen: true,
    links: [
      { label: "Orders & Processing", href: "/vendor/orders", icon: ShoppingBag },
      { label: "Fulfillment & Dispatch", href: "/vendor/fulfillment", icon: Truck },
      { label: "Returns & RMA", href: "/vendor/returns", icon: RotateCcw },
    ],
  },
  {
    groupTitle: "B2B & Marketing",
    defaultOpen: true,
    links: [
      { label: "B2B Quotes (RFQ)", href: "/vendor/quotes", icon: Receipt },
      { label: "Coupons & Promos", href: "/vendor/coupons", icon: Tag },
    ],
  },
  {
    groupTitle: "Customer Care",
    defaultOpen: false,
    links: [
      { label: "Customer Experience", href: "/vendor/customers", icon: Star },
      { label: "Support & Disputes", href: "/vendor/support", icon: LifeBuoy },
    ],
  },
  {
    groupTitle: "Financial & Reports",
    defaultOpen: true,
    links: [
      { label: "Finance & Settlements", href: "/vendor/finance", icon: DollarSign },
      { label: "Reports & Exports", href: "/vendor/reports", icon: FileSpreadsheet },
    ],
  },
  {
    groupTitle: "Intelligence & Health",
    defaultOpen: false,
    links: [
      { label: "Business Analytics", href: "/vendor/analytics", icon: BarChart3 },
      { label: "Account Health", href: "/vendor/performance", icon: ShieldAlert },
    ],
  },
  {
    groupTitle: "Governance & Settings",
    defaultOpen: false,
    links: [
      { label: "Compliance & KYC", href: "/vendor/compliance", icon: ShieldCheck },
      { label: "Store Settings", href: "/vendor/settings", icon: Settings },
    ],
  },
];

export interface VendorSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const VendorSidebar: React.FC<VendorSidebarProps> = ({
  mobileOpen = false,
  onClose,
}) => {
  const pathname = usePathname();
  const [badges, setBadges] = useState<VendorOperationalBadges | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "Customer Care": true,
    "Intelligence & Health": true,
    "Governance & Settings": true,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadBadges() {
      try {
        const res = await getVendorOperationalBadgesApi();
        if (isMounted && res.success && res.data) {
          setBadges(res.data);
        }
      } catch (err) {
        // Silently fail, badge count stays hidden
      }
    }
    loadBadges();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close drawer on ESC key press & lock background scrolling
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen, onClose]);

  // Close drawer on route change
  useEffect(() => {
    if (mobileOpen) {
      onClose?.();
    }
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getDynamicBadge = (href: string) => {
    if (!badges) return null;
    if (href === "/vendor/orders" && badges.orders > 0) {
      return { count: badges.orders, variant: "critical" };
    }
    if (href === "/vendor/fulfillment" && badges.fulfillment > 0) {
      return { count: badges.fulfillment, variant: "info" };
    }
    if (href === "/vendor/inventory") {
      const stockAlerts = (badges.lowStock || 0) + (badges.outOfStock || 0);
      if (stockAlerts > 0) {
        return { count: stockAlerts, variant: "warning" };
      }
    }
    if (href === "/vendor/returns" && badges.returns > 0) {
      return { count: badges.returns, variant: "warning" };
    }
    if (href === "/vendor/quotes" && badges.quotes > 0) {
      return { count: badges.quotes, variant: "info" };
    }
    return null;
  };

  const renderNavContent = (isMobile: boolean) => (
    <>
      <div className="space-y-4">
        {/* Portal Header */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl bg-brand-slate-50 border border-brand-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald-800 text-brand-gold-400 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              V
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-brand-slate-900 leading-tight truncate">
                Merchant Console
              </h2>
              <p className="text-[10px] text-brand-slate-500 truncate">Alight Operating Hub</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 rounded-lg text-brand-slate-400 hover:text-brand-slate-700 hover:bg-brand-slate-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Group list */}
        <nav
          aria-label="Vendor Portal Links"
          className="space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 custom-scrollbar"
        >
          {VENDOR_NAV_GROUPS.map((group) => {
            const isCollapsed = !!collapsedGroups[group.groupTitle];
            return (
              <div key={group.groupTitle} className="space-y-1">
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupTitle)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-slate-400 hover:text-brand-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 rounded-md"
                >
                  <span>{group.groupTitle}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-brand-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-brand-slate-400" />
                  )}
                </button>

                {/* Group Links */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5" role="list">
                    {group.links.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/vendor" && pathname.startsWith(item.href));
                      const badge = getDynamicBadge(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (isMobile) onClose?.();
                          }}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 min-h-[40px] ${
                            isActive
                              ? "bg-brand-emerald-800 text-white font-bold shadow-xs"
                              : "text-brand-slate-600 hover:bg-brand-slate-100 hover:text-brand-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-brand-gold-300" : "text-brand-slate-400"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {badge && (
                            <span
                              className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                                isActive
                                  ? "bg-white/25 text-white"
                                  : badge.variant === "critical"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : badge.variant === "warning"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {badge.count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Return Link */}
      <div className="pt-3 border-t border-brand-slate-100">
        <Link
          href="/"
          onClick={() => {
            if (isMobile) onClose?.();
          }}
          className="flex items-center gap-2 px-2.5 py-2.5 text-xs text-brand-slate-500 hover:text-brand-emerald-800 font-medium rounded-lg hover:bg-brand-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-brand-slate-200 min-h-[calc(100vh-57px)] flex-col justify-between p-3.5 select-none shrink-0 shadow-2xs">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <div
        id="vendor-sidebar-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Merchant Console Navigation"
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-brand-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer slide panel */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between p-4 transform transition-transform duration-300 ease-in-out z-10 select-none ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderNavContent(true)}
        </aside>
      </div>
    </>
  );
};

