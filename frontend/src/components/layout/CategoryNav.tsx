import React from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Bath,
  Shirt,
  PackageCheck,
  ForkKnife,
  Coffee,
  Sparkles,
  Layers,
} from "lucide-react";

export const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Layers, href: "/products" },
  { id: "kitchen", name: "Kitchen Accessories", icon: UtensilsCrossed, href: "/products?category=kitchen-accessories" },
  { id: "bathroom", name: "Bathroom Accessories", icon: Bath, href: "/products?category=bathroom-accessories" },
  { id: "wardrobe", name: "Wardrobe Accessories", icon: Shirt, href: "/products?category=wardrobe-accessories" },
  { id: "storage", name: "Storage Solutions", icon: PackageCheck, href: "/products?category=storage-solutions" },
  { id: "cutlery", name: "Cutlery Trays", icon: ForkKnife, href: "/products?category=cutlery-trays" },
  { id: "tableware", name: "Tableware", icon: Coffee, href: "/products" },
  { id: "accessories", name: "Hardware & Fittings", icon: Sparkles, href: "/products" },
];

export const CategoryNav: React.FC = () => {
  return (
    <nav className="bg-white border-b border-brand-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center space-x-6 overflow-x-auto py-2.5 text-xs font-medium text-brand-slate-700 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <li key={cat.id} className="shrink-0">
                <Link
                  href={cat.href}
                  className="flex items-center gap-1.5 hover:text-brand-emerald-800 transition-colors py-1 px-2 rounded-md hover:bg-brand-slate-50"
                >
                  <Icon className="w-3.5 h-3.5 text-brand-slate-500" />
                  <span>{cat.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
