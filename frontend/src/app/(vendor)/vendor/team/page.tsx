"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Shield,
  CheckCircle2,
  Trash2,
  Mail,
  KeyRound,
  Lock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

import { useAuth } from "@/context/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "CATALOG_MANAGER" | "INVENTORY_MANAGER" | "ORDER_MANAGER" | "FINANCE_MANAGER";
  status: "ACTIVE" | "INVITED";
  lastLogin: string;
}

export default function VendorTeamPage() {
  const { user } = useAuth();
  const [invitedMembers, setInvitedMembers] = useState<TeamMember[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("CATALOG_MANAGER");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const team: TeamMember[] = [
    ...(user
      ? [
          {
            id: user.id || "vendor-owner",
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Account Owner",
            email: user.email || "",
            role: "OWNER" as const,
            status: "ACTIVE" as const,
            lastLogin: "Active Now",
          },
        ]
      : []),
    ...invitedMembers,
  ];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: "INVITED",
      lastLogin: "Invitation Sent",
    };

    setInvitedMembers((prev) => [...prev, newMember]);
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteModalOpen(false);
      setName("");
      setEmail("");
    }, 1500);
  };

  const getRoleBadge = (r: TeamMember["role"]) => {
    switch (r) {
      case "OWNER":
        return <Badge variant="brand" size="sm" className="bg-brand-emerald-800 text-white">Vendor Owner</Badge>;
      case "FINANCE_MANAGER":
        return <Badge variant="neutral" size="sm">Finance Manager</Badge>;
      case "ORDER_MANAGER":
        return <Badge variant="neutral" size="sm">Fulfillment Manager</Badge>;
      case "CATALOG_MANAGER":
        return <Badge variant="neutral" size="sm">Catalog Specialist</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{r}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Team Members & Role-Based Permissions
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              RBAC Multi-User
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Manage merchant staff accounts, delegate catalog editing or order packaging, and safeguard sensitive bank payout credentials.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setInviteModalOpen(true)}
          className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Invite Team Member
        </Button>
      </div>

      {/* 2. ROLE SECURITY MATRIX CARD */}
      <Card className="p-5 border-brand-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-brand-slate-900">Role Privilege Hierarchy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-200 space-y-1">
            <span className="font-bold text-brand-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-emerald-800" /> Catalog Specialists
            </span>
            <p className="text-[11px] text-brand-slate-500">Edit SKUs, upload photos, set pricing. Cannot view bank accounts or withdraw settlements.</p>
          </div>

          <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-200 space-y-1">
            <span className="font-bold text-brand-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-emerald-800" /> Dispatch Managers
            </span>
            <p className="text-[11px] text-brand-slate-500">Pack orders, generate shipping labels and courier manifests. No catalog deletion access.</p>
          </div>

          <div className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-200 space-y-1">
            <span className="font-bold text-brand-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-emerald-800" /> Finance Managers
            </span>
            <p className="text-[11px] text-brand-slate-500">Export GSTR tax ledgers, review escrow settlement transactions, download GST invoices.</p>
          </div>
        </div>
      </Card>

      {/* 3. TEAM MEMBERS LIST */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-500">
                    No team members found.
                  </td>
                </tr>
              ) : (
                team.map((m) => (
                  <tr key={m.id} className="hover:bg-brand-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-brand-slate-900">{m.name}</td>
                    <td className="px-4 py-3.5 font-mono text-brand-slate-600">{m.email}</td>
                    <td className="px-4 py-3.5">{getRoleBadge(m.role)}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {m.status === "ACTIVE" ? "✓ Active" : "✉ Invited"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-brand-slate-500 text-[11px]">{m.lastLogin}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Staff Team Member">
        <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Anand Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Work Email Address *</label>
            <input
              type="email"
              placeholder="anand@atelier.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Permission Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            >
              <option value="CATALOG_MANAGER">Catalog Manager (Products & Pricing)</option>
              <option value="ORDER_MANAGER">Fulfillment & Order Manager (Dispatches & AWBs)</option>
              <option value="FINANCE_MANAGER">Finance Manager (Tax & Settlements)</option>
              <option value="INVENTORY_MANAGER">Inventory Specialist (Stock Counts & Warehouses)</option>
            </select>
          </div>

          {inviteSuccess && (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Invitation email dispatched with secure onboarding link!
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-brand-emerald-800 text-white font-bold">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
