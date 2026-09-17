"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { VendorSidebar } from "@/components/layout/VendorSidebar";
import { useAuth } from "@/context/AuthContext";
import { getCurrentVendorApi } from "@/services/vendor-service";
import { VendorProfile } from "@/types/vendor";
import { Store, LogOut, ArrowLeft, ShieldCheck, KeyRound, Loader2, Clock, AlertTriangle } from "lucide-react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isVendor, login, logout } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentVendor, setCurrentVendor] = useState<VendorProfile | null>(null);

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
    <div className="min-h-screen bg-brand-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-brand-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/vendor" className="flex items-center gap-3">
            <img
              src="/images/alight-logo.png"
              alt="ALIGHT"
              className="h-8 w-auto object-contain"
            />
            <div className="border-l border-brand-slate-200 pl-3">
              <span className="text-xs font-bold text-brand-emerald-900 uppercase tracking-wider block">
                Vendor Center
              </span>
              <span className="text-[10px] text-brand-slate-400 font-medium block">
                Merchant Console
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {(!token || !isVendor) ? (
            <button
              onClick={handleDemoVendorLogin}
              disabled={loggingIn}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              {loggingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>{loggingIn ? "Authenticating..." : "⚡ 1-Click Seller Login"}</span>
            </button>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-brand-slate-50 border border-brand-slate-200 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-brand-slate-500 text-[11px] block">Merchant Store</span>
                  <strong className="text-brand-slate-800 font-semibold">{vendorName}</strong>
                </div>
              </div>

              {currentVendor?.status === "APPROVED" ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Seller Active
                </span>
              ) : currentVendor?.status === "REJECTED" ? (
                <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Verification Rejected
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                  Under Verification
                </span>
              )}
            </>
          )}

          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 text-brand-slate-600 hover:text-brand-emerald-800 font-medium px-2.5 py-1 rounded-lg hover:bg-brand-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Unauthenticated Alert Banner */}
      {/* Active Session & Unauthenticated Alert Banner */}
      {user && !isVendor ? (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-amber-900">
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
              className="font-bold underline hover:text-amber-950 ml-2"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      ) : (!token || !isVendor) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>
              You are currently viewing in guest preview mode. To publish products, update inventory, or manage orders, please sign in as a verified merchant.
            </span>
          </div>
          <button
            onClick={handleDemoVendorLogin}
            disabled={loggingIn}
            className="font-bold underline hover:text-amber-950 ml-4 shrink-0"
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

      <div className="flex flex-1">
        <VendorSidebar />
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
