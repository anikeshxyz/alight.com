import React from "react";
import Link from "next/link";
import { Package, ShoppingBag, Boxes, Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const VendorQuickActions: React.FC = () => {
  const actions = [
    {
      title: "Add Product",
      href: "/vendor/products/new",
      icon: Package,
      description: "Create SKU listing",
    },
    {
      title: "Process Orders",
      href: "/vendor/orders",
      icon: ShoppingBag,
      description: "Pack & dispatch",
    },
    {
      title: "Inventory Matrix",
      href: "/vendor/inventory",
      icon: Boxes,
      description: "Stock & transfers",
    },
    {
      title: "Settlements",
      href: "/vendor/finance",
      icon: Receipt,
      description: "Escrow & payouts",
    },
  ];

  return (
    <Card className="p-5 border-brand-slate-200/90 shadow-2xs space-y-3">
      <div>
        <h3 className="text-sm font-bold text-brand-slate-900 tracking-tight">
          Quick Shortcuts
        </h3>
        <p className="text-[11px] text-brand-slate-500">
          Fast-access links to common workbench actions
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.href}
              href={act.href}
              className="p-3 rounded-xl bg-brand-slate-50 hover:bg-brand-emerald-50/60 border border-brand-slate-200/80 hover:border-brand-emerald-300 font-semibold text-brand-slate-800 hover:text-brand-emerald-900 flex flex-col items-center text-center gap-1.5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-brand-emerald-100/60 flex items-center justify-center text-brand-emerald-800 shadow-2xs transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs">{act.title}</span>
              <span className="text-[10px] text-brand-slate-400 group-hover:text-brand-slate-600 font-normal">
                {act.description}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};
