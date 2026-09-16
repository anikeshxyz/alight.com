"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Eye,
  EyeOff,
  ShoppingBag,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  Lock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "VIP Gold" | "Verified Buyer" | "Corporate B2B" | "New Customer";
  totalOrders: number;
  totalSpent: string;
  returnCount: number;
  status: "ACTIVE" | "FLAGGED" | "SUSPENDED";
  riskScore: "LOW" | "MEDIUM" | "HIGH";
  registeredAt: string;
  lastOrderAt: string;
  addresses: { label: string; line1: string; city: string; state: string; pincode: string }[];
  orders: { orderNumber: string; date: string; amount: string; status: string; itemsCount: number }[];
  returns: { returnId: string; date: string; product: string; amount: string; status: string }[];
  tickets: { ticketId: string; subject: string; status: string; date: string }[];
  notes: string[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [maskPii, setMaskPii] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"profile" | "orders" | "returns" | "tickets" | "notes">("profile");
  const [newNote, setNewNote] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { adminUserService } = await import("@/services/admin-user-service");
        const users = await adminUserService.getAllAdminUsers();
        if (users && users.length > 0) {
          const mapped: CustomerRecord[] = users.map((u) => ({
            id: u.id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            email: u.email,
            phone: u.phone || "Not provided",
            tier: u.roles?.includes("ROLE_ADMIN") ? "Corporate B2B" : "New Customer",
            totalOrders: 0,
            totalSpent: "₹0",
            returnCount: 0,
            status: u.active ? "ACTIVE" : "SUSPENDED",
            riskScore: "LOW",
            registeredAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "Recent",
            lastOrderAt: "No orders placed",
            addresses: [],
            orders: [],
            returns: [],
            tickets: [],
            notes: [],
          }));
          setCustomers(mapped);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error("Failed to load customer users", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "ALL" || c.tier === tierFilter;
    const matchesRisk = riskFilter === "ALL" || c.riskScore === riskFilter;
    return matchesSearch && matchesTier && matchesRisk;
  });

  const maskEmail = (email: string) => {
    if (!maskPii) return email;
    const [name, domain] = email.split("@");
    return `${name.substring(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!maskPii) return phone;
    return phone.replace(/(\+91\s\d{2})\d{4}(\d{4})/, "$1****$2");
  };

  const handleToggleCustomerStatus = (cust: CustomerRecord) => {
    const nextStatus = cust.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setCustomers((prev) =>
      prev.map((c) => (c.id === cust.id ? { ...c, status: nextStatus } : c))
    );
    if (selectedCustomer?.id === cust.id) {
      setSelectedCustomer({ ...selectedCustomer, status: nextStatus });
    }
    setNotification(`Customer ${cust.name} status updated to ${nextStatus}`);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleAddNote = () => {
    if (!selectedCustomer || !newNote.trim()) return;
    const updatedNotes = [newNote.trim(), ...selectedCustomer.notes];
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? { ...c, notes: updatedNotes } : c))
    );
    setSelectedCustomer({ ...selectedCustomer, notes: updatedNotes });
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-emerald-400" />
            Marketplace Customer Accounts Directory
          </h1>
          <p className="text-xs text-brand-slate-400">
            Audit customer purchasing profiles, order velocity, returns history, and PII protection controls.
          </p>
        </div>

        {/* PII Protection Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMaskPii(!maskPii)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              maskPii
                ? "bg-purple-950/60 text-purple-300 border-purple-700"
                : "bg-brand-slate-800 text-brand-slate-300 border-brand-slate-700 hover:text-white"
            }`}
          >
            {maskPii ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {maskPii ? "PII Masking Active" : "Reveal PII (Super Admin)"}
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-400 focus:outline-none focus:border-brand-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Tiers</option>
            <option value="VIP Gold">VIP Gold</option>
            <option value="Corporate B2B">Corporate B2B</option>
            <option value="Verified Buyer">Verified Buyer</option>
            <option value="New Customer">New Customer</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Risk Ratings</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Account Tier</th>
                <th className="py-3 px-4">Orders & Spend</th>
                <th className="py-3 px-4">Return Rate</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-slate-400">
                    No customers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-brand-slate-750/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-white">{cust.name}</div>
                        <div className="text-[11px] text-brand-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-brand-slate-500" />
                          {maskEmail(cust.email)}
                        </div>
                        <div className="text-[11px] text-brand-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-brand-slate-500" />
                          {maskPhone(cust.phone)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-brand-slate-700 text-brand-gold-300 border-brand-gold-500/30">
                        {cust.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{cust.totalSpent}</div>
                      <div className="text-[11px] text-brand-slate-400">{cust.totalOrders} total orders</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${cust.returnCount > 2 ? "text-rose-400" : "text-brand-slate-300"}`}>
                        {cust.returnCount} returns ({Math.round((cust.returnCount / Math.max(1, cust.totalOrders)) * 100)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {cust.riskScore === "LOW" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700">
                          Low Risk
                        </span>
                      )}
                      {cust.riskScore === "MEDIUM" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-700">
                          Medium
                        </span>
                      )}
                      {cust.riskScore === "HIGH" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-700">
                          High Risk
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cust.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-700">
                          <XCircle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        Profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Side Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-brand-slate-850 border-l border-brand-slate-700 w-full max-w-xl h-full shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b border-brand-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{selectedCustomer.name}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-gold-500/10 text-brand-gold-400 border border-brand-gold-500/30">
                    {selectedCustomer.tier}
                  </span>
                </div>
                <p className="text-xs text-brand-slate-400 mt-0.5">
                  ID: {selectedCustomer.id} • Registered: {selectedCustomer.registeredAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-brand-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex border-b border-brand-slate-700 bg-brand-slate-900/60 text-xs">
              {(["profile", "orders", "returns", "tickets", "notes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDrawerTab(tab)}
                  className={`flex-1 py-2.5 text-center font-semibold capitalize border-b-2 transition-all ${
                    activeDrawerTab === tab
                      ? "border-brand-emerald-500 text-brand-emerald-400 bg-brand-slate-800/80"
                      : "border-transparent text-brand-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {activeDrawerTab === "profile" && (
                <div className="space-y-4">
                  <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 space-y-2.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Contact & PII</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-brand-slate-400">Email Address</span>
                        <p className="text-white font-medium mt-0.5">{maskEmail(selectedCustomer.email)}</p>
                      </div>
                      <div>
                        <span className="text-brand-slate-400">Phone Number</span>
                        <p className="text-white font-medium mt-0.5">{maskPhone(selectedCustomer.phone)}</p>
                      </div>
                      <div>
                        <span className="text-brand-slate-400">Lifetime Gross Spend</span>
                        <p className="text-emerald-400 font-bold mt-0.5">{selectedCustomer.totalSpent}</p>
                      </div>
                      <div>
                        <span className="text-brand-slate-400">Total Orders Placed</span>
                        <p className="text-white font-medium mt-0.5">{selectedCustomer.totalOrders} Orders</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Saved Shipping Addresses</h3>
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((addr, idx) => (
                        <div key={idx} className="p-2.5 bg-brand-slate-900/80 rounded-lg border border-brand-slate-750">
                          <span className="text-[10px] font-semibold text-brand-gold-400 uppercase">{addr.label}</span>
                          <p className="text-brand-slate-300 mt-1">{addr.line1}</p>
                          <p className="text-brand-slate-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl">
                    <div>
                      <span className="font-semibold text-white">Administrative Override</span>
                      <p className="text-brand-slate-400 text-[11px]">Suspend customer ordering privileges</p>
                    </div>
                    <button
                      onClick={() => handleToggleCustomerStatus(selectedCustomer)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold ${
                        selectedCustomer.status === "ACTIVE"
                          ? "bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                          : "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {selectedCustomer.status === "ACTIVE" ? "Suspend Account" : "Reactivate Account"}
                    </button>
                  </div>
                </div>
              )}

              {activeDrawerTab === "orders" && (
                <div className="space-y-2.5">
                  {selectedCustomer.orders.map((ord) => (
                    <div key={ord.orderNumber} className="p-3 bg-brand-slate-900/80 border border-brand-slate-750 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{ord.orderNumber}</span>
                        <div className="text-[11px] text-brand-slate-400 mt-0.5">
                          {ord.date} • {ord.itemsCount} Items
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white">{ord.amount}</span>
                        <div className="mt-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeDrawerTab === "returns" && (
                <div className="space-y-2.5">
                  {selectedCustomer.returns.length === 0 ? (
                    <p className="text-brand-slate-400 text-center py-6">No return records for this customer.</p>
                  ) : (
                    selectedCustomer.returns.map((ret) => (
                      <div key={ret.returnId} className="p-3 bg-brand-slate-900/80 border border-brand-slate-750 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{ret.returnId}</span>
                          <p className="text-brand-slate-300 mt-0.5">{ret.product}</p>
                          <span className="text-[10px] text-brand-slate-500">{ret.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-rose-400">{ret.amount}</span>
                          <div className="mt-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-slate-800 text-amber-300 border border-amber-800">
                              {ret.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDrawerTab === "tickets" && (
                <div className="space-y-2.5">
                  {selectedCustomer.tickets.length === 0 ? (
                    <p className="text-brand-slate-400 text-center py-6">No support tickets recorded.</p>
                  ) : (
                    selectedCustomer.tickets.map((tkt) => (
                      <div key={tkt.ticketId} className="p-3 bg-brand-slate-900/80 border border-brand-slate-750 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{tkt.ticketId}</span>
                          <p className="text-brand-slate-300 mt-0.5">{tkt.subject}</p>
                          <span className="text-[10px] text-brand-slate-500">{tkt.date}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                          {tkt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDrawerTab === "notes" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add administrative note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-1.5 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded-lg font-semibold"
                    >
                      Add Note
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedCustomer.notes.map((note, idx) => (
                      <div key={idx} className="p-2.5 bg-brand-slate-900/80 border border-brand-slate-750 rounded-lg text-brand-slate-300 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-brand-gold-400 mt-0.5 flex-shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
