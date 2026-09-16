import React from "react";
import Link from "next/link";
import { Compass, Home, Search, ArrowRight, Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-brand-navy-50 text-brand-navy-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-brand-navy-100/50">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            404 • Page Not Found
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-slate-900 sm:text-4xl">
            Lost in the Catalog?
          </h1>
          <p className="text-sm text-brand-slate-600 max-w-sm mx-auto">
            The page or product you are looking for might have been retired, moved, or never existed in the marketplace.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy-600 text-white font-medium text-sm hover:bg-brand-navy-700 transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-brand-slate-200 text-brand-slate-700 font-medium text-sm hover:bg-brand-slate-50 transition"
          >
            <Search className="w-4 h-4 text-brand-slate-400" />
            Browse Products
          </Link>
        </div>

        <div className="pt-6 border-t border-brand-slate-200/80">
          <p className="text-xs font-medium text-brand-slate-400 mb-3">Popular Destinations</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/vendor/apply"
              className="p-2.5 rounded-lg bg-white border border-brand-slate-100 hover:border-brand-navy-200 text-brand-slate-700 flex items-center justify-between group transition shadow-2xs"
            >
              <span>Sell on Alight</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-slate-400 group-hover:text-brand-navy-600 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/track"
              className="p-2.5 rounded-lg bg-white border border-brand-slate-100 hover:border-brand-navy-200 text-brand-slate-700 flex items-center justify-between group transition shadow-2xs"
            >
              <span>Track Orders</span>
              <Package className="w-3.5 h-3.5 text-brand-slate-400 group-hover:text-brand-navy-600 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
