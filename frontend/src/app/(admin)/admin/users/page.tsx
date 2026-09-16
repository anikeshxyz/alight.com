"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  UserPlus,
  KeyRound,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit2,
  Lock,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  adminUserService,
  AdminUserSummaryDto,
  RoleDetailDto,
} from "@/services/admin-user-service";

const SYSTEM_ROLES = [
  { key: "ROLE_SUPER_ADMIN", label: "Super Admin", color: "bg-purple-900/40 text-purple-300 border-purple-700" },
  { key: "ROLE_MARKETPLACE_ADMIN", label: "Marketplace Admin", color: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  { key: "ROLE_VENDOR_ADMIN", label: "Vendor Admin", color: "bg-blue-900/40 text-blue-300 border-blue-700" },
  { key: "ROLE_CATALOG_ADMIN", label: "Catalog Admin", color: "bg-amber-900/40 text-amber-300 border-amber-700" },
  { key: "ROLE_ORDER_ADMIN", label: "Order Admin", color: "bg-cyan-900/40 text-cyan-300 border-cyan-700" },
  { key: "ROLE_LOGISTICS_ADMIN", label: "Logistics Admin", color: "bg-indigo-900/40 text-indigo-300 border-indigo-700" },
  { key: "ROLE_FINANCE_ADMIN", label: "Finance Admin", color: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  { key: "ROLE_TAX_ADMIN", label: "Tax Admin", color: "bg-orange-900/40 text-orange-300 border-orange-700" },
  { key: "ROLE_COMPLIANCE_ADMIN", label: "Compliance Admin", color: "bg-rose-900/40 text-rose-300 border-rose-700" },
  { key: "ROLE_SUPPORT_ADMIN", label: "Support Admin", color: "bg-teal-900/40 text-teal-300 border-teal-700" },
  { key: "ROLE_MARKETING_ADMIN", label: "Marketing Admin", color: "bg-pink-900/40 text-pink-300 border-pink-700" },
  { key: "ROLE_ANALYTICS_ADMIN", label: "Analytics Admin", color: "bg-slate-800 text-slate-300 border-slate-600" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummaryDto[]>([]);
  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummaryDto | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    roles: ["ROLE_MARKETPLACE_ADMIN"],
  });
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [usersData, rolesData] = await Promise.all([
        adminUserService.getAllAdminUsers(),
        adminUserService.getAllRoles(),
      ]);
      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (err: any) {
      console.error("Failed to load admin users:", err);
      setErrorMsg(err.message || "Failed to load admin operators from server.");
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (user: AdminUserSummaryDto) => {
    const nextStatus = !user.active;
    try {
      await adminUserService.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: nextStatus } : u))
      );
      setSuccessMsg(`User ${user.email} status changed to ${nextStatus ? "Active" : "Disabled"}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user status");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const created = await adminUserService.createAdminUser(createForm);
      setUsers((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setSuccessMsg(`Admin operator ${createForm.email} created successfully`);
      setCreateForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        roles: ["ROLE_MARKETPLACE_ADMIN"],
      });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create admin user");
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      await adminUserService.updateUserRoles(selectedUser.id, editRoles);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, roles: editRoles } : u))
      );
      setShowRolesModal(false);
      setSuccessMsg(`Roles updated for ${selectedUser.email}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update roles");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    try {
      await adminUserService.resetUserPassword(selectedUser.id, newPassword);
      setShowPasswordModal(false);
      setNewPassword("");
      setSuccessMsg(`Password reset successfully for ${selectedUser.email}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "ALL" || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-emerald-400" />
            Admin Staff & Operator Directory
          </h1>
          <p className="text-xs text-brand-slate-400">
            Manage administrative operators, enforce least-privilege RBAC domain boundaries, and audit access credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            New Admin Operator
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-brand-slate-800 hover:bg-brand-slate-700 border border-brand-slate-700 text-brand-slate-300 rounded-lg text-xs transition-colors"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-700 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-400 focus:outline-none focus:border-brand-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-brand-slate-400">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Roles</option>
            {SYSTEM_ROLES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-slate-400">
                    No admin users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-slate-750/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[11px] text-brand-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-brand-slate-500" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-[11px] text-brand-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-brand-slate-500" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.roles.map((role) => {
                          const conf = SYSTEM_ROLES.find((r) => r.key === role);
                          return (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                conf ? conf.color : "bg-brand-slate-700 text-brand-slate-300 border-brand-slate-600"
                              }`}
                            >
                              {conf ? conf.label : role.replace("ROLE_", "")}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-700">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-brand-slate-400 text-[11px]">
                      {user.lastLoginAt ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-brand-slate-500" />
                          {new Date(user.lastLoginAt).toLocaleDateString()} {new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-brand-slate-500 italic">Never logged in</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditRoles([...user.roles]);
                            setShowRolesModal(true);
                          }}
                          className="px-2 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Assign Roles"
                        >
                          <Shield className="w-3 h-3 text-brand-gold-400" />
                          Roles
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPassword("");
                            setShowPasswordModal(true);
                          }}
                          className="px-2 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3 h-3 text-cyan-400" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            user.active
                              ? "bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800"
                              : "bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {user.active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Admin User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-emerald-400" />
                Create New Admin Operator
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-brand-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-brand-slate-300 font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-brand-slate-300 font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                />
              </div>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                />
              </div>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Primary Role Assignment</label>
                <select
                  value={createForm.roles[0]}
                  onChange={(e) => setCreateForm({ ...createForm, roles: [e.target.value] })}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                >
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-emerald-800 text-white rounded-lg hover:bg-brand-emerald-700 font-semibold"
                >
                  Create Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Roles */}
      {showRolesModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-gold-400" />
                  Assign Roles: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-[11px] text-brand-slate-400 mt-0.5">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setShowRolesModal(false)}
                className="text-brand-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {SYSTEM_ROLES.map((role) => {
                const checked = editRoles.includes(role.key);
                return (
                  <label
                    key={role.key}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked
                        ? "bg-brand-slate-800 border-brand-emerald-600 text-white"
                        : "bg-brand-slate-900/60 border-brand-slate-750 text-brand-slate-400 hover:border-brand-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setEditRoles(editRoles.filter((r) => r !== role.key));
                          } else {
                            setEditRoles([...editRoles, role.key]);
                          }
                        }}
                        className="rounded text-brand-emerald-500 focus:ring-0 bg-brand-slate-900 border-brand-slate-700"
                      />
                      <span className="font-medium text-white">{role.label}</span>
                    </div>
                    <span className="text-[10px] text-brand-slate-500 font-mono">{role.key}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700 text-xs">
              <button
                onClick={() => setShowRolesModal(false)}
                className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                className="px-4 py-1.5 bg-brand-emerald-800 text-white rounded-lg hover:bg-brand-emerald-700 font-semibold"
              >
                Save Role Bindings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                Reset Credentials
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-brand-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-brand-slate-300">
                Enter a new temporary password for operator <strong className="text-white">{selectedUser.email}</strong>. This will also clear any account lockouts.
              </p>
              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">New Password</label>
                <input
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  disabled={newPassword.length < 8}
                  onClick={handleResetPassword}
                  className="px-4 py-1.5 bg-cyan-800 disabled:opacity-50 text-white rounded-lg hover:bg-cyan-700 font-semibold"
                >
                  Set New Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
