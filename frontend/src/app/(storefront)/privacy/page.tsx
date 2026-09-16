import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Database, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-brand-slate-500 hover:text-brand-emerald-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              Privacy & Data Protection Policy
            </h1>
            <p className="text-xs text-brand-slate-500 mt-0.5">
              DPDP Act 2023 & GDPR Compliant • 256-Bit SSL Encryption
            </p>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border-brand-slate-200">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>1. Information We Collect</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            When you create an account, place an order, or interact with Alight Marketplace, we collect:
          </p>
          <ul className="list-disc list-inside text-xs text-brand-slate-600 space-y-1.5 pl-2">
            <li><strong>Identity & Contact Details:</strong> Name, phone number, email address, and shipping/billing addresses.</li>
            <li><strong>Transactional Data:</strong> Order records, payment transaction IDs, GST numbers (for business invoicing), and RMA records.</li>
            <li><strong>Technical Telemetry:</strong> IP address, device fingerprints, and authentication session tokens (stored securely in encrypted HTTP-only cookies).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>2. Payment & Financial Data Security</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            Alight Marketplace <strong>never stores your raw credit card numbers, CVVs, or NetBanking credentials</strong> on our servers.
            All checkout payments are processed through PCI-DSS Level 1 certified payment gateways (Razorpay and Stripe) utilizing end-to-end tokenization and 3D Secure 2.0 multi-factor authentication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>3. How We Use Your Information</span>
          </h2>
          <ul className="list-disc list-inside text-xs text-brand-slate-600 space-y-1.5 pl-2">
            <li>To dispatch consignments and transmit courier tracking notifications via SMS, WhatsApp, and Email.</li>
            <li>To calculate applicable GST (CGST/SGST/IGST) and generate statutory B2B/B2C tax invoices.</li>
            <li>To detect and prevent fraudulent transactions and unauthorized account access.</li>
            <li>To personalize product recommendations based on your architectural and modular hardware preferences.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-2">
            <span>4. Data Retention & Your Rights</span>
          </h2>
          <p className="text-xs text-brand-slate-600 leading-relaxed">
            Under the Digital Personal Data Protection (DPDP) Act, you possess the right to access, rectify, or request deletion of your personal data at any time.
            To exercise your privacy rights, submit a request via our <Link href="/support" className="text-brand-emerald-800 font-bold underline">Customer Support Desk</Link>.
          </p>
        </section>
      </Card>
    </div>
  );
}
