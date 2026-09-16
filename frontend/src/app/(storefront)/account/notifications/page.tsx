"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Package,
  RotateCcw,
  CreditCard,
  Building2,
  LifeBuoy,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "ORDERS" | "RETURNS" | "PAYMENTS" | "B2B" | "SECURITY";
  date: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Order Dispatch & AWB Assigned",
    message: "Your sub-order has been dispatched with courier AWB DLV-8936458306997 and is currently in transit.",
    category: "ORDERS",
    date: "Today at 10:45 AM",
    read: false,
    link: "/account/orders",
  },
  {
    id: "notif-2",
    title: "Escrow Payment Captured",
    message: "Payment transaction for your multi-item architectural order was captured into secure escrow.",
    category: "PAYMENTS",
    date: "Yesterday",
    read: true,
    link: "/account/payments",
  },
  {
    id: "notif-3",
    title: "B2B RFQ Quotation Received",
    message: "Alight Hardware Atelier responded with pricing terms for your enterprise inquiry.",
    category: "B2B",
    date: "2 days ago",
    read: true,
    link: "/quotes",
  },
  {
    id: "notif-4",
    title: "Security: New Session Established",
    message: "Authenticated login detected from verified Chrome browser session.",
    category: "SECURITY",
    date: "3 days ago",
    read: true,
    link: "/account/security",
  },
];

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ORDERS":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "RETURNS":
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case "PAYMENTS":
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case "B2B":
        return <Building2 className="w-4 h-4 text-teal-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding your shipments, invoices, returns, and RFQs
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto shadow-2xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            You&apos;re completely up to date. Important delivery alerts will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                n.read
                  ? "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
                  : "bg-emerald-50/40 border-emerald-200 shadow-xs ring-1 ring-emerald-600/15"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getCategoryIcon(n.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs ${n.read ? "font-semibold text-slate-800" : "font-bold text-emerald-950"}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{n.date}</p>
                </div>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="text-xs font-bold text-emerald-800 hover:underline shrink-0 self-center"
                >
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
