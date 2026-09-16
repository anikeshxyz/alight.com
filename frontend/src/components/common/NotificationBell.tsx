"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Radio,
  FileQuestion,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from "@/services/notification-service";
import { NotificationItem, NotificationType } from "@/types/notification";

interface NotificationBellProps {
  variant?: "light" | "dark";
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  variant = "light",
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadNotificationCountApi();
      if (res.success && res.data) {
        setUnreadCount(res.data.count);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getNotificationsApi(0, 15, activeTab === "unread");
      if (res.success && res.data) {
        setNotifications(res.data.content);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "ORDER_CONFIRMED":
        return <Package className="w-4 h-4 text-emerald-600" />;
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
        return <Truck className="w-4 h-4 text-blue-600" />;
      case "RMA_UPDATE":
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case "TICKET_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-emerald-700" />;
      case "PROMOTION":
        return <Sparkles className="w-4 h-4 text-pink-600" />;
      case "SYSTEM_BROADCAST":
        return <Radio className="w-4 h-4 text-indigo-600" />;
      default:
        return <FileQuestion className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!user) return null;

  const isDark = variant === "dark";

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors flex items-center justify-center ${
          isDark
            ? "text-slate-300 hover:text-white hover:bg-slate-800"
            : "text-brand-slate-700 hover:text-brand-emerald-800 hover:bg-brand-slate-100"
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? "bg-slate-900 border-slate-750 text-slate-100"
              : "bg-white border-brand-slate-200 text-brand-slate-900"
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 border-b flex items-center justify-between ${
              isDark
                ? "border-slate-800 bg-slate-950"
                : "border-brand-slate-100 bg-brand-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-emerald-700 hover:text-brand-emerald-800 dark:text-brand-gold-400 font-medium flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            className={`flex border-b text-xs ${
              isDark ? "border-slate-800 bg-slate-900" : "border-brand-slate-100 bg-white"
            }`}
          >
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                activeTab === "all"
                  ? isDark
                    ? "border-brand-gold-500 text-brand-gold-400"
                    : "border-brand-emerald-800 text-brand-emerald-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                activeTab === "unread"
                  ? isDark
                    ? "border-brand-gold-500 text-brand-gold-400"
                    : "border-brand-emerald-800 text-brand-emerald-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Unread only
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications found.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-xs transition-colors flex gap-3 items-start ${
                    !item.isRead
                      ? isDark
                        ? "bg-slate-800/60 hover:bg-slate-800"
                        : "bg-emerald-50/50 hover:bg-emerald-50"
                      : isDark
                      ? "hover:bg-slate-800/40"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-1.5">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      {item.actionUrl ? (
                        <Link
                          href={item.actionUrl}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] text-brand-emerald-800 dark:text-brand-gold-400 font-semibold hover:underline"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : <span />}

                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className={`p-2.5 border-t text-center text-xs ${
              isDark
                ? "border-slate-800 bg-slate-950"
                : "border-brand-slate-100 bg-brand-slate-50"
            }`}
          >
            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-brand-emerald-800 dark:hover:text-brand-gold-400 font-medium"
            >
              Need help? Visit Customer Support Desk →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
