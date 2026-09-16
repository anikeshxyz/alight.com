import React from "react";
import Link from "next/link";
import { FileText, ShieldAlert, Scale, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-brand-slate-500 hover:text-brand-emerald-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              Terms of Service & Commercial Agreement
            </h1>
            <p className="text-xs text-brand-slate-500 mt-0.5">
              Governing Customer, Vendor, and Marketplace Operations • Information Technology Act, 2000
            </p>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border-brand-slate-200">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>1. Platform Intermediary Role</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            Alight International operates as an electronic marketplace platform that facilitates B2B and B2C transactions between independent registered vendors (&ldquo;Sellers&rdquo;) and buyers (&ldquo;Customers&rdquo;).
            Each transaction generates an official contract of sale directly between the customer and the respective vendor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>2. Pricing, Invoicing & Statutory Taxes</span>
          </h2>
          <ul className="list-disc list-inside text-xs text-brand-slate-600 space-y-1.5 pl-2">
            <li>All catalog prices listed on the platform are in Indian Rupees (INR) and include itemized Goods and Services Tax (GST).</li>
            <li>In accordance with Section 52 of the CGST Act, Alight Marketplace automatically deducts 1% Tax Collected at Source (TCS) on taxable supplies made through the platform.</li>
            <li>Official GST tax invoices with HSN/SAC classification codes are generated on order dispatch and accessible in customer order portals.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>3. Escrow & Vendor Payout Protection</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            To safeguard buyer interests, payments collected upon order confirmation are held in a secure commercial escrow account.
            Funds are released to the vendor&apos;s verified bank account only upon completion of courier delivery and expiration of the standard 7-day buyer return window.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>4. Limitation of Liability & Dispute Resolution</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            Any dispute arising out of or in connection with transactions on Alight shall be governed by the laws of India and subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.
          </p>
        </section>
      </Card>
    </div>
  );
}
