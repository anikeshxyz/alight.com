"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, AlertCircle, Store, ShieldCheck, User as UserIcon } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const authData = await login({ email, password });
      onClose();
      setEmail("");
      setPassword("");

      const roles = authData.roles || [];
      if (roles.includes("ROLE_VENDOR")) {
        router.push("/vendor");
      } else if (roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN")) {
        router.push("/admin");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to sign in. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign In to Alight Marketplace">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo Fast Fill Presets */}
        <div className="p-2.5 bg-brand-slate-50 border border-brand-slate-200 rounded-xl space-y-1.5">
          <p className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">
            Quick Fill Demo Accounts:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setDemoCredentials("seller@alight.com")}
              className="px-2 py-1.5 bg-white border border-brand-slate-200 rounded-lg text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Store className="w-3 h-3" />
              <span>Seller</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("admin@alight.com")}
              className="px-2 py-1.5 bg-white border border-brand-slate-200 rounded-lg text-[11px] font-semibold text-brand-gold-700 hover:bg-amber-50 hover:border-amber-300 flex items-center justify-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("customer@alight.com")}
              className="px-2 py-1.5 bg-white border border-brand-slate-200 rounded-lg text-[11px] font-semibold text-brand-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center gap-1 transition-colors"
            >
              <UserIcon className="w-3 h-3" />
              <span>Customer</span>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-brand-slate-700">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@alight.com"
              className="w-full pl-9 pr-3 py-2 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
            />
            <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-slate-400" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-brand-slate-700">
              Password
            </label>
            <a href="#" className="text-[11px] text-brand-emerald-800 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white"
            />
            <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-slate-400" />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full text-xs font-semibold mt-2"
        >
          Sign In & Continue
        </Button>

        <div className="text-center pt-2 border-t border-brand-slate-100 text-xs text-brand-slate-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-brand-emerald-800 font-semibold hover:underline ml-1"
          >
            Create account
          </button>
        </div>
      </form>
    </Modal>
  );
};
