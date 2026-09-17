"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { VendorSidebar } from "@/components/layout/VendorSidebar";
import { useAuth } from "@/context/AuthContext";
import { getCurrentVendorApi } from "@/services/vendor-service";
import { VendorProfile } from "@/types/vendor";
import {
  Store,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Loader2,
  Clock,
  AlertTriangle,
  Menu,
} from "lucide-react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isVendor, login, logout } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentVendor, setCurrentVendor] = useState<VendorProfile | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    async function loadVendorProfile() {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "");
      if (!activeToken) {
        setCurrentVendor(null);
        return;
      }
      try {
        const res = await getCurrentVendorApi(activeToken);
        if (res?.success && res.data) {
          setCurrentVendor(res.data);
        } else {
          setCurrentVendor(null);
        }
      } catch (err) {
        setCurrentVendor(null);
      }
    }
    if (token) {
      loadVendorProfile();
    } else {
      setCurrentVendor(null);
    }
  }, [token]);

  const handleDemoVendorLogin = async () => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      await login({ email: "seller@alight.com", password: "password123" });
      window.location.reload();
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in as demo seller");
    } finally {
      setLoggingIn(false);
    }
  };

  const vendorName = currentVendor?.storeName || (user && isVendor
    ? `${user.firstName} ${user.lastName} (Seller)`
    : "Alight Hardware Atelier");

  return (
    <div className="min-h-screen bg-brand-slate-50 flex flex-col overflow-x-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-brand-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-xl text-brand-slate-600 hover:text-brand-slate-900 hover:bg-brand-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-700 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="vendor-sidebar-drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/vendor" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/images/alight-logo.png"
              alt="ALIGHT"
              className="h-7 sm:h-8 w-auto object-contain shrink-0"
            />
            <div className="border-l border-brand-slate-200 pl-2.5 sm:pl-3 min-w-0">
              <span className="text-xs font-bold text-brand-emerald-900 uppercase tracking-wider block truncate">
                Vendor Center
              </span>
              <span className="text-[10px] text-brand-slate-400 font-medium block truncate">
                Merchant Console
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 text-xs">
          {(!token || !isVendor) ? (
            <button
              onClick={handleDemoVendorLogin}
              disabled={loggingIn}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2.5 sm:px-3 py-2 rounded-lg shadow-sm transition-all min-h-[40px]"
            >
              {loggingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{loggingIn ? "Authenticating..." : "⚡ 1-Click Seller Login"}</span>
              <span className="sm:hidden">{loggingIn ? "..." : "⚡ Login"}</span>
            </button>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-brand-slate-50 border border-brand-slate-200 rounded-lg max-w-[200px] lg:max-w-[280px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-brand-slate-500 text-[10px] block leading-tight">Merchant Store</span>
                  <strong className="text-brand-slate-800 font-semibold truncate block leading-tight">{vendorName}</strong>
                </div>
              </div>

              {currentVendor?.status === "APPROVED" ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">Verified Seller</span>
                  <span className="sm:hidden">Active</span>
                </span>
              ) : currentVendor?.status === "REJECTED" ? (
                <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span className="hidden sm:inline">Verification Rejected</span>
                  <span className="sm:hidden">Rejected</span>
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                  <span className="hidden sm:inline">Under Verification</span>
                  <span className="sm:hidden">Pending</span>
                </span>
              )}
            </>
          )}

          <Link
            href="/"
            className="flex items-center gap-1.5 text-brand-slate-600 hover:text-brand-emerald-800 font-medium px-2.5 py-2 rounded-lg hover:bg-brand-slate-100 transition-colors min-h-[40px] min-w-[40px] justify-center"
            title="Back to Marketplace Storefront"
            aria-label="Back to Marketplace Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Storefront</span>
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-2 rounded-lg font-medium transition-colors min-h-[40px] min-w-[40px] justify-center"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Active Session & Unauthenticated Alert Banner */}
      {user && !isVendor ? (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Signed in as <strong>{user.email} (Administrator)</strong>. Seller Center features require a registered seller account. To manage a seller store (such as <strong>raj anik</strong>), please sign in with that seller account.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-amber-700 hidden lg:inline">
              💡 Tip: Open the Admin Console in a <strong>Private / Incognito window</strong> so your seller session is not replaced.
            </span>
            <button
              onClick={() => logout()}
              className="font-bold underline hover:text-amber-950 ml-2 min-h-[36px]"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      ) : (!token || !isVendor) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>
              You are currently viewing in guest preview mode. To publish products, update inventory, or manage orders, please sign in as a verified merchant.
            </span>
          </div>
          <button
            onClick={handleDemoVendorLogin}
            disabled={loggingIn}
            className="font-bold underline hover:text-amber-950 shrink-0 text-left sm:text-right min-h-[36px]"
          >
            {loggingIn ? "Signing in..." : "Sign In with Demo Seller Account (seller@alight.com)"}
          </button>
        </div>
      )}

      {loginError && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-xs text-rose-800 text-center">
          {loginError}
        </div>
      )}

      {/* Main Layout Body: Sidebar + Intelligent Canvas */}
      <div className="flex flex-1 overflow-x-hidden min-h-0">
        <VendorSidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

