"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, Loader2, LogOut, ArrowLeft } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isAdmin, isSuperAdmin, login, logout } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleDemoAdminLogin = async () => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      await login({ email: "admin@alight.com", password: "password123" });
      window.location.reload();
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in as demo admin");
    } finally {
      setLoggingIn(false);
    }
  };

  const hasAdminAccess = token && (isAdmin || isSuperAdmin);

  return (
    <div className="min-h-screen bg-brand-slate-900 text-brand-slate-100 flex flex-col">
      {/* Admin Control Bar */}
      <header className="bg-brand-slate-950 border-b border-brand-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-1 bg-white rounded-lg shadow-sm">
              <img
                src="/images/alight-logo.png"
                alt="ALIGHT"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="font-extrabold text-white tracking-tight text-sm">
              Admin Console
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {!hasAdminAccess ? (
            <button
              onClick={handleDemoAdminLogin}
              disabled={loggingIn}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              {loggingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>{loggingIn ? "Authenticating..." : "⚡ 1-Click Admin Login"}</span>
            </button>
          ) : (
            <>
              <span className="text-brand-slate-400">
                Logged in as: <strong className="text-emerald-400">{user?.email}</strong>
              </span>
              <span className="bg-brand-emerald-900 text-brand-emerald-200 border border-brand-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"}
              </span>
            </>
          )}

          <Link
            href="/"
            className="flex items-center gap-1 text-brand-slate-400 hover:text-white px-2 py-1 rounded hover:bg-brand-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1 rounded font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Unauthenticated Alert Banner */}
      {!hasAdminAccess && (
        <div className="bg-amber-950/90 border-b border-amber-700/50 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              You are currently viewing admin console in read-only guest mode. To approve vendors, manage categories, or adjust system inventory, please authenticate.
            </span>
          </div>
          <button
            onClick={handleDemoAdminLogin}
            disabled={loggingIn}
            className="font-bold underline text-amber-300 hover:text-amber-100 ml-4 shrink-0"
          >
            {loggingIn ? "Signing in..." : "Sign In with Demo Admin Account (admin@alight.com)"}
          </button>
        </div>
      )}

      {loginError && (
        <div className="bg-rose-950 border-b border-rose-800 px-6 py-2 text-xs text-rose-200 text-center">
          {loginError}
        </div>
      )}

      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full bg-brand-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
