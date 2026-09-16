"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, Search, ArrowLeft, Package, Truck, RotateCcw, ShieldCheck, CreditCard, Store } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FAQItem {
  question: string;
  answer: string;
  category: "Orders & Shipping" | "Returns & Refunds" | "Payments & GST" | "Vendors & Business";
}

const FAQS: FAQItem[] = [
  {
    category: "Orders & Shipping",
    question: "How do I track my order once dispatched?",
    answer: "Once the vendor manifests your shipment, you will receive an SMS and email with your Air Waybill (AWB) number. You can also visit our Track Shipment page (/track) and enter your tracking code or order number to see live courier milestones.",
  },
  {
    category: "Orders & Shipping",
    question: "Why did my order arrive in multiple packages?",
    answer: "Alight is a multi-vendor marketplace. If you purchase items originating from different manufacturer warehouses, each vendor dispatches their package independently for maximum delivery speed.",
  },
  {
    category: "Orders & Shipping",
    question: "What are the shipping charges?",
    answer: "Orders with a subtotal of ₹10,000 and above qualify for Free Standard Surface Shipping. For orders below ₹10,000, a flat shipping charge of ₹150 per vendor sub-order is calculated at checkout.",
  },
  {
    category: "Returns & Refunds",
    question: "How do I request a return or replacement?",
    answer: "Go to Account > My Orders within 7 days of delivery, locate the delivered item, and click 'Request Return / Replacement'. Upload a photo of the defect or damage, and the vendor will issue a Return Authorization (RMA) within 24 hours.",
  },
  {
    category: "Returns & Refunds",
    question: "When will I receive my refund?",
    answer: "Once our reverse courier collects the item and the vendor completes the warehouse quality check, refunds are credited to your original payment method (UPI/Card/Bank) within 24 to 48 business hours.",
  },
  {
    category: "Payments & GST",
    question: "Can I get a GST input tax credit invoice for my business?",
    answer: "Yes! During checkout, enter your company's 15-digit GSTIN in the 'Business GST Details' field. Your downloadable tax invoice will reflect your company name, GSTIN, and the statutory CGST/SGST/IGST breakdown.",
  },
  {
    category: "Payments & GST",
    question: "What payment options are supported?",
    answer: "We support UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit cards (Visa, Mastercard, RuPay, Amex), NetBanking across 50+ banks, and direct Corporate Bank Wire Transfers (NEFT/RTGS/IMPS).",
  },
  {
    category: "Vendors & Business",
    question: "How can I become a verified vendor on Alight?",
    answer: "Visit our 'Sell on Alight' page (/vendor/apply) and complete the vendor onboarding form with your GST certificate, business details, and warehouse addresses. Our vendor verification team approves applications within 1 to 2 business days.",
  },
  {
    category: "Vendors & Business",
    question: "When do vendors receive payouts for fulfilled orders?",
    answer: "Payments are held in commercial escrow and automatically disbursed to the vendor's bank account after 7 days from confirmed customer delivery, deducting statutory 1% GST TCS and agreed platform commission.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set([0, 1]));

  const categories = ["ALL", "Orders & Shipping", "Returns & Refunds", "Payments & GST", "Vendors & Business"];

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) => {
      const updated = new Set(prev);
      if (updated.has(idx)) {
        updated.delete(idx);
      } else {
        updated.add(idx);
      }
      return updated;
    });
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === "ALL" || faq.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-brand-slate-500 hover:text-brand-burgundy transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              Frequently Asked Questions (FAQs)
            </h1>
            <p className="text-xs text-brand-slate-500 mt-0.5">
              Find instant answers to common questions about orders, payments, logistics, and seller onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate-400" />
          <input
            type="text"
            placeholder="Search questions by keyword (e.g. tracking, GST, refund, vendor)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-burgundy/20 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === cat
                  ? "bg-brand-burgundy text-white shadow-xs"
                  : "bg-white text-brand-slate-600 border border-brand-slate-200 hover:bg-brand-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <Card className="p-12 text-center text-brand-slate-400 bg-white">
            <HelpCircle className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
            <p className="font-bold text-sm text-brand-slate-700">No matching questions found</p>
            <p className="text-xs text-brand-slate-400 mt-1">Try different search keywords or contact customer support directly.</p>
          </Card>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndexes.has(idx);
            return (
              <Card
                key={idx}
                className="overflow-hidden border-brand-slate-200 bg-white transition-all duration-200 hover:border-brand-slate-300"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full text-left p-4.5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-brand-slate-900 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-brand-burgundy" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4.5 pb-4.5 pt-0 text-xs text-brand-slate-600 leading-relaxed border-t border-brand-slate-100 mt-1 pt-3">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Footer Support Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-brand-slate-900 rounded-2xl text-white gap-4">
        <div>
          <h4 className="font-bold text-sm">Still have an unanswered question?</h4>
          <p className="text-xs text-brand-slate-400">Our customer support specialists are ready to help you.</p>
        </div>
        <Link href="/support">
          <Button variant="primary" size="sm" className="text-xs font-bold bg-brand-emerald-700 hover:bg-brand-emerald-800 text-white">
            Visit Support Desk
          </Button>
        </Link>
      </div>
    </div>
  );
}
