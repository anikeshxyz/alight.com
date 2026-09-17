import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

export const VendorSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* 2. KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 border-brand-slate-200">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </Card>
        ))}
      </div>

      {/* 3. Action Center & Quick Shortcuts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Center (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="p-5 border-brand-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </Card>
        </div>

        {/* Quick Actions (1 col) */}
        <div>
          <Card className="p-5 border-brand-slate-200 space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Sales Chart & Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5 border-brand-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
          </Card>
        </div>
        <div>
          <Card className="p-5 border-brand-slate-200 space-y-3">
            <Skeleton className="h-4 w-36" />
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Products Table Skeleton */}
      <Card className="p-5 border-brand-slate-200 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
};
