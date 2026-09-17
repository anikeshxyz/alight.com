"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import { applyAsVendorApi } from "@/services/vendor-service";
import { BusinessType, VendorApplicationPayload } from "@/types/vendor";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";

export default function VendorApplicationPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  const [formData, setFormData] = useState<VendorApplicationPayload>({
    storeName: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    supportEmail: "",
    supportPhone: "",
    legalBusinessName: "",
    businessType: "PRIVATE_LIMITED",
    taxIdGstin: "",
    panNumber: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankName: "",
    bankAccountHolderName: "",
    pickupContactPerson: "",
    pickupContactPhone: "",
    pickupAddressLine1: "",
    pickupAddressLine2: "",
    pickupCity: "",
    pickupState: "",
    pickupPostalCode: "",
    pickupCountry: "India",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        supportEmail: prev.supportEmail || user.email,
        pickupContactPerson: prev.pickupContactPerson || `${user.firstName} ${user.lastName}`.trim(),
        pickupContactPhone: prev.pickupContactPhone || user.phone || "",
        supportPhone: prev.supportPhone || user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.storeName.trim()) return "Store name is required";
    if (!formData.supportEmail.trim()) return "Support email is required";
    if (!formData.supportPhone.trim()) return "Support phone is required";
    return null;
  };

  const validateStep2 = () => {
    if (!formData.legalBusinessName.trim()) return "Legal business name is required";
    if (!formData.bankAccountNumber.trim()) return "Bank account number is required";
    if (!formData.bankIfscCode.trim()) return "Bank IFSC code is required";
    if (!formData.bankName.trim()) return "Bank name is required";
    if (!formData.bankAccountHolderName.trim()) return "Account holder name is required";
    return null;
  };

  const validateStep3 = () => {
    if (!formData.pickupContactPerson.trim()) return "Contact person is required";
    if (!formData.pickupContactPhone.trim()) return "Contact phone is required";
    if (!formData.pickupAddressLine1.trim()) return "Address line 1 is required";
    if (!formData.pickupCity.trim()) return "City is required";
    if (!formData.pickupState.trim()) return "State is required";
    if (!formData.pickupPostalCode.trim()) return "Postal code is required";
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep3();
    if (err) {
      setError(err);
      return;
    }

    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "");
    if (!activeToken) {
      setError("Please sign in or create an account to submit your seller application.");
      setAuthModal("login");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await applyAsVendorApi(formData, activeToken);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || "Failed to submit application");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "An unexpected error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-brand-slate-900">Application Submitted!</h2>
            <p className="text-sm text-brand-slate-600 max-w-md mx-auto">
              Your vendor application for <span className="font-semibold text-brand-slate-900">{formData.storeName}</span> has been received. Our compliance team will review your KYC and banking details within 24–48 hours.
            </p>
          </div>
          <div className="p-4 bg-brand-slate-50 rounded-xl border border-brand-slate-200 text-left space-y-2 text-xs text-brand-slate-600">
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant="brand">Pending Verification</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Support Email:</span>
              <span>{formData.supportEmail}</span>
            </div>
          </div>
          <Button variant="primary" onClick={() => router.push("/vendor")}>
            Go to Vendor Hub
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="brand" size="md">
          Alight International Partner Program
        </Badge>
        <h1 className="text-3xl font-extrabold text-brand-slate-900">
          Become an Approved Vendor
        </h1>
        <p className="text-sm text-brand-slate-600 max-w-lg mx-auto">
          Expand your business across the marketplace. Complete your store profile, KYC documentation, and pickup logistics.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            step >= 1
              ? "bg-brand-burgundy/5 border-brand-burgundy/30 text-brand-burgundy"
              : "bg-brand-slate-50 border-brand-slate-200 text-brand-slate-400"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              step >= 1 ? "bg-brand-burgundy text-white" : "bg-brand-slate-200 text-brand-slate-600"
            }`}
          >
            1
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">Store Info</p>
            <p className="text-[10px] opacity-75">Brand & Contacts</p>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            step >= 2
              ? "bg-brand-burgundy/5 border-brand-burgundy/30 text-brand-burgundy"
              : "bg-brand-slate-50 border-brand-slate-200 text-brand-slate-400"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              step >= 2 ? "bg-brand-burgundy text-white" : "bg-brand-slate-200 text-brand-slate-600"
            }`}
          >
            2
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">KYC & Banking</p>
            <p className="text-[10px] opacity-75">Tax & Payouts</p>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            step >= 3
              ? "bg-brand-burgundy/5 border-brand-burgundy/30 text-brand-burgundy"
              : "bg-brand-slate-50 border-brand-slate-200 text-brand-slate-400"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              step >= 3 ? "bg-brand-burgundy text-white" : "bg-brand-slate-200 text-brand-slate-600"
            }`}
          >
            3
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">Logistics</p>
            <p className="text-[10px] opacity-75">Pickup Hub</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: STORE INFO */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 border-b border-brand-slate-100 pb-3">
                <Store className="w-5 h-5 text-brand-burgundy" />
                <h3 className="text-base font-bold text-brand-slate-900">Storefront Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Store Display Name *
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="e.g. Alight Apex Electronics"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Store Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell buyers about your products, brand philosophy, and quality standards..."
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Support Email *
                  </label>
                  <input
                    type="email"
                    name="supportEmail"
                    value={formData.supportEmail}
                    onChange={handleChange}
                    placeholder="support@yourstore.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Customer Support Phone *
                  </label>
                  <input
                    type="tel"
                    name="supportPhone"
                    value={formData.supportPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <ImageUploadDropzone
                    label="Store Brand Logo"
                    helperText="Upload official brand logo (PNG, JPG, SVG)"
                    multiple={false}
                    value={formData.logoUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, logoUrl: typeof url === "string" ? url : url[0] || "" }))}
                  />
                </div>

                <div className="sm:col-span-1">
                  <ImageUploadDropzone
                    label="Storefront Header Banner"
                    helperText="Upload wide store banner photo (PNG, JPG, WEBP)"
                    multiple={false}
                    value={formData.bannerUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, bannerUrl: typeof url === "string" ? url : url[0] || "" }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS & BANKING */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 border-b border-brand-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-brand-burgundy" />
                <h3 className="text-base font-bold text-brand-slate-900">
                  Legal Entity & Payout Banking
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Legal Registered Name *
                  </label>
                  <input
                    type="text"
                    name="legalBusinessName"
                    value={formData.legalBusinessName}
                    onChange={handleChange}
                    placeholder="e.g. Apex Enterprises Pvt Ltd"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Business Entity Type *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  >
                    <option value="INDIVIDUAL">Individual / Proprietor</option>
                    <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                    <option value="PARTNERSHIP">Partnership / LLP</option>
                    <option value="PRIVATE_LIMITED">Private Limited (Pvt Ltd)</option>
                    <option value="PUBLIC_LIMITED">Public Limited</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    GSTIN / Tax Identification
                  </label>
                  <input
                    type="text"
                    name="taxIdGstin"
                    value={formData.taxIdGstin}
                    onChange={handleChange}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Business PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Settlement Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g. HDFC Bank, ICICI, SBI"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    IFSC / Routing Code *
                  </label>
                  <input
                    type="text"
                    name="bankIfscCode"
                    value={formData.bankIfscCode}
                    onChange={handleChange}
                    placeholder="HDFC0001234"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="bankAccountHolderName"
                    value={formData.bankAccountHolderName}
                    onChange={handleChange}
                    placeholder="Name matching company bank records"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="password"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="Enter Account Number"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PICKUP LOGISTICS */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 border-b border-brand-slate-100 pb-3">
                <MapPin className="w-5 h-5 text-brand-burgundy" />
                <h3 className="text-base font-bold text-brand-slate-900">
                  Primary Warehouse & Dispatch Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Dispatch Contact Person *
                  </label>
                  <input
                    type="text"
                    name="pickupContactPerson"
                    value={formData.pickupContactPerson}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Dispatch Phone *
                  </label>
                  <input
                    type="tel"
                    name="pickupContactPhone"
                    value={formData.pickupContactPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Warehouse Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="pickupAddressLine1"
                    value={formData.pickupAddressLine1}
                    onChange={handleChange}
                    placeholder="Building / Plot No., Industrial Area, Street"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="pickupAddressLine2"
                    value={formData.pickupAddressLine2}
                    onChange={handleChange}
                    placeholder="Landmark, Sector"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="pickupCity"
                    value={formData.pickupCity}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="pickupState"
                    value={formData.pickupState}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Postal / PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pickupPostalCode"
                    value={formData.pickupPostalCode}
                    onChange={handleChange}
                    placeholder="560001"
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="pickupCountry"
                    value={formData.pickupCountry}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-brand-slate-100 border border-brand-slate-200 rounded-lg text-brand-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-brand-slate-100">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" variant="primary" onClick={handleNext}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" loading={loading}>
                Submit Application <ShieldCheck className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </Card>

      <LoginModal
        isOpen={authModal === "login"}
        onClose={() => setAuthModal(null)}
        onSwitchToRegister={() => setAuthModal("register")}
      />

      <RegisterModal
        isOpen={authModal === "register"}
        onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal("login")}
      />
    </div>
  );
}
