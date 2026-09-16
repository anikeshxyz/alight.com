"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Laptop,
  Clock,
  History,
} from "lucide-react";

export default function CustomerSecurityPage() {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    // Simulate password update endpoint or API
    setTimeout(() => {
      setSaving(false);
      setFeedback({
        type: "success",
        text: "Your password has been updated. Please use your new password next time you sign in.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Login & Account Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Safeguard your authentication credentials, password, and active marketplace sessions
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Update Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                placeholder="Re-type new password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="w-full text-xs py-2"
            >
              {saving ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </div>

        {/* Active Session & Two-Factor Information */}
        <div className="space-y-4">
          {/* Active Session Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Laptop className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-slate-900">Current Active Session</h2>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Current Web Browser</p>
                  <p className="text-[11px] text-slate-500">Active Now • Verified JWT Bearer</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                This Device
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="w-full text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Current Session</span>
            </Button>
          </div>

          {/* 2FA Protection Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Smartphone className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-slate-900">Account Protection</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Alight International enforces role-based access control (RBAC).
              Transactions and address modifications require an authenticated customer token.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Token Authenticated Session Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
