"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Heart,
  Store,
  HelpCircle,
  FileText,
  User,
  ShoppingBag,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export const StorefrontFooter: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }, 600);
  };

  return (
    <footer className="bg-brand-slate-900 text-brand-slate-300 mt-20 border-t border-brand-slate-800">
      {/* 1. Customer Trust Badges Bar */}
      <div className="border-b border-brand-slate-800 py-6 bg-brand-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-slate-900 rounded-xl text-emerald-400 border border-brand-slate-800 shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">100% Verified Sellers</h4>
              <p className="text-[11px] text-brand-slate-400">KYC audited direct manufacturers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-slate-900 rounded-xl text-indigo-400 border border-brand-slate-800 shrink-0 shadow-inner">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Tracked Delivery</h4>
              <p className="text-[11px] text-brand-slate-400">Real-time live AWB tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-slate-900 rounded-xl text-amber-400 border border-brand-slate-800 shrink-0 shadow-inner">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">7-Day Easy Returns</h4>
              <p className="text-[11px] text-brand-slate-400">Doorstep reverse pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-slate-900 rounded-xl text-rose-400 border border-brand-slate-800 shrink-0 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Escrow Payment Security</h4>
              <p className="text-[11px] text-brand-slate-400">Funds released after delivery</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* ========================================================================= */}
        {/* 2. CUSTOMER & SHOPPER DIRECTORY */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Deals Newsletter */}
          <div className="space-y-4">
            <Link href="/" className="inline-block p-2 bg-white rounded-xl shadow-md hover:opacity-95 transition-opacity">
              <img
                src="/images/alight-logo.png"
                alt="ALIGHT - Kitchen, Bathroom and Wardrobe Accessories"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <p className="text-xs text-brand-slate-400 leading-relaxed">
              India&apos;s curated marketplace for precision modular kitchen fittings, solid brass sanitaryware, wardrobe organizers, and architectural hardware.
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wider">
                Subscribe For Exclusive Offers
              </span>
              {subscribed ? (
                <div className="p-2 bg-emerald-950/70 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Subscribed! Check your inbox for perks.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-500" />
                    <input
                      type="email"
                      placeholder="Your email address..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-8 pr-2.5 py-1.5 bg-brand-slate-950 border border-brand-slate-800 rounded-lg text-xs text-white placeholder-brand-slate-500 focus:outline-none focus:border-brand-emerald-500 transition"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={subscribing}
                    className="bg-brand-emerald-700 hover:bg-brand-emerald-800 text-white text-xs px-3 py-1 font-bold shrink-0"
                  >
                    {subscribing ? "..." : "Join"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Col 2: Shop Categories */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 text-brand-gold-400">
              Explore Categories
            </h5>
            <ul className="space-y-2.5 text-xs text-brand-slate-400">
              <li>
                <Link href="/products?search=kitchen" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Modular Kitchen Organizers</span>
                </Link>
              </li>
              <li>
                <Link href="/products?search=bath" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Bathroom & Sanitary Fixtures</span>
                </Link>
              </li>
              <li>
                <Link href="/products?search=wardrobe" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Wardrobe Pull-Outs & Racks</span>
                </Link>
              </li>
              <li>
                <Link href="/products?search=hardware" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Architectural Handles & Hinges</span>
                </Link>
              </li>
              <li>
                <Link href="/bundles" className="hover:text-brand-gold-400 font-semibold transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand-gold-400" />
                  <span>Curated Combos & Bundles</span>
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Browse All Products</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Account & Orders */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 text-brand-gold-400">
              Customer Services
            </h5>
            <ul className="space-y-2.5 text-xs text-brand-slate-400">
              <li>
                <Link href="/track" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Track Consignment AWB</span>
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-slate-400" />
                  <span>My Account & Orders</span>
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Saved Wishlist Items</span>
                </Link>
              </li>
              <li>
                <Link href="/quotes" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request Bulk Quote (RFQ)</span>
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customer Support Desk</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-brand-slate-400" />
                  <span>Frequently Asked Questions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Buyer Policies */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 text-brand-gold-400">
              Buyer Policies & Trust
            </h5>
            <ul className="space-y-2.5 text-xs text-brand-slate-400">
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Shipping & Delivery Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>7-Day Return & Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Privacy & Data Protection</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-brand-slate-600" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Customer Care: <strong className="text-slate-300">support@alight.com</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CLEAN "BECOME A SELLER" BANNER CTA AT THE BOTTOM */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-brand-slate-950 via-brand-slate-900 to-brand-slate-950 rounded-2xl p-5 sm:p-6 border border-brand-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 border border-brand-gold-500/30 flex items-center justify-center text-brand-gold-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                Sell Architectural Hardware on Alight
                <span className="bg-brand-emerald-950 text-brand-emerald-400 border border-brand-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  0% Listing Fee
                </span>
              </h4>
              <p className="text-xs text-brand-slate-400">
                Are you a verified manufacturer or supplier? Reach thousands of architects, interior builders, and homeowners.
              </p>
            </div>
          </div>

          <Link href="/become-a-seller" className="shrink-0 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-slate-950 shadow-sm px-5 py-2"
            >
              <span>Become a Seller</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 4. BOTTOM LEGAL, CERTIFICATION & PAYMENT RIBBON */}
        {/* ========================================================================= */}
        <div className="pt-4 flex flex-col md:flex-row justify-between items-center text-xs text-brand-slate-400 gap-4 border-t border-brand-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Alight International Marketplace Private Limited.</p>
            <div className="flex items-center gap-2 text-[11px] text-brand-slate-500">
              <span>GST Registered</span>
              <span>•</span>
              <span>CIN: U51909MH2026PTC109876</span>
              <span>•</span>
              <span>ISO 9001:2015</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-brand-slate-500 mr-1">Secured By:</span>
            {["UPI", "RuPay", "Visa", "Mastercard", "NetBanking", "Razorpay"].map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded bg-brand-slate-950 border border-brand-slate-800 text-[10px] font-semibold text-brand-slate-300 shadow-2xs"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
