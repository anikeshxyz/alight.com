"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getWishlistApi, addWishlistItemApi, removeWishlistItemApi } from "@/services/discovery-service";

export interface WishlistProduct {
  id: string;
  title: string;
  slug?: string;
  primaryImageUrl?: string;
  basePrice?: number;
  discountPrice?: number;
  categoryName?: string;
  brandName?: string;
  vendorStoreName?: string;
}

interface WishlistContextType {
  wishlistIds: Set<string>;
  wishlistProducts: WishlistProduct[];
  wishlistCount: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: WishlistProduct) => Promise<boolean>;
  addToWishlist: (product: WishlistProduct) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => void;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "alight_wishlist_items";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load from local storage initially
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: WishlistProduct[] = JSON.parse(stored);
        setWishlistProducts(parsed);
        setWishlistIds(new Set(parsed.map((p) => p.id)));
      }
    } catch (err) {
      console.warn("Failed to load wishlist from localStorage", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to local storage whenever list changes
  const persistLocally = (items: WishlistProduct[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to save wishlist to localStorage", err);
    }
  };

  // Sync with backend if user is authenticated
  const syncWithBackend = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getWishlistApi(token);
      if (res.success && res.data && Array.isArray(res.data.items)) {
        const backendItems: WishlistProduct[] = res.data.items.map((item: any) => {
          const p = item.product || item;
          return {
            id: p.id,
            title: p.title || "Product",
            slug: p.slug,
            primaryImageUrl: p.primaryImageUrl || (p.images && p.images[0]?.imageUrl),
            basePrice: p.basePrice,
            discountPrice: p.discountPrice,
            categoryName: p.category?.name || p.categoryName,
            brandName: p.brand?.name || p.brandName,
            vendorStoreName: p.vendor?.storeName || p.vendorStoreName,
          };
        });

        // Merge local guest items if any existed before login
        setWishlistProducts((prev) => {
          const idMap = new Map<string, WishlistProduct>();
          backendItems.forEach((item) => idMap.set(item.id, item));
          prev.forEach((item) => {
            if (!idMap.has(item.id)) {
              idMap.set(item.id, item);
              // Push to backend asynchronously
              addWishlistItemApi(item.id, token).catch(() => {});
            }
          });
          const merged = Array.from(idMap.values());
          persistLocally(merged);
          setWishlistIds(new Set(merged.map((m) => m.id)));
          return merged;
        });
      }
    } catch (err) {
      console.warn("Could not sync wishlist with backend", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      syncWithBackend();
    }
  }, [token, syncWithBackend]);

  const isInWishlist = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return wishlistIds.has(productId);
    },
    [wishlistIds]
  );

  const addToWishlist = async (product: WishlistProduct) => {
    if (!product || !product.id) return;

    setWishlistProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      const updated = [product, ...prev];
      persistLocally(updated);
      setWishlistIds(new Set(updated.map((p) => p.id)));
      return updated;
    });

    if (token) {
      try {
        await addWishlistItemApi(product.id, token);
      } catch (err) {
        console.warn("Backend add to wishlist failed", err);
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!productId) return;

    setWishlistProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      persistLocally(updated);
      setWishlistIds(new Set(updated.map((p) => p.id)));
      return updated;
    });

    if (token) {
      try {
        await removeWishlistItemApi(productId, token);
      } catch (err) {
        console.warn("Backend remove from wishlist failed", err);
      }
    }
  };

  const toggleWishlist = async (product: WishlistProduct): Promise<boolean> => {
    if (!product || !product.id) return false;
    const isCurrentlyWishlisted = wishlistIds.has(product.id);

    if (isCurrentlyWishlisted) {
      await removeFromWishlist(product.id);
      return false; // Removed
    } else {
      await addToWishlist(product);
      return true; // Added
    }
  };

  const clearWishlist = () => {
    setWishlistProducts([]);
    setWishlistIds(new Set());
    persistLocally([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        wishlistCount: wishlistProducts.length,
        isLoading,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist: syncWithBackend,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
