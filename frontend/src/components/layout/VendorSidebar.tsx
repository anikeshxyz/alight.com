"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Truck,
  RotateCcw,
  Receipt,
  Tag,
  Megaphone,
  Star,
  DollarSign,
  FileSpreadsheet,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Award,
  LifeBuoy,
  Users,
  History,
  Settings,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Store,
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
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
      { label: "Pricing & B2B Tiers", href: "/vendor/pricing", icon: DollarSign, badge: "New" },
      { label: "Inventory Matrix", href: "/vendor/inventory", icon: Boxes },
      { label: "Warehouses & Hubs", href: "/vendor/warehouses", icon: Store },
    ],
  },
  {
    groupTitle: "Orders & Logistics",
    defaultOpen: true,
    links: [
      { label: "Orders & Processing", href: "/vendor/orders", icon: ShoppingBag },
      { label: "Fulfillment & Dispatch", href: "/vendor/fulfillment", icon: Truck, badge: "Live" },
      { label: "Returns & RMA", href: "/vendor/returns", icon: RotateCcw },
    ],
  },
  {
    groupTitle: "B2B & Marketing",
    defaultOpen: true,
    links: [
      { label: "B2B Quotes (RFQ)", href: "/vendor/quotes", icon: Receipt },
      { label: "Marketing & Promos", href: "/vendor/marketing", icon: Tag },
      { label: "Sponsored Ads", href: "/vendor/advertising", icon: Megaphone, badge: "Beta" },
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
      { label: "Brand Registry", href: "/vendor/brand", icon: Award },
      { label: "Team & Permissions", href: "/vendor/team", icon: Users },
      { label: "Activity Logs", href: "/vendor/activity", icon: History },
      { label: "Store Settings", href: "/vendor/settings", icon: Settings },
    ],
  },
];

export const VendorSidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "Customer Care": true,
    "Intelligence & Health": true,
    "Governance & Settings": true,
  });

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside className="w-64 bg-white border-r border-brand-slate-200 min-h-[calc(100vh-57px)] flex flex-col justify-between p-3.5 select-none shrink-0 shadow-2xs">
      <div className="space-y-4">
        {/* Portal Header */}
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-brand-slate-50 border border-brand-slate-100">
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

        {/* Navigation Group list */}
        <nav className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1 custom-scrollbar">
          {VENDOR_NAV_GROUPS.map((group) => {
            const isCollapsed = !!collapsedGroups[group.groupTitle];
            return (
              <div key={group.groupTitle} className="space-y-1">
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupTitle)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-slate-400 hover:text-brand-slate-700 transition-colors"
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
                  <div className="space-y-0.5 pt-0.5">
                    {group.links.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== "/vendor" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            isActive
                              ? "bg-brand-emerald-800 text-white font-bold shadow-xs"
                              : "text-brand-slate-600 hover:bg-brand-slate-100 hover:text-brand-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-brand-gold-300" : "text-brand-slate-400"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-brand-emerald-50 text-brand-emerald-800 border border-brand-emerald-200"
                              }`}
                            >
                              {item.badge}
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
          className="flex items-center gap-2 px-2.5 py-2 text-xs text-brand-slate-500 hover:text-brand-emerald-800 font-medium rounded-lg hover:bg-brand-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    </aside>
  );
};
