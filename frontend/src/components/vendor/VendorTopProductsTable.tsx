import React from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VendorEmptyState } from "./VendorEmptyState";
import { VendorTopProduct } from "@/types/analytics";

export interface VendorTopProductsTableProps {
  topProducts?: VendorTopProduct[];
  periodLabel?: string;
  className?: string;
}

export const VendorTopProductsTable: React.FC<VendorTopProductsTableProps> = ({
  topProducts = [],
  periodLabel,
  className = "",
}) => {
  return (
    <Card className={`p-5 border-brand-slate-200/90 shadow-2xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-brand-slate-900 tracking-tight">
              Top Products by Sales & Revenue
            </h3>
            {periodLabel && (
              <span className="text-[10px] font-semibold bg-brand-slate-100 text-brand-slate-600 px-2 py-0.5 rounded-md border border-brand-slate-200">
                {periodLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Real order-item unit volume and gross sales revenue derived from non-cancelled customer orders
          </p>
        </div>
        <Link
          href="/vendor/products"
          className="text-xs text-brand-emerald-800 font-bold hover:text-brand-emerald-950 flex items-center gap-1 hover:underline"
        >
          <span>Manage Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-brand-slate-200 text-brand-slate-500 font-semibold">
              <th scope="col" className="pb-2.5">
                Product / SKU
              </th>
              <th scope="col" className="pb-2.5">
                Category
              </th>
              <th scope="col" className="pb-2.5 text-center">
                Units Sold
              </th>
              <th scope="col" className="pb-2.5 text-right">
                Sales Revenue
              </th>
              <th scope="col" className="pb-2.5 text-center">
                Stock
              </th>
              <th scope="col" className="pb-2.5 text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  <VendorEmptyState
                    icon={Package}
                    title="No Sales in Selected Period"
                    description="No orders have been recorded for this timeframe yet. As customer orders are confirmed, top-selling products will appear here."
                    action={{
                      label: "View Catalog",
                      href: "/vendor/products",
                    }}
                  />
                </td>
              </tr>
            ) : (
              topProducts.map((p) => {
                const isOutOfStock = p.status === "OUT_OF_STOCK" || p.stockQuantity === 0;
                const isLowStock = p.status === "LOW_STOCK" || (p.stockQuantity < 10 && p.stockQuantity > 0);

                return (
                  <tr key={p.productId || p.sku} className="hover:bg-brand-slate-50/70 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-slate-100 flex items-center justify-center shrink-0 border border-brand-slate-200/60 overflow-hidden">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-3.5 h-3.5 text-brand-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-brand-slate-900 line-clamp-1">
                            {p.title}
                          </p>
                          <p className="text-[10px] font-mono text-brand-slate-400 mt-0.5">
                            {p.sku || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-brand-slate-600 truncate max-w-[120px]">
                      {p.categoryName || "General"}
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-brand-slate-800 tabular-nums">
                      {p.unitsSold.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-right font-bold text-brand-slate-900 tabular-nums">
                      ₹{p.revenue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-brand-slate-800 tabular-nums">
                      {p.stockQuantity}
                    </td>
                    <td className="py-3 text-right">
                      {isOutOfStock ? (
                        <Badge
                          variant="error"
                          size="sm"
                          className="bg-rose-50 text-rose-800 border-rose-200 text-[10px]"
                        >
                          Out of Stock
                        </Badge>
                      ) : isLowStock ? (
                        <Badge
                          variant="warning"
                          size="sm"
                          className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]"
                        >
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge
                          variant="success"
                          size="sm"
                          className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
                        >
                          In Stock
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
