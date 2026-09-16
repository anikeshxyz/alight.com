import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-full border-2 border-brand-navy-100 animate-ping absolute opacity-50"></div>
        <div className="w-12 h-12 rounded-2xl bg-brand-navy-600/10 flex items-center justify-center border border-brand-navy-200/50 backdrop-blur-xs">
          <Loader2 className="w-6 h-6 text-brand-navy-600 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-brand-slate-600 animate-pulse">
        Loading Alight Marketplace...
      </p>
    </div>
  );
}
