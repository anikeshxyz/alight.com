"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, LifeBuoy } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side crash to error monitoring
    console.error("Client Error Boundary captured error:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-brand-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-brand-slate-900">
            Something went wrong
          </h1>
          <p className="text-sm text-brand-slate-600">
            We encountered an unexpected error while rendering this page. Our technical team has been notified.
          </p>
          {error?.digest && (
            <div className="mt-2 text-xs font-mono text-brand-slate-400 bg-brand-slate-50 py-1 px-2.5 rounded border border-brand-slate-200/50 inline-block">
              Incident ID: {error.digest}
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy-600 text-white font-medium text-sm hover:bg-brand-navy-700 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-slate-100 text-brand-slate-700 font-medium text-sm hover:bg-brand-slate-200 transition"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        <div className="pt-4 border-t border-brand-slate-100 text-xs text-brand-slate-500 flex items-center justify-center gap-1.5">
          <LifeBuoy className="w-4 h-4 text-brand-slate-400" />
          <span>Need help? Contact <Link href="/support" className="text-brand-navy-600 font-semibold underline hover:text-brand-navy-800">Customer Support</Link></span>
        </div>
      </div>
    </div>
  );
}
