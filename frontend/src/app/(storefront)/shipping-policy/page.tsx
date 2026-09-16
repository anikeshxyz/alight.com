import React from "react";
import Link from "next/link";
import { Truck, Clock, ShieldCheck, MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ShippingPolicyPage() {
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
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              Shipping & Delivery Policy
            </h1>
            <p className="text-xs text-brand-slate-500 mt-0.5">
              Last updated: September 2026 • Standard Domestic & Commercial Logistics SLA
            </p>
          </div>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200 space-y-2">
          <Clock className="w-5 h-5 text-brand-emerald-700" />
          <h3 className="font-bold text-xs text-brand-slate-900">Standard Delivery</h3>
          <p className="text-[11px] text-brand-slate-500 leading-relaxed">
            3 to 5 business days across metro cities; 5 to 7 days for tier-2 & tier-3 locations.
          </p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-xs text-brand-slate-900">Full Transit Insurance</h3>
          <p className="text-[11px] text-brand-slate-500 leading-relaxed">
            All consignments are 100% insured against loss, transit damage, or handling defects.
          </p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-2">
          <MapPin className="w-5 h-5 text-rose-600" />
          <h3 className="font-bold text-xs text-brand-slate-900">Real-Time Tracking</h3>
          <p className="text-[11px] text-brand-slate-500 leading-relaxed">
            Instant AWB updates with Blue Dart, Delhivery, and DTDC partner integrations.
          </p>
        </Card>
      </div>

      {/* Policy Details */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border-brand-slate-200">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>1. Order Processing & Dispatch Timelines</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            All orders placed on Alight Marketplace are forwarded directly to the respective verified manufacturer/vendor hub within <strong>2 to 4 business hours</strong>.
            Standard dispatch occurs within <strong>24 to 48 hours</strong> upon quality inspection and packaging.
          </p>
          <ul className="list-disc list-inside text-xs text-brand-slate-600 space-y-1.5 pl-2">
            <li>Orders placed before 2:00 PM IST on working days enter fulfillment the same day.</li>
            <li>Orders placed on Sundays or national holidays are manifested on the next business day.</li>
            <li>Custom fabricated or heavy architectural hardware may require up to 3 business days for wooden crate packing.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>2. Shipping Charges & Free Delivery Thresholds</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            We provide transparent slab pricing based on subtotal value and consignment weight:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-brand-slate-200 rounded-lg">
              <thead className="bg-brand-slate-50 text-brand-slate-700 font-bold border-b">
                <tr>
                  <th className="p-2.5">Order Value</th>
                  <th className="p-2.5">Standard Surface Logistics</th>
                  <th className="p-2.5">Express Air Logistics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-brand-slate-600">
                <tr>
                  <td className="p-2.5 font-semibold">₹10,000 and Above</td>
                  <td className="p-2.5 text-emerald-700 font-bold">FREE (₹0)</td>
                  <td className="p-2.5">₹250</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Below ₹10,000</td>
                  <td className="p-2.5">₹150 flat rate</td>
                  <td className="p-2.5">₹350</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>3. Multi-Vendor Consignment Splitting</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            If your cart contains items from multiple independent manufacturers, your order is split into vendor sub-orders (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">ORD-2026-XXXX-V1</code>). Each package ships directly from the vendor&apos;s licensed warehouse with its own dedicated tracking number (AWB).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>4. Damaged or Tampered Consignments</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            Please inspect the outer package before accepting delivery from the courier executive. If the seal is broken or exterior crate is visibly damaged:
          </p>
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Recommended Action:</span>
            </p>
            <p className="leading-relaxed">
              Record a short unboxing video or take photographs, refuse acceptance or sign &ldquo;Damaged on Arrival&rdquo;, and report the issue on our <Link href="/support" className="text-brand-burgundy font-bold underline">Support Helpdesk</Link> within 48 hours for immediate no-cost replacement.
            </p>
          </div>
        </section>
      </Card>

      {/* Quick Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-brand-slate-900 rounded-2xl text-white gap-4">
        <div>
          <h4 className="font-bold text-sm">Have a question about an active shipment?</h4>
          <p className="text-xs text-brand-slate-400">Track your consignment AWB or connect with our logistics team.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/track">
            <Button variant="outline" size="sm" className="text-xs font-bold text-white border-brand-slate-700 hover:bg-brand-slate-800">
              Track Shipment
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="primary" size="sm" className="text-xs font-bold bg-brand-emerald-700 hover:bg-brand-emerald-800 text-white">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
