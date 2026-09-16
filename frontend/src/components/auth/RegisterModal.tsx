"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, User, Phone, Store, ShoppingBag, AlertCircle } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { register } = useAuth();
  const [accountType, setAccountType] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        accountType,
      });
      onClose();
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to create account. Please verify input fields.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Alight Account">
      {/* Account Type Selector */}
      <div className="flex bg-brand-slate-100 p-1 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setAccountType("CUSTOMER")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
            accountType === "CUSTOMER"
              ? "bg-white text-brand-emerald-900 shadow-xs"
              : "text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer</span>
        </button>
        <button
          type="button"
          onClick={() => setAccountType("VENDOR")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
            accountType === "VENDOR"
              ? "bg-white text-brand-emerald-900 shadow-xs"
              : "text-brand-slate-500 hover:text-brand-slate-800"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Vendor / Seller</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-slate-700">First Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
              />
              <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-slate-700">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-brand-slate-700">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
            />
            <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-slate-400" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-brand-slate-700">Phone Number (Optional)</label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
            />
            <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-slate-400" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-brand-slate-700">Password</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
            />
            <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-slate-400" />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full text-xs font-semibold mt-2"
        >
          Register {accountType === "VENDOR" ? "as Vendor" : "Account"}
        </Button>

        <div className="text-center pt-2 border-t border-brand-slate-100 text-xs text-brand-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-brand-emerald-800 font-semibold hover:underline ml-1"
          >
            Sign in
          </button>
        </div>
      </form>
    </Modal>
  );
};
