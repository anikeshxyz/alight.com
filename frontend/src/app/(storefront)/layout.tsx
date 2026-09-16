import React from "react";
import { StorefrontHeader } from "@/components/layout/StorefrontHeader";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { StorefrontFooter } from "@/components/layout/StorefrontFooter";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <StorefrontHeader />
      <CategoryNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}
