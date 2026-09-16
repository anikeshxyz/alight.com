"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Heart,
  MapPin,
  CreditCard,
  Wallet,
  Tag,
  Star,
  Bell,
  LifeBuoy,
  Building2,
  FileText,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface CustomerSidebarProps {
  metrics?: {
    activeOrders?: number;
    wishlistCount?: number;
    openSupportTickets?: number;
    activeRfqs?: number;
  };
  className?: string;
  onNavigate?: () => void;
}

interface CustomerNavLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface CustomerNavGroup {
  groupTitle: string;
  highlight?: boolean;
  links: CustomerNavLink[];
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  metrics,
  className = "",
  onNavigate,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "Security & Settings": false,
  });

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const navGroups: CustomerNavGroup[] = [
    {
      groupTitle: "My Orders & Assets",
      links: [
        {
          label: "Dashboard Overview",
          href: "/account",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: "Orders & Tracking",
          href: "/account/orders",
          icon: ShoppingBag,
          badge: metrics?.activeOrders && metrics.activeOrders > 0 ? `${metrics.activeOrders} Active` : undefined,
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        },
        {
          label: "Returns & Refunds",
          href: "/account/returns",
          icon: RotateCcw,
        },
        {
          label: "Wishlist",
          href: "/wishlist",
          icon: Heart,
          badge: metrics?.wishlistCount && metrics.wishlistCount > 0 ? `${metrics.wishlistCount}` : undefined,
        },
        {
          label: "Saved Addresses",
          href: "/account/addresses",
          icon: MapPin,
        },
        {
          label: "Payment History",
          href: "/account/payments",
          icon: CreditCard,
        },
        {
          label: "Wallet & Credits",
          href: "/account/wallet",
          icon: Wallet,
        },
        {
          label: "Coupons & Offers",
          href: "/account/coupons",
          icon: Tag,
        },
        {
          label: "My Reviews",
          href: "/account/reviews",
          icon: Star,
        },
        {
          label: "Notifications",
          href: "/account/notifications",
          icon: Bell,
        },
        {
          label: "Support Center",
          href: "/support",
          icon: LifeBuoy,
          badge: metrics?.openSupportTickets && metrics.openSupportTickets > 0 ? `${metrics.openSupportTickets}` : undefined,
          badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        },
      ],
    },
    {
      groupTitle: "B2B & Enterprise",
      highlight: true,
      links: [
        {
          label: "Business Command",
          href: "/account/business",
          icon: Building2,
          badge: "B2B",
          badgeColor: "bg-amber-500/15 text-amber-700 border-amber-300 font-semibold",
        },
        {
          label: "RFQs & Formal Quotes",
          href: "/quotes",
          icon: FileText,
          badge: metrics?.activeRfqs && metrics.activeRfqs > 0 ? `${metrics.activeRfqs} Open` : undefined,
        },
      ],
    },
    {
      groupTitle: "Security & Settings",
      links: [
        {
          label: "Personal Profile",
          href: "/account/profile",
          icon: User,
        },
        {
          label: "Login & Security",
          href: "/account/security",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const getInitials = () => {
    if (!user) return "AL";
    const f = user.firstName ? user.firstName[0] : "";
    const l = user.lastName ? user.lastName[0] : "";
    return (f + l).toUpperCase() || "AL";
  };

  return (
    <aside
      className={`w-72 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between p-4 select-none shrink-0 transition-all ${className}`}
    >
      <div className="space-y-4">
        {/* Customer Identity Banner */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-15">
            <Sparkles className="w-16 h-16 text-amber-300" />
          </div>

          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 font-bold text-base flex items-center justify-center shadow-md shrink-0 border border-amber-200/50">
            {getInitials()}
          </div>

          <div className="min-w-0 flex-1 relative z-10">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white truncate leading-tight">
                {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer" : "Alight Member"}
              </h3>
              {user?.emailVerified && (
                <span title="Verified Customer">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-200/90 truncate font-mono">
              {user?.email || "customer@alight.com"}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-700/60 text-emerald-100 border border-emerald-600/60">
                {user?.roles?.includes("ROLE_BUYER") ? "Buyer Tier" : "Verified Account"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Group list */}
        <nav className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
          {navGroups.map((group) => {
            const isCollapsed = !!collapsedGroups[group.groupTitle];
            return (
              <div
                key={group.groupTitle}
                className={`space-y-1 ${
                  group.highlight
                    ? "p-2 rounded-xl bg-amber-50/50 border border-amber-100/80"
                    : ""
                }`}
              >
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupTitle)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <span className={group.highlight ? "text-amber-800 font-bold" : ""}>
                    {group.groupTitle}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Group Links */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {group.links.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/");

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                            isActive
                              ? "bg-emerald-800 text-white font-semibold shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-amber-300" : "text-slate-400"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                item.badgeColor ||
                                (isActive
                                  ? "bg-white/20 text-white border-white/30"
                                  : "bg-slate-100 text-slate-600 border-slate-200")
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

      {/* Footer Controls */}
      <div className="pt-3 border-t border-slate-100 space-y-1.5 mt-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-emerald-800 font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Marketplace Store</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate();
            logout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 font-medium rounded-xl hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
