"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Building,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Store,
  Clock,
  AlertCircle,
  Globe,
  Sparkles,
  Copy,
  ExternalLink,
  Tag,
  Percent,
  Check,
  X
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useWishlist } from "@/context/WishlistContext";
import { initiateCheckoutApi } from "@/services/order-service";
import { paymentService } from "@/services/payment-service";
import { couponService } from "@/services/coupon-service";
import { CouponValidationResponse } from "@/types/coupon";
import { CheckoutAddress } from "@/types/order";
import { PaymentGatewayType, InitiatePaymentResponse } from "@/types/payment";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, refreshCart, clearCart } = useCart();
  const { user, token } = useAuth();
  const { formatMoney } = useCurrency();
  const { removeFromWishlist, refreshWishlist } = useWishlist();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGatewayType>("MOCK");
  const [customerGstNumber, setCustomerGstNumber] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Bank transfer modal state
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankPaymentData, setBankPaymentData] = useState<InitiatePaymentResponse | null>(null);
  const [bankUtrInput, setBankUtrInput] = useState("");
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<CheckoutAddress>({
    addressType: "SHIPPING",
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "IN",
  });

  const [billingAddress, setBillingAddress] = useState<CheckoutAddress>({
    addressType: "BILLING",
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "IN",
  });

  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.firstName} ${user.lastName}`,
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  const handleApplyCoupon = React.useCallback(async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code || !cart) return;

    setIsApplyingCoupon(true);
    setCouponMessage(null);

    try {
      const itemsPayload = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        vendorId: item.vendorId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal || (item.unitPrice * item.quantity),
      }));

      const res = await couponService.applyCoupon({
        couponCode: code,
        cartSubtotal: cart.subtotalAmount,
        items: itemsPayload,
      });

      if (res.success && res.data && res.data.valid) {
        setAppliedCoupon(res.data);
        const codeName = res.data.coupon?.couponCode || res.data.couponCode || code;
        const discVal = res.data.calculatedDiscount ?? res.data.discountAmount ?? 0;
        setCouponMessage({
          text: `Coupon ${codeName} applied successfully! Saved ${formatMoney(discVal)}`,
          type: "success",
        });
      } else {
        setAppliedCoupon(null);
        setCouponMessage({
          text: res.message || res.data?.message || "Invalid coupon code for this order.",
          type: "error",
        });
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponMessage({
        text: err.message || "Failed to apply coupon. Please try again.",
        type: "error",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponInput, cart, formatMoney]);

  // Handle auto-apply from query param (?coupon=...)
  useEffect(() => {
    const couponParam = searchParams.get("coupon");
    if (couponParam && cart && cart.items.length > 0 && !appliedCoupon) {
      setCouponInput(couponParam);
      handleApplyCoupon(couponParam);
    }
  }, [searchParams, cart, appliedCoupon, handleApplyCoupon]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  };

  const handlePhoneInputChange = (rawVal: string, isShipping: boolean) => {
    // Strip all non-digit characters except leading '+'
    let cleaned = rawVal.replace(/[^\d+]/g, "");

    // Extract digits only
    const digitsOnly = cleaned.replace(/\D/g, "");

    // Calculate core digits (excluding 91 prefix if length > 10)
    let coreDigits = digitsOnly;
    if (digitsOnly.startsWith("91") && digitsOnly.length > 10) {
      coreDigits = digitsOnly.slice(2);
    } else if (digitsOnly.startsWith("0") && digitsOnly.length > 10) {
      coreDigits = digitsOnly.slice(1);
    }

    if (coreDigits.length > 10) {
      alert("Invalid Mobile Number! Mobile number cannot exceed 10 digits.");
      const maxLen = cleaned.startsWith("+91") ? 13 : cleaned.startsWith("+") ? 11 : 10;
      cleaned = cleaned.slice(0, maxLen);
    }

    if (isShipping) {
      setShippingAddress((prev) => ({ ...prev, phone: cleaned }));
    } else {
      setBillingAddress((prev) => ({ ...prev, phone: cleaned }));
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.postalCode) {
      setErrorMessage("Please fill in all mandatory shipping address fields.");
      return;
    }

    // Strict Phone Number Validation
    const rawPhone = shippingAddress.phone || "";
    const phoneDigitsOnly = rawPhone.replace(/\D/g, "");
    let corePhoneDigits = phoneDigitsOnly;
    if (phoneDigitsOnly.startsWith("91") && phoneDigitsOnly.length > 10) {
      corePhoneDigits = phoneDigitsOnly.slice(2);
    } else if (phoneDigitsOnly.startsWith("0") && phoneDigitsOnly.length > 10) {
      corePhoneDigits = phoneDigitsOnly.slice(1);
    }

    if (/[a-zA-Z]/.test(rawPhone) || corePhoneDigits.length !== 10) {
      alert("Invalid Mobile Number! Mobile number must be exactly 10 digits and cannot contain letters.");
      setErrorMessage("Invalid Mobile Number! Please enter a valid 10-digit mobile number (e.g. +91 9876543210).");
      return;
    }

    if (!cart) return;

    if (hasOutOfStockItems) {
      setErrorMessage("Your cart contains out-of-stock items. Please return to your cart and remove them before placing an order.");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCouponCode = appliedCoupon?.valid
        ? (appliedCoupon.coupon?.couponCode || appliedCoupon.couponCode)
        : undefined;

      const checkoutPayload = {
        guestSessionId: token ? undefined : cart.guestSessionId,
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        paymentMethod: paymentGateway,
        customerGstNumber: customerGstNumber.trim() || undefined,
        couponCode: activeCouponCode,
        notes: orderNotes.trim() || undefined,
      };

      const res = await initiateCheckoutApi(checkoutPayload, token || undefined);
      if (!res.success || !res.data) {
        setErrorMessage(res.message || "Checkout order placement failed. Please check stock.");
        return;
      }

      const orderData = res.data;

      // 2. Initiate Payment with Gateway
      const paymentInitRes = await paymentService.initiatePayment(
        {
          orderId: orderData.id,
          gatewayType: paymentGateway,
          paymentMethod: paymentGateway === "RAZORPAY" ? "UPI_CARDS" : paymentGateway === "STRIPE" ? "CARD" : "TRANSFER",
        },
        token
      );

      if (!paymentInitRes.success || !paymentInitRes.data) {
        setErrorMessage(paymentInitRes.message || "Payment initiation failed.");
        return;
      }

      const paymentInitData = paymentInitRes.data;

      // 3. Handle Gateway-Specific Verification / Workflow
      if (paymentGateway === "MOCK" || paymentGateway === "RAZORPAY" || paymentGateway === "STRIPE") {
        const verifyRes = await paymentService.verifyPayment(
          {
            transactionId: paymentInitData.transactionId,
            gatewayType: paymentGateway,
            razorpayPaymentId: paymentGateway === "RAZORPAY" ? "pay_sim_" + Date.now() : undefined,
            razorpayOrderId: paymentInitData.gatewayOrderId,
            razorpaySignature: "test_sig_verified",
            stripePaymentIntentId: paymentGateway === "STRIPE" ? paymentInitData.gatewayOrderId : undefined,
          },
          token
        );

        if (verifyRes.success) {
          if (cart?.items) {
            for (const item of cart.items) {
              if (item.productId) {
                removeFromWishlist(item.productId);
              }
            }
          }
          await clearCart();
          await refreshCart();
          await refreshWishlist();
          router.push(`/orders/${orderData.orderNumber}`);
        } else {
          setErrorMessage(verifyRes.message || "Payment verification failed.");
        }
      } else if (paymentGateway === "BANK_TRANSFER") {
        setBankPaymentData(paymentInitData);
        setBankModalOpen(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBankTransfer = async () => {
    if (!bankPaymentData) return;
    if (!bankUtrInput.trim()) {
      alert("Please enter the UTR / Bank Reference Number from your transfer.");
      return;
    }

    setIsVerifyingBank(true);
    try {
      const verifyRes = await paymentService.verifyPayment(
        {
          transactionId: bankPaymentData.transactionId,
          gatewayType: "BANK_TRANSFER",
          bankReferenceNumber: bankUtrInput.trim(),
          notes: "UTR submitted by buyer at checkout",
        },
        token
      );

      if (verifyRes.success) {
        if (cart?.items) {
          for (const item of cart.items) {
            if (item.productId) {
              removeFromWishlist(item.productId);
            }
          }
        }
        await clearCart();
        await refreshCart();
        await refreshWishlist();
        setBankModalOpen(false);
        router.push(`/orders/${bankPaymentData.orderNumber}`);
      } else {
        alert(verifyRes.message || "Failed to submit bank reference.");
      }
    } catch (err: any) {
      alert(err.message || "Error submitting bank transfer.");
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <h2 className="text-xl font-bold text-brand-slate-900 mb-2">No items in checkout</h2>
        <p className="text-sm text-brand-slate-500 mb-6">Your shopping cart is currently empty.</p>
        <Link href="/">
          <Button variant="primary">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const couponDiscountAmount = (appliedCoupon && appliedCoupon.valid) ? (appliedCoupon.calculatedDiscount ?? appliedCoupon.discountAmount ?? 0) : 0;
  const grandPayableTotal = Math.max(0, cart.grandTotal - couponDiscountAmount);

  const hasOutOfStockItems = Boolean(
    cart &&
    cart.items &&
    cart.items.some(
      (item) =>
        (item.availableStock !== undefined && item.availableStock !== null && item.availableStock <= 0) ||
        (item.availableStock !== undefined && item.availableStock !== null && item.quantity > item.availableStock)
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Checkout Breadcrumb / Back Link */}
      <div className="mb-6">
        <Link
          href="/cart"
          className="text-xs font-semibold text-brand-slate-500 hover:text-brand-emerald-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-slate-900">
            Secure Multi-Vendor Checkout & Payment
          </h1>
          <p className="text-brand-slate-500 text-xs sm:text-sm mt-1">
            Complete your order with verified manufacturer fulfillment, escrow security, and tax invoice generation
          </p>
        </div>

        {/* 15-Minute Reservation Badge */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-medium">
          <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 animate-pulse" />
          <span>Warehouse inventory held for 15 minutes during checkout</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Checkout Notice</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Shipping Address */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-4">
              <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-emerald-800 text-white text-xs flex items-center justify-center font-black">
                  1
                </span>
                <span>Delivery & Logistics Destination</span>
              </h2>
              <span className="text-xs text-brand-slate-400">Step 1 of 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Full Name / Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Company / Organization Name (Optional)
                </label>
                <input
                  type="text"
                  value={shippingAddress.companyName || ""}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, companyName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  placeholder="e.g. Apex Industrial Solutions"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Mobile Number (for Courier Tracking SMS) *
                </label>
                <input
                  type="tel"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => handlePhoneInputChange(e.target.value, true)}
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800 font-mono"
                  placeholder="400001"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Street Address / Plot / Industrial Area *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.addressLine1}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  placeholder="Unit 4B, Sector 18, Electronic City"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  Landmark / Building Name (Optional)
                </label>
                <input
                  type="text"
                  value={shippingAddress.addressLine2 || ""}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                  placeholder="Opposite Tech Park Gate 2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                  State / Union Territory *
                </label>
                <select
                  value={shippingAddress.state}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, state: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: B2B Tax Invoice & GSTIN */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-4">
              <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-emerald-800 text-white text-xs flex items-center justify-center font-black">
                  2
                </span>
                <span>B2B Commercial Tax Invoice Details</span>
              </h2>
              <Badge variant="brand">GST Input Tax Credit</Badge>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                Buyer GSTIN Number (Optional - for claiming GST input credit)
              </label>
              <input
                type="text"
                value={customerGstNumber}
                onChange={(e) => setCustomerGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 27AAAAA0000A1Z5"
                maxLength={15}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800 uppercase"
              />
              <p className="text-[11px] text-brand-slate-500 mt-1">
                If provided, all vendor sub-orders will generate formal GST B2B tax invoices with this GSTIN.
              </p>
            </div>
          </div>

          {/* Section 3: Payment Gateway Selection */}
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-4">
              <h2 className="text-base font-bold text-brand-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-emerald-800 text-white text-xs flex items-center justify-center font-black">
                  3
                </span>
                <span>Payment Gateway & Escrow Settlement</span>
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Escrow Protected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Sandbox Mock Gateway */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentGateway === "MOCK"
                    ? "border-brand-emerald-800 bg-brand-emerald-50/40 ring-1 ring-brand-emerald-800"
                    : "border-brand-slate-200 hover:bg-brand-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentGateway"
                  value="MOCK"
                  checked={paymentGateway === "MOCK"}
                  onChange={() => setPaymentGateway("MOCK")}
                  className="mt-1 text-brand-emerald-800 focus:ring-brand-emerald-800"
                />
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-emerald-800" />
                      <span className="text-sm font-bold text-brand-slate-900">
                        Instant Sandbox Checkout (1-Click Test Mode)
                      </span>
                    </div>
                    <Badge variant="success">Recommended for Testing</Badge>
                  </div>
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Simulates immediate payment authorization, order confirmation, and automated vendor escrow credit.
                  </p>
                </div>
              </label>

              {/* Razorpay Gateway */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentGateway === "RAZORPAY"
                    ? "border-brand-emerald-800 bg-brand-emerald-50/40 ring-1 ring-brand-emerald-800"
                    : "border-brand-slate-200 hover:bg-brand-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentGateway"
                  value="RAZORPAY"
                  checked={paymentGateway === "RAZORPAY"}
                  onChange={() => setPaymentGateway("RAZORPAY")}
                  className="mt-1 text-brand-emerald-800 focus:ring-brand-emerald-800"
                />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-emerald-800" />
                    <span className="text-sm font-bold text-brand-slate-900">
                      Razorpay Gateway (UPI, RuPay, Visa/MasterCard, NetBanking)
                    </span>
                  </div>
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Fast automated domestic payment reconciliation with instant receipt.
                  </p>
                </div>
              </label>

              {/* Stripe Gateway */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentGateway === "STRIPE"
                    ? "border-brand-emerald-800 bg-brand-emerald-50/40 ring-1 ring-brand-emerald-800"
                    : "border-brand-slate-200 hover:bg-brand-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentGateway"
                  value="STRIPE"
                  checked={paymentGateway === "STRIPE"}
                  onChange={() => setPaymentGateway("STRIPE")}
                  className="mt-1 text-brand-emerald-800 focus:ring-brand-emerald-800"
                />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-emerald-800" />
                    <span className="text-sm font-bold text-brand-slate-900">
                      Stripe Global Cards (International Visa, MasterCard, Amex)
                    </span>
                  </div>
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Direct FX currency processing for overseas trade buyers.
                  </p>
                </div>
              </label>

              {/* B2B Direct Bank Transfer (NEFT / RTGS) */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentGateway === "BANK_TRANSFER"
                    ? "border-brand-emerald-800 bg-brand-emerald-50/40 ring-1 ring-brand-emerald-800"
                    : "border-brand-slate-200 hover:bg-brand-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentGateway"
                  value="BANK_TRANSFER"
                  checked={paymentGateway === "BANK_TRANSFER"}
                  onChange={() => setPaymentGateway("BANK_TRANSFER")}
                  className="mt-1 text-brand-emerald-800 focus:ring-brand-emerald-800"
                />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-brand-emerald-800" />
                    <span className="text-sm font-bold text-brand-slate-900">
                      Corporate Direct Bank Wire / Escrow Transfer (NEFT / RTGS)
                    </span>
                  </div>
                  <p className="text-xs text-brand-slate-500 mt-0.5">
                    Generates virtual escrow account and proforma invoice for high-value B2B orders.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-brand-slate-200 p-6 shadow-sm sticky top-24 space-y-6">
            <h2 className="text-lg font-bold text-brand-slate-900 border-b border-brand-slate-100 pb-4">
              Order Review
            </h2>

            {/* Vendor Breakdown Mini List */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {cart.vendorGroups.map((group, idx) => (
                <div key={group.vendorId || idx} className="bg-brand-slate-50 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-brand-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-brand-emerald-700" />
                      {group.storeName}
                    </span>
                    <span>{formatMoney(group.groupTotal)}</span>
                  </div>
                  <div className="text-[11px] text-brand-slate-500 space-y-1">
                    {group.items.map((i) => (
                      <div key={i.id} className="flex justify-between">
                        <span className="truncate max-w-[170px]">{i.productTitle} × {i.quantity}</span>
                        <span className="font-mono">{formatMoney(i.unitPrice * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input & Applied State */}
            <div className="border-t border-brand-slate-100 pt-4 space-y-2">
              <label className="block text-xs font-bold text-brand-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-emerald-700" />
                <span>Have a Promo Code or Coupon?</span>
              </label>

              {appliedCoupon && appliedCoupon.valid ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      %
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-emerald-900">
                          {appliedCoupon.coupon?.couponCode || appliedCoupon.couponCode}
                        </span>
                        <Badge variant="success">Applied</Badge>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        You save {formatMoney(appliedCoupon.calculatedDiscount ?? appliedCoupon.discountAmount)} ({appliedCoupon.coupon?.title || appliedCoupon.title || "Special Offer"})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10, FLASHSALE"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-brand-slate-200 font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    onClick={() => handleApplyCoupon()}
                    className="text-xs font-bold px-3 rounded-xl"
                  >
                    {isApplyingCoupon ? "Checking..." : "Apply"}
                  </Button>
                </div>
              )}

              {couponMessage && (
                <div
                  className={`text-[11px] font-medium p-2 rounded-lg ${
                    couponMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {couponMessage.text}
                </div>
              )}
            </div>

            {/* Financials */}
            <div className="space-y-3 text-sm border-t border-brand-slate-100 pt-4">
              <div className="flex justify-between text-brand-slate-600">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span className="font-medium text-brand-slate-900">{formatMoney(cart.subtotalAmount)}</span>
              </div>

              {cart.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Wholesale Tier Discount</span>
                  <span>-{formatMoney(cart.discountAmount)}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.valid && (appliedCoupon.calculatedDiscount ?? appliedCoupon.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon ({appliedCoupon.coupon?.couponCode || appliedCoupon.couponCode})</span>
                  </span>
                  <span>-{formatMoney(appliedCoupon.calculatedDiscount ?? appliedCoupon.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-slate-600">
                <span>Estimated Tax (GST)</span>
                <span className="font-medium text-brand-slate-900">{formatMoney(cart.estimatedTaxAmount)}</span>
              </div>

              <div className="flex justify-between text-brand-slate-600">
                <span>Fulfillment & Dispatch</span>
                <span className="font-medium text-brand-slate-900">
                  {cart.estimatedShippingAmount === 0 ? "Free" : formatMoney(cart.estimatedShippingAmount)}
                </span>
              </div>

              <div className="border-t border-brand-slate-200 pt-4 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold text-brand-slate-900">Total Payable</span>
                  <p className="text-[11px] text-brand-slate-400">Escrow Held via {paymentGateway}</p>
                </div>
                <span className="text-2xl font-black text-brand-emerald-950">
                  {formatMoney(grandPayableTotal)}
                </span>
              </div>
            </div>

            {hasOutOfStockItems && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Checkout Blocked</span>
                  <span>One or more items are out of stock. Please return to cart and remove them.</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || hasOutOfStockItems}
              className="w-full rounded-xl py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Authorizing Payment...</span>
              ) : hasOutOfStockItems ? (
                <span>Out of Stock Items in Cart</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Place Order ({formatMoney(grandPayableTotal)})</span>
                </>
              )}
            </Button>

            <div className="pt-2 border-t border-brand-slate-100 text-[11px] text-brand-slate-500 text-center space-y-1">
              <p>Funds are secured in Alight Escrow until vendor dispatch confirmation.</p>
              <p className="flex items-center justify-center gap-1 text-brand-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted Transaction
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Bank Transfer Modal */}
      {bankModalOpen && bankPaymentData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-brand-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-emerald-50 text-brand-emerald-800 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-slate-900">
                    B2B Direct Bank Wire Details
                  </h3>
                  <p className="text-xs text-brand-slate-500">
                    Order: {bankPaymentData.orderNumber}
                  </p>
                </div>
              </div>
              <Badge variant="brand">NEFT / RTGS</Badge>
            </div>

            <div className="bg-brand-slate-50 rounded-2xl p-4 space-y-3 text-xs border border-brand-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-brand-slate-500 font-medium">Virtual Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-slate-900 text-sm">
                    {bankPaymentData.virtualAccountNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(bankPaymentData.virtualAccountNumber || "", "account")}
                    className="text-brand-slate-400 hover:text-brand-emerald-800 p-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedField === "account" && <span className="text-[10px] text-emerald-600 font-bold">Copied</span>}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-brand-slate-500 font-medium">Bank IFSC Code:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-slate-900">
                    {bankPaymentData.bankIfsc}
                  </span>
                  <button
                    onClick={() => copyToClipboard(bankPaymentData.bankIfsc || "", "ifsc")}
                    className="text-brand-slate-400 hover:text-brand-emerald-800 p-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedField === "ifsc" && <span className="text-[10px] text-emerald-600 font-bold">Copied</span>}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-brand-slate-500 font-medium">Beneficiary Name:</span>
                <span className="font-bold text-brand-slate-900 text-right">
                  {bankPaymentData.beneficiaryName}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-brand-slate-500 font-medium">Total Exact Amount:</span>
                <span className="font-black text-brand-emerald-950 text-sm">
                  {formatMoney(bankPaymentData.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-slate-800">
                Enter Bank Transfer UTR / Transaction Reference Number *
              </label>
              <input
                type="text"
                required
                value={bankUtrInput}
                onChange={(e) => setBankUtrInput(e.target.value.toUpperCase())}
                placeholder="e.g. HDFCN26081234567 or CMS12345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-slate-200 text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-emerald-800/20 focus:border-brand-emerald-800"
              />
              <p className="text-[11px] text-brand-slate-400">
                You can also submit this UTR later from your Order Tracking page.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-xs"
                onClick={() => {
                  setBankModalOpen(false);
                  router.push(`/orders/${bankPaymentData.orderNumber}`);
                }}
              >
                Submit Later
              </Button>
              <Button
                variant="primary"
                className="flex-1 rounded-xl text-xs font-bold"
                disabled={isVerifyingBank}
                onClick={handleConfirmBankTransfer}
              >
                {isVerifyingBank ? "Confirming..." : "Confirm & Submit UTR"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-sm font-medium text-brand-slate-500">Loading checkout...</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
