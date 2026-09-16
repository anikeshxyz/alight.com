"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  Lock,
  Layers,
  Search,
  RefreshCw,
  Edit3,
  Save,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  adminUserService,
  RoleDetailDto,
  PermissionDto,
} from "@/services/admin-user-service";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleDetailDto | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [rolesData, permsData] = await Promise.all([
        adminUserService.getAllRoles(),
        adminUserService.getAllPermissions(),
      ]);
      setRoles(rolesData || []);
      setAllPermissions(permsData || []);
      if (rolesData && rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
        setEditPermissions(rolesData[0].permissions.map((p) => p.name));
      }
    } catch (err: any) {
      console.error("Failed to load roles and permissions:", err.message);
      setErrorMsg("Unable to load role definitions from backend. Please retry.");
      setRoles([]);
      setAllPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (role: RoleDetailDto) => {
    setSelectedRole(role);
    setEditPermissions(role.permissions.map((p) => p.name));
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleTogglePermission = (permName: string) => {
    if (!selectedRole || selectedRole.name === "ROLE_SUPER_ADMIN") return;
    if (editPermissions.includes(permName)) {
      setEditPermissions(editPermissions.filter((p) => p !== permName));
    } else {
      setEditPermissions([...editPermissions, permName]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    if (selectedRole.name === "ROLE_SUPER_ADMIN") {
      setErrorMsg("ROLE_SUPER_ADMIN has immutable, unrestricted permissions.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await adminUserService.updateRolePermissions(
        selectedRole.name,
        editPermissions
      );
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? updated : r))
      );
      setSelectedRole(updated);
      setSuccessMsg(`Permissions saved successfully for ${selectedRole.name}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by domain
  const domains = Array.from(new Set(allPermissions.map((p) => p.domain || "general"))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-gold-400" />
            RBAC Roles & Granular Permission Matrix
          </h1>
          <p className="text-xs text-brand-slate-400">
            Define system roles, audit capability assignments, and manage server-side security boundaries.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-brand-slate-800 hover:bg-brand-slate-700 border border-brand-slate-700 text-brand-slate-300 rounded-lg text-xs transition-colors self-start sm:self-auto"
          title="Refresh Roles"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
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

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Roles Catalog */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              System Roles ({roles.length})
            </span>
          </div>

          <div className="space-y-2">
            {roles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              const isSuper = role.name === "ROLE_SUPER_ADMIN";
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-brand-slate-800 border-brand-gold-500/80 shadow-lg"
                      : "bg-brand-slate-850/60 border-brand-slate-750 hover:bg-brand-slate-800 hover:border-brand-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {isSuper && <Lock className="w-3.5 h-3.5 text-purple-400" />}
                      {role.name.replace("ROLE_", "")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-slate-700 text-brand-slate-300 border border-brand-slate-600">
                      {isSuper ? "ALL" : `${role.permissions?.length || 0} perms`}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-slate-400 mt-1 line-clamp-2">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRole ? (
            <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4">
              {/* Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      {selectedRole.name}
                    </h2>
                    {selectedRole.name === "ROLE_SUPER_ADMIN" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Unrestricted Super User
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-emerald-950/60 text-brand-emerald-300 border border-brand-emerald-700">
                        Configurable Matrix
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-slate-400 mt-1">
                    {selectedRole.description}
                  </p>
                </div>

                {selectedRole.name !== "ROLE_SUPER_ADMIN" && (
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all self-start sm:self-auto disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>

              {selectedRole.name === "ROLE_SUPER_ADMIN" && (
                <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-lg text-xs text-purple-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>
                    Super Admin bypasses granular permission checks server-side via the Security Context. All {allPermissions.length} system permissions are implicitly active.
                  </span>
                </div>
              )}

              {/* Permission Domain Groups */}
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {domains.map((domain) => {
                  const domainPerms = allPermissions.filter((p) => (p.domain || "general") === domain);
                  if (domainPerms.length === 0) return null;

                  return (
                    <div key={domain} className="space-y-2">
                      <div className="flex items-center justify-between bg-brand-slate-900/60 px-3 py-1.5 rounded-lg border border-brand-slate-750">
                        <span className="text-[11px] font-bold text-brand-gold-400 uppercase tracking-wider">
                          Domain: {domain}
                        </span>
                        <span className="text-[10px] text-brand-slate-400">
                          {domainPerms.filter((p) => editPermissions.includes(p.name)).length} of {domainPerms.length} assigned
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {domainPerms.map((perm) => {
                          const isAssigned = editPermissions.includes(perm.name);
                          const isSuper = selectedRole.name === "ROLE_SUPER_ADMIN";

                          return (
                            <label
                              key={perm.id || perm.name}
                              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                                isSuper
                                  ? "bg-purple-950/20 border-purple-900/40 opacity-80 cursor-default"
                                  : isAssigned
                                  ? "bg-brand-slate-900 border-brand-emerald-700/60 cursor-pointer"
                                  : "bg-brand-slate-900/40 border-brand-slate-750/60 text-brand-slate-400 hover:border-brand-slate-600 cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isSuper}
                                checked={isSuper || isAssigned}
                                onChange={() => handleTogglePermission(perm.name)}
                                className="mt-0.5 rounded text-brand-emerald-500 focus:ring-0 bg-brand-slate-800 border-brand-slate-700"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-white truncate font-mono text-[11px]">
                                  {perm.name}
                                </div>
                                <p className="text-[10px] text-brand-slate-400 mt-0.5 line-clamp-2">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-12 text-center text-brand-slate-400 text-xs">
              Select a role from the left to inspect and configure permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
