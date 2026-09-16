import React from "react";
import Link from "next/link";
import { RotateCcw, CheckCircle2, XCircle, Clock, ShieldCheck, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-brand-slate-500 hover:text-brand-burgundy transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              Return, Replacement & Refund Policy
            </h1>
            <p className="text-xs text-brand-slate-500 mt-0.5">
              7-Day Hassle-Free Returns • 100% Buyer Protection Guarantee
            </p>
          </div>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-brand-slate-200 space-y-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-xs text-brand-slate-900">7-Day Window</h3>
          <p className="text-[11px] text-brand-slate-500 leading-relaxed">
            Initiate a return or exchange request within 7 calendar days of delivery.
          </p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-2">
          <RefreshCw className="w-5 h-5 text-brand-emerald-700" />
          <h3 className="font-bold text-xs text-brand-slate-900">Doorstep Reverse Pickup</h3>
          <p className="text-[11px] text-brand-slate-500 leading-relaxed">
            Free carrier pickup scheduled right from your delivery address across 19,000+ PIN codes.
          </p>
        </Card>

        <Card className="p-4 bg-white border-brand-slate-200 space-y-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-xs text-brand-slate-900">Instant Refund</h3>
          <p className="text-[11px] text-brand-slate-500 leading-relaxed">
            Refunds processed to original payment method or bank account within 24 hours of warehouse QC.
          </p>
        </Card>
      </div>

      {/* Policy Sections */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border-brand-slate-200">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>1. Eligible Reasons for Return & Replacement</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5 text-emerald-950">
              <span className="font-bold flex items-center gap-1 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Eligible Conditions
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-900">
                <li>Item arrived damaged, defective, or chipped.</li>
                <li>Incorrect product, size, finish, or color received.</li>
                <li>Missing accessories or mounting screws/brackets.</li>
                <li>Fitment / dimension mismatch with specifications.</li>
              </ul>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl space-y-1.5 text-rose-950">
              <span className="font-bold flex items-center gap-1 text-rose-800">
                <XCircle className="w-4 h-4" /> Non-Returnable Conditions
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-900">
                <li>Customized / bespoke fabricated metal organizers.</li>
                <li>Products modified, drilled, installed, or altered.</li>
                <li>Items returned without original packaging or tags.</li>
                <li>Requests raised beyond the 7-day window.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>2. Step-by-Step Return Process (RMA Workflow)</span>
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs text-brand-slate-600 leading-relaxed pl-2">
            <li><strong>Raise RMA Request:</strong> Go to <Link href="/account" className="text-brand-burgundy font-bold underline">My Orders</Link>, select the order item, and click &ldquo;Request Return / Replacement&rdquo;.</li>
            <li><strong>Vendor QC Review:</strong> The vendor reviews the photo/video proof within 24 hours and issues an official Return Authorization (RMA).</li>
            <li><strong>Reverse Pickup:</strong> Our courier partner arrives to inspect and collect the item from your premises.</li>
            <li><strong>Warehouse Inspection & Refund:</strong> Upon receipt at the vendor facility, quality check is completed and refund or replacement dispatch is executed immediately.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>3. Refund Modes & Timelines</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-brand-slate-200 rounded-lg">
              <thead className="bg-brand-slate-50 text-brand-slate-700 font-bold border-b">
                <tr>
                  <th className="p-2.5">Original Payment Method</th>
                  <th className="p-2.5">Refund Destination</th>
                  <th className="p-2.5">Estimated Credit Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 text-brand-slate-600">
                <tr>
                  <td className="p-2.5 font-semibold">UPI / NetBanking</td>
                  <td className="p-2.5">Original Bank Account</td>
                  <td className="p-2.5 text-emerald-700 font-bold">1 to 2 Business Days</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Credit / Debit Card</td>
                  <td className="p-2.5">Card Issuing Bank</td>
                  <td className="p-2.5">3 to 5 Business Days</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Bank Wire (NEFT/RTGS/IMPS)</td>
                  <td className="p-2.5">Beneficiary Account</td>
                  <td className="p-2.5">24 to 48 Hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-brand-slate-900 rounded-2xl text-white gap-4">
        <div>
          <h4 className="font-bold text-sm">Need help with an exchange or RMA?</h4>
          <p className="text-xs text-brand-slate-400">Our customer dispute desk is available 7 days a week.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/support">
            <Button variant="primary" size="sm" className="text-xs font-bold bg-brand-emerald-700 hover:bg-brand-emerald-800 text-white">
              Open Support Ticket
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
