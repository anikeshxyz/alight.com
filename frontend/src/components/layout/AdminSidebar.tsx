"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  CreditCard,
  Truck,
  RotateCcw,
  Receipt,
  Coins,
  Tag,
  Building2,
  Star,
  LifeBuoy,
  Scale,
  Layout,
  BarChart3,
  Award,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Webhook,
  Sliders,
  Lock,
  ChevronDown,
  ChevronRight,
  Shield,
  FileSpreadsheet,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "marketplace",
    title: "Marketplace",
    icon: Store,
    items: [
      { label: "Vendors", href: "/admin/vendors", icon: Store },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: Layers },
      { label: "Brands", href: "/admin/brands", icon: Tag },
    ],
  },
  {
    id: "commerce",
    title: "Commerce & Operations",
    icon: ShoppingBag,
    items: [
      { label: "Orders Explorer", href: "/admin/orders", icon: ShoppingBag },
      { label: "Returns & RMA", href: "/admin/returns", icon: RotateCcw },
      { label: "Disputes Mediation", href: "/admin/disputes", icon: Scale },
      { label: "Reviews & Q&A", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    id: "supply-chain",
    title: "Supply Chain",
    icon: Truck,
    items: [
      { label: "Inventory Matrix", href: "/admin/inventory", icon: Boxes },
      { label: "Warehouses", href: "/admin/warehouses", icon: Building2 },
      { label: "Logistics & Fleet", href: "/admin/logistics", icon: Truck },
    ],
  },
  {
    id: "finance",
    title: "Finance & Ledgers",
    icon: CreditCard,
    items: [
      { label: "Escrow Settlements", href: "/admin/settlements", icon: CreditCard },
      { label: "Tax & HSN Rules", href: "/admin/taxes", icon: Receipt },
      { label: "Currencies & FX", href: "/admin/currencies", icon: Coins },
    ],
  },
  {
    id: "marketing-cms",
    title: "Marketing & CMS",
    icon: Layout,
    items: [
      { label: "Coupons & Promos", href: "/admin/coupons", icon: Tag },
      { label: "Storefront CMS", href: "/admin/cms", icon: Layout },
    ],
  },
  {
    id: "governance",
    title: "Intelligence & Governance",
    icon: Shield,
    items: [
      { label: "BI Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Vendor Performance", href: "/admin/vendor-performance", icon: Award },
      { label: "Regulatory Compliance", href: "/admin/compliance", icon: ShieldCheck },
      { label: "Risk & Fraud Engine", href: "/admin/risk", icon: ShieldAlert },
      { label: "Support Desk", href: "/admin/support", icon: LifeBuoy },
      { label: "Notification Center", href: "/admin/notifications", icon: Bell },
      { label: "Financial Reports", href: "/admin/reports", icon: FileSpreadsheet },
      { label: "External Integrations", href: "/admin/integrations", icon: Webhook },
      { label: "Admin Operators", href: "/admin/users", icon: Users },
      { label: "RBAC Roles & Matrix", href: "/admin/roles", icon: Shield },
      { label: "System Audit Logs", href: "/admin/audit-logs", icon: Lock },
      { label: "Marketplace Config", href: "/admin/configuration", icon: Sliders },
    ],
  },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  // State to track which collapsible groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    marketplace: true,
    commerce: true,
    "supply-chain": false,
    finance: false,
    "marketing-cms": false,
    governance: true,
  });

  // Automatically expand the group containing the active page
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      const containsActive = group.items.some(
        (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
      );
      if (containsActive) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside className="w-64 bg-brand-slate-900 text-brand-slate-300 min-h-[calc(100vh-57px)] flex flex-col justify-between p-3 border-r border-brand-slate-850 select-none">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-2 border-b border-brand-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-emerald-700 to-brand-slate-900 border border-brand-emerald-500/30 text-brand-gold-400 font-bold flex items-center justify-center text-sm shadow">
            A
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">
              Control Panel
            </h2>
            <p className="text-[10px] text-brand-slate-400">Super Admin Plane</p>
          </div>
        </div>

        {/* Scrollable Nav Area */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-brand-slate-750">
          {/* Top-Level Dashboard Link */}
          <Link
            href="/admin"
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              pathname === "/admin"
                ? "bg-brand-emerald-800 text-white shadow-xs"
                : "text-brand-slate-300 hover:bg-brand-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${pathname === "/admin" ? "text-brand-gold-400" : "text-brand-slate-400"}`} />
            <span>Dashboard</span>
          </Link>

          {/* Collapsible Nav Groups */}
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroups[group.id] ?? false;
            const GroupIcon = group.icon;
            const hasActiveChild = group.items.some(
              (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            );

            return (
              <div key={group.id} className="pt-1">
                {/* Group Header Toggle */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold rounded-md uppercase tracking-wider transition-colors ${
                    hasActiveChild
                      ? "text-brand-gold-400 bg-brand-slate-850/60"
                      : "text-brand-slate-400 hover:text-white hover:bg-brand-slate-850/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {GroupIcon && <GroupIcon className="w-3.5 h-3.5 text-brand-slate-400" />}
                    <span>{group.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-brand-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-brand-slate-400" />
                  )}
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="mt-1 ml-2 pl-2 border-l border-brand-slate-800 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                            isActive
                              ? "bg-brand-emerald-800 text-white font-semibold shadow-xs"
                              : "text-brand-slate-300 hover:bg-brand-slate-800/80 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brand-gold-400" : "text-brand-slate-400"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[9px] bg-brand-slate-800 text-brand-slate-400 px-1 py-0.2 rounded border border-brand-slate-750">
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

      {/* Footer Security Badge */}
      <div className="pt-3 border-t border-brand-slate-800/80 flex items-center justify-between text-[10px] text-brand-slate-400 flex-shrink-0">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          RBAC Active
        </span>
        <span className="font-mono text-brand-slate-400">v2.4 Control Plane</span>
      </div>
    </aside>
  );
};
