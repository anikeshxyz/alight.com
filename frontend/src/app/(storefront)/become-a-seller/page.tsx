"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Store,
  TrendingUp,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Building2,
  FileCheck2,
  Layers,
  HelpCircle,
  CreditCard,
  Sparkles,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";

export default function BecomeASellerPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What are the requirements to sell on Alight?",
      a: "To become a verified seller, you need an active GSTIN, a Business PAN card, an active bank account in your company/proprietorship name, and a warehouse/dispatch address for pickup logistics."
    },
    {
      q: "How much does it cost to list products on Alight?",
      a: "Listing products on Alight is 100% free! There are zero upfront registration or monthly subscription fees. You only pay a competitive category commission when a confirmed sale is completed."
    },
    {
      q: "When and how do I receive payouts for my sales?",
      a: "Payouts are automatically processed on a weekly 7-day cycle directly into your registered bank account after customer delivery confirmation, with complete 1% TCS deduction receipts and GSTR-1 reporting."
    },
    {
      q: "Who handles shipping and delivery to the customer?",
      a: "Alight partners with leading pan-India logistics carriers. Once you receive an order, simply print the automated 4x6 thermal shipping label from your Vendor Console and our courier partners will pick it up from your warehouse."
    },
    {
      q: "Can I sell in bulk or receive Wholesale RFQ inquiries?",
      a: "Yes! Alight connects you with architects, builders, and interior designers who regularly post Bulk Request for Quotations (RFQs). You can quote custom wholesale rates directly through your Vendor Hub."
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-slate-950 via-brand-slate-900 to-brand-emerald-950 text-white p-8 sm:p-12 lg:p-16 border border-brand-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold-500/20 border border-brand-gold-500/40 text-brand-gold-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold-400" />
            <span>Alight Verified Partner Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Grow Your Hardware & Fittings Business on <span className="text-brand-gold-400">Alight</span>
          </h1>

          <p className="text-sm sm:text-base text-brand-slate-300 leading-relaxed max-w-2xl">
            Directly connect your manufacturing units and distribution hubs with thousands of verified architects, interior contractors, and premium retail consumers across India with <strong>0% listing fees</strong>.
          </p>

          {/* Action CTAs: Register & Login */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <Link href="/vendor/apply" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-slate-950 shadow-lg shadow-brand-gold-500/20 px-7 py-3"
              >
                <Store className="w-4 h-4 mr-2" />
                <span>Register as a Seller (Apply Now)</span>
              </Button>
            </Link>

            <Link href="/vendor" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-sm font-bold text-white border-brand-slate-700 hover:bg-brand-slate-800/90 px-7 py-3"
              >
                <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
                <span>Seller Portal Sign In</span>
              </Button>
            </Link>
          </div>

          {/* Quick Micro Badges */}
          <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-brand-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>0% Upfront Listing Fee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>7-Day Automated Bank Payouts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pan-India Doorstep Pickup</span>
            </div>
          </div>
        </div>

        {/* Ambient background decorative glow */}
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-96 h-96 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 -mb-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. WHY SELL ON ALIGHT - 6 CORE BENEFITS */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="brand" size="md">
            Seller Advantages
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900">
            Why Top Hardware Brands Choose Alight
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate-600">
            We give manufacturers and suppliers the software tools and marketplace reach needed to scale seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 hover:shadow-md transition-shadow border-brand-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-brand-slate-900">Direct B2B & B2C Audience</h3>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Reach high-intent interior designers, builders, carpenters, and homeowners looking for certified modular kitchen fittings and sanitary fixtures.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-md transition-shadow border-brand-slate-200">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-brand-slate-900">0% Listing & Setup Fee</h3>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              No hidden platform charges or monthly subscription fees. List your complete product catalog freely and pay low commission only on delivered orders.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-md transition-shadow border-brand-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-brand-slate-900">Pan-India Integrated Logistics</h3>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Generate 1-click thermal 4x6 shipping labels and manifests. Our courier partners pick up parcels right from your factory or warehouse doorstep.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-md transition-shadow border-brand-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-brand-slate-900">7-Day Escrow Payouts</h3>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Guaranteed escrow security ensures on-time bank transfers every week with full GST compliance, automated 1% TCS deduction, and settlement ledgers.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-md transition-shadow border-brand-slate-200">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-brand-slate-900">Multi-Warehouse Inventory</h3>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Manage stock across multiple physical locations, set real-time threshold alerts, and keep inventory synchronized with automated reservation safeguards.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-md transition-shadow border-brand-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-brand-slate-900">Wholesale RFQs & Bulk Bids</h3>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Receive direct request for quotation (RFQ) alerts from large commercial projects and submit customized volume pricing bids.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. SIMPLE 4-STEP ONBOARDING FLOW */}
      <section className="bg-brand-slate-50 rounded-3xl p-8 sm:p-12 border border-brand-slate-200 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="brand" size="md">
            Simple 4-Step Process
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900">
            How Selling on Alight Works
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate-600">
            Start selling your architectural hardware products in less than 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-slate-200 space-y-3 relative shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald-800 text-white font-extrabold text-sm flex items-center justify-center">
              1
            </div>
            <h4 className="text-sm font-bold text-brand-slate-900">Register & KYC</h4>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Complete the fast 3-step online application with your GSTIN, PAN, and bank details.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-slate-200 space-y-3 relative shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald-800 text-white font-extrabold text-sm flex items-center justify-center">
              2
            </div>
            <h4 className="text-sm font-bold text-brand-slate-900">List Products</h4>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Upload product photos, dimension specs, finishes, and inventory counts through the Vendor Console.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-slate-200 space-y-3 relative shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald-800 text-white font-extrabold text-sm flex items-center justify-center">
              3
            </div>
            <h4 className="text-sm font-bold text-brand-slate-900">Receive Orders & Ship</h4>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Pack customer orders, print 4x6 shipping labels, and hand over to our courier pickup partners.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-slate-200 space-y-3 relative shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald-800 text-white font-extrabold text-sm flex items-center justify-center">
              4
            </div>
            <h4 className="text-sm font-bold text-brand-slate-900">Get Paid Regularly</h4>
            <p className="text-xs text-brand-slate-600 leading-relaxed">
              Receive automatic weekly payouts directly into your bank account with complete tax invoices.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link href="/vendor/apply">
            <Button variant="primary" size="lg" className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white text-xs sm:text-sm font-bold px-8">
              Start Your Application Today <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 4. DOCUMENTS REQUIRED CHECKLIST */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 bg-brand-slate-900 text-white border-brand-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center border border-brand-gold-500/40">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">Documents You Will Need</h3>
          <p className="text-xs text-brand-slate-400 leading-relaxed">
            Keep these simple business documents ready before filling out your KYC application form.
          </p>
          <div className="pt-2">
            <Link href="/vendor/apply">
              <Button variant="outline" size="sm" className="w-full text-xs text-white border-brand-slate-700 hover:bg-brand-slate-800">
                Apply as Seller Now
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2 border-brand-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-brand-slate-900">Valid GSTIN</h4>
              <p className="text-[11px] text-brand-slate-600">Goods and Services Tax Identification Number for tax compliance.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-brand-slate-900">Business PAN Card</h4>
              <p className="text-[11px] text-brand-slate-600">Permanent Account Number of proprietor, partnership or company.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-brand-slate-900">Active Bank Account</h4>
              <p className="text-[11px] text-brand-slate-600">Account number and IFSC code for direct weekly escrow transfers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-brand-slate-900">Warehouse Pickup Hub</h4>
              <p className="text-[11px] text-brand-slate-600">Physical address and contact person for courier dispatch pickup.</p>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. SELLER FAQS */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <Badge variant="brand" size="md">
            Got Questions?
          </Badge>
          <h2 className="text-2xl font-extrabold text-brand-slate-900">
            Frequently Asked Questions for Sellers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-brand-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-brand-slate-900 hover:bg-brand-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-brand-slate-500 shrink-0 transition-transform ${
                    openFaq === idx ? "rotate-180 text-brand-emerald-800" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-brand-slate-600 leading-relaxed border-t border-brand-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION BANNER */}
      <section className="bg-gradient-to-r from-brand-slate-950 via-brand-slate-900 to-brand-emerald-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 border border-brand-slate-800 shadow-xl">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Ready to Expand Your Reach on Alight?
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate-300">
            Join 500+ verified hardware manufacturers, distributors, and direct suppliers today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/vendor/apply">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-slate-950 shadow-md px-8 py-3"
            >
              <Store className="w-4 h-4 mr-2" />
              <span>Apply to Sell Now</span>
            </Button>
          </Link>
          <Link href="/vendor">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-semibold text-white border-brand-slate-700 hover:bg-brand-slate-800 px-8 py-3"
            >
              <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
              <span>Login to Seller Console</span>
            </Button>
          </Link>
        </div>

        <div className="pt-2 text-[11px] text-brand-slate-400 flex items-center justify-center gap-4">
          <span>Direct Merchant Support: <strong>seller@alight.com</strong></span>
          <span>•</span>
          <span>Helpline: <strong>+91 (080) 4123-ALIGHT</strong></span>
        </div>
      </section>
    </div>
  );
}
