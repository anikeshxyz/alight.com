"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Store,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { CurrencySwitcher } from "@/components/common/CurrencySwitcher";
import { NotificationBell } from "@/components/common/NotificationBell";

export const StorefrontHeader: React.FC = () => {
  const router = useRouter();
  const { user, logout, isVendor, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/products");
    }
  };

  const handleOpenLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };

  const handleOpenRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-brand-slate-200">
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-brand-slate-700 hover:bg-brand-slate-100 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <Link href="/" className="flex items-center py-1 group">
              <img
                src="/images/alight-logo.png"
                alt="ALIGHT - Kitchen, Bathroom and Wardrobe Accessories"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search kitchenware, bathroom, storage essentials, brands..."
                className="w-full pl-10 pr-9 py-2 text-sm bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate-400 hover:text-brand-emerald-800 transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate-400 hover:text-brand-slate-600"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Switcher */}
            <div className="hidden sm:block">
              <CurrencySwitcher variant="light" />
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="flex items-center gap-1.5 p-2 text-brand-slate-700 hover:text-brand-emerald-800 hover:bg-brand-slate-50 rounded-lg transition-colors"
              title="Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <Badge
                    variant="brand"
                    size="sm"
                    className="absolute -top-2 -right-2 px-1.5 py-0 text-[10px]"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-medium">Wishlist</span>
            </Link>

            {/* Cart Link */}
            <Link
              href="/cart"
              className="flex items-center gap-1.5 p-2 text-brand-slate-700 hover:text-brand-emerald-800 hover:bg-brand-slate-50 rounded-lg transition-colors"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge
                    variant="brand"
                    size="sm"
                    className="absolute -top-2 -right-2 px-1.5 py-0 text-[10px]"
                  >
                    {itemCount}
                  </Badge>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-medium">Cart</span>
            </Link>

            {/* Direct Vendor Portal shortcut if vendor */}
            {isVendor && (
              <Link
                href="/vendor"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                title="Go to Vendor Operating Console"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Vendor Center</span>
              </Link>
            )}

            {/* Account / User Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-brand-slate-800 bg-brand-slate-100 hover:bg-brand-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-brand-emerald-800" />
                  <span className="max-w-[100px] truncate">{user.firstName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-brand-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-brand-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-brand-slate-100">
                      <p className="text-xs font-bold text-brand-slate-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-brand-slate-500 truncate">{user.email}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {user.roles.map((r) => (
                          <span key={r} className="text-[9px] bg-brand-emerald-50 text-brand-emerald-800 px-1.5 py-0.5 rounded font-medium">
                            {r.replace("ROLE_", "")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-brand-slate-700 hover:bg-brand-slate-50 hover:text-brand-emerald-800"
                    >
                      My Account & Orders
                    </Link>

                    <Link
                      href="/support"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-brand-slate-700 hover:bg-brand-slate-50 hover:text-brand-emerald-800"
                    >
                      Help & Support Tickets
                    </Link>

                    {isVendor && (
                      <Link
                        href="/vendor"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-emerald-800 font-semibold hover:bg-brand-emerald-50"
                      >
                        Vendor Dashboard
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-gold-600 font-semibold hover:bg-brand-slate-50"
                      >
                        Admin Control Center
                      </Link>
                    )}

                    <div className="border-t border-brand-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-brand-slate-700 hover:text-brand-emerald-800 hover:bg-brand-slate-50 border border-brand-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={handleOpenRegister}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar & Currency */}
        <div className="md:hidden px-4 pb-3 flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories, brands..."
              className="w-full pl-10 pr-9 py-2 text-sm bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
            />
            <button
              type="submit"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate-400 hover:text-brand-emerald-800"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate-400 hover:text-brand-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
          <CurrencySwitcher variant="light" />
        </div>
      </header>

      {/* Auth Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={handleOpenRegister}
      />
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={handleOpenLogin}
      />
    </>
  );
};
