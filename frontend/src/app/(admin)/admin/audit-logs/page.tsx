"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Lock,
  User,
  Calendar,
  Activity,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/services/api-client";

interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams: Record<string, string> = {};
      if (searchTerm) queryParams.search = searchTerm;
      if (actionFilter !== "ALL") queryParams.action = actionFilter;

      const res = await apiClient<any>("/admin/audit-logs", {
        params: queryParams,
      });
      if (res.success && res.data?.content) {
        setLogs(res.data.content);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-gold-400" />
            Immutable Security & Operations Audit Trail
          </h1>
          <p className="text-xs text-brand-slate-400">
            Append-only cryptographic security audit records logging all administrative overrides, role grants, and financial disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Append-Only Enforced
          </span>
          <button
            onClick={fetchLogs}
            className="p-2 bg-brand-slate-800 hover:bg-brand-slate-700 border border-brand-slate-700 text-brand-slate-300 rounded-lg text-xs transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by actor, action, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-400 focus:outline-none focus:border-brand-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Actions</option>
            <option value="VENDOR_APPROVAL">Vendor Approval</option>
            <option value="RELEASE_ESCROW_PAYOUT">Release Escrow Payout</option>
            <option value="UPDATE_USER_ROLES">Update User Roles</option>
            <option value="REJECT_COMPLIANCE_DOC">Reject Compliance Doc</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-slate-500 text-xs">
                    {loading ? "Loading audit events..." : "No audit log entries recorded."}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                <tr key={log.id} className="hover:bg-brand-slate-750/40 transition-colors">
                  <td className="py-3 px-4 text-brand-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{log.actorEmail}</div>
                    <span className="text-[10px] text-brand-gold-400 font-mono">
                      {log.actorRole?.replace("ROLE_", "")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-slate-700 text-brand-slate-300 border border-brand-slate-600 font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{log.resource}</div>
                    {log.resourceId && (
                      <span className="text-[10px] text-brand-slate-500 font-mono">
                        {log.resourceId}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {log.result === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                        {log.result}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Diff / Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-emerald-400" />
                Audit Record Diff: {selectedLog.id}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-brand-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-brand-slate-900 rounded-lg border border-brand-slate-750">
                <div>
                  <span className="text-brand-slate-400">Actor:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedLog.actorEmail}</div>
                </div>
                <div>
                  <span className="text-brand-slate-400">Role:</span>
                  <div className="font-semibold text-brand-gold-400 mt-0.5">{selectedLog.actorRole}</div>
                </div>
                <div>
                  <span className="text-brand-slate-400">Client IP:</span>
                  <div className="font-mono text-brand-slate-300 mt-0.5">{selectedLog.ipAddress || "127.0.0.1"}</div>
                </div>
                <div>
                  <span className="text-brand-slate-400">Timestamp:</span>
                  <div className="font-mono text-brand-slate-300 mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <span className="text-brand-slate-400 font-semibold block mb-1">State Payload Diff / Details</span>
                <pre className="p-3 bg-brand-slate-900 rounded-lg border border-brand-slate-750 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : "No state payload recorded."}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 bg-brand-slate-700 text-white rounded-lg hover:bg-brand-slate-600 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
