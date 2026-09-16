"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Building2,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import {
  getCurrentVendorApi,
  updateVendorProfileApi,
  updateVendorBusinessDetailsApi,
  getVendorPickupAddressesApi,
  addVendorPickupAddressApi,
  setPrimaryVendorPickupAddressApi,
  deleteVendorPickupAddressApi,
} from "@/services/vendor-service";
import {
  VendorProfile,
  VendorPickupAddress,
  BusinessType,
  CreatePickupAddressPayload,
} from "@/types/vendor";

export default function VendorSettingsPage() {
  const [activeTab, setActiveTab] = useState<"store" | "kyc" | "pickup">("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [pickupAddresses, setPickupAddresses] = useState<VendorPickupAddress[]>([]);

  // Profile Form State
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  // Business & KYC Form State
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("PRIVATE_LIMITED");
  const [taxIdGstin, setTaxIdGstin] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");

  // New Pickup Address Form State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<CreatePickupAddressPayload>({
    contactPerson: "",
    contactPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    primary: false,
  });

  const loadVendorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await getCurrentVendorApi(token);
      if (res.success && res.data) {
        const v = res.data;
        setVendor(v);
        setStoreName(v.storeName || "");
        setDescription(v.description || "");
        setLogoUrl(v.logoUrl || "");
        setBannerUrl(v.bannerUrl || "");
        setSupportEmail(v.supportEmail || "");
        setSupportPhone(v.supportPhone || "");

        if (v.businessDetails) {
          setLegalBusinessName(v.businessDetails.legalBusinessName || "");
          setBusinessType(v.businessDetails.businessType || "PRIVATE_LIMITED");
          setTaxIdGstin(v.businessDetails.taxIdGstin || "");
          setPanNumber(v.businessDetails.panNumber || "");
          setBankAccountNumber(v.businessDetails.bankAccountNumber || "");
          setBankIfscCode(v.businessDetails.bankIfscCode || "");
          setBankName(v.businessDetails.bankName || "");
          setBankAccountHolderName(v.businessDetails.bankAccountHolderName || "");
        }

        const addrRes = await getVendorPickupAddressesApi(token);
        if (addrRes.success && addrRes.data) {
          setPickupAddresses(addrRes.data);
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load vendor settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await updateVendorProfileApi(
        { storeName, description, logoUrl, bannerUrl, supportEmail, supportPhone },
        token
      );
      if (res.success) {
        setVendor(res.data);
        setSuccessMsg("Store profile updated successfully");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await updateVendorBusinessDetailsApi(
        {
          legalBusinessName,
          businessType,
          taxIdGstin,
          panNumber,
          bankAccountNumber,
          bankIfscCode,
          bankName,
          bankAccountHolderName,
        },
        token
      );
      if (res.success) {
        setSuccessMsg("Business & KYC details updated successfully");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to update business details");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await addVendorPickupAddressApi(newAddress, token);
      if (res.success) {
        setShowAddAddress(false);
        setNewAddress({
          contactPerson: "",
          contactPhone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          primary: false,
        });
        const addrRes = await getVendorPickupAddressesApi(token);
        if (addrRes.success) setPickupAddresses(addrRes.data);
        setSuccessMsg("Pickup warehouse address added successfully");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to add pickup address");
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimaryAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await setPrimaryVendorPickupAddressApi(id, token);
      if (res.success) {
        const addrRes = await getVendorPickupAddressesApi(token);
        if (addrRes.success) setPickupAddresses(addrRes.data);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to set primary address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await deleteVendorPickupAddressApi(id, token);
      if (res.success) {
        const addrRes = await getVendorPickupAddressesApi(token);
        if (addrRes.success) setPickupAddresses(addrRes.data);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to delete address");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Vendor Settings</h1>
          <p className="text-xs text-brand-slate-500">
            Manage your public storefront profile, KYC details, and warehouse fulfillment locations.
          </p>
        </div>
        {vendor && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-slate-500 font-medium">Store Status:</span>
            <Badge
              variant={
                vendor.status === "APPROVED"
                  ? "success"
                  : vendor.status === "PENDING_VERIFICATION"
                  ? "brand"
                  : "error"
              }
            >
              {vendor.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-slate-200">
        <button
          onClick={() => {
            setActiveTab("store");
            setSuccessMsg(null);
            setError(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "store"
              ? "border-brand-burgundy text-brand-burgundy"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-900"
          }`}
        >
          <Store className="w-4 h-4" /> Storefront Info
        </button>

        <button
          onClick={() => {
            setActiveTab("kyc");
            setSuccessMsg(null);
            setError(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "kyc"
              ? "border-brand-burgundy text-brand-burgundy"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" /> KYC & Banking
        </button>

        <button
          onClick={() => {
            setActiveTab("pickup");
            setSuccessMsg(null);
            setError(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "pickup"
              ? "border-brand-burgundy text-brand-burgundy"
              : "border-transparent text-brand-slate-500 hover:text-brand-slate-900"
          }`}
        >
          <MapPin className="w-4 h-4" /> Pickup Warehouses ({pickupAddresses.length})
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: STORE PROFILE */}
      {activeTab === "store" && (
        <Card className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Store Display Name *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Store Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Support Email *
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Support Phone *
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <ImageUploadDropzone
                  label="Store Logo Image"
                  helperText="Upload square brand logo (PNG, JPG, SVG)"
                  multiple={false}
                  value={logoUrl}
                  onChange={(url) => setLogoUrl(typeof url === "string" ? url : url[0] || "")}
                />
              </div>

              <div className="sm:col-span-1">
                <ImageUploadDropzone
                  label="Storefront Header Banner"
                  helperText="Upload wide banner image (1200x300 recommended)"
                  multiple={false}
                  value={bannerUrl}
                  onChange={(url) => setBannerUrl(typeof url === "string" ? url : url[0] || "")}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-slate-100">
              <Button type="submit" variant="primary" loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Save Store Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: KYC & BANKING */}
      {activeTab === "kyc" && (
        <Card className="p-6">
          <form onSubmit={handleUpdateKyc} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Legal Entity Name *
                </label>
                <input
                  type="text"
                  value={legalBusinessName}
                  onChange={(e) => setLegalBusinessName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Business Entity Type *
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
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
                  GSTIN
                </label>
                <input
                  type="text"
                  value={taxIdGstin}
                  onChange={(e) => setTaxIdGstin(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg uppercase focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  PAN
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg uppercase focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg uppercase focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankAccountHolderName}
                  onChange={(e) => setBankAccountHolderName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Bank Account Number *
                </label>
                <input
                  type="password"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-slate-100">
              <Button type="submit" variant="primary" loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Save KYC & Bank Details
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: PICKUP LOCATIONS */}
      {activeTab === "pickup" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-brand-slate-500">
              Registered fulfillment hubs where courier partners collect packaged orders.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Location
            </Button>
          </div>

          {showAddAddress && (
            <Card className="p-5 border-brand-burgundy/30 bg-brand-burgundy/5 animate-in fade-in duration-200">
              <h4 className="text-sm font-bold text-brand-slate-900 mb-3">
                New Warehouse Pickup Location
              </h4>
              <form onSubmit={handleAddAddress} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-slate-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={newAddress.contactPerson}
                      onChange={(e) =>
                        setNewAddress((prev) => ({ ...prev, contactPerson: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={newAddress.contactPhone}
                      onChange={(e) =>
                        setNewAddress((prev) => ({ ...prev, contactPhone: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-brand-slate-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={newAddress.addressLine1}
                      onChange={(e) =>
                        setNewAddress((prev) => ({ ...prev, addressLine1: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-slate-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      value={newAddress.postalCode}
                      onChange={(e) =>
                        setNewAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAddress(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={saving}>
                    Save Warehouse
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickupAddresses.map((addr) => (
              <Card key={addr.id} className="p-4 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-slate-900">
                        {addr.contactPerson}
                      </span>
                      {addr.primary && (
                        <Badge variant="brand" size="sm">
                          Primary Hub
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-brand-slate-500">{addr.contactPhone}</span>
                  </div>
                  {!addr.primary && (
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-brand-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete pickup address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-brand-slate-600 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                  <br />
                  {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                </p>

                {!addr.primary && (
                  <div className="pt-2 border-t border-brand-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimaryAddress(addr.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Set as Primary Hub
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
