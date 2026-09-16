"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CartResponse } from "@/types/cart";
import {
  getCartApi,
  addToCartApi,
  updateCartItemQuantityApi,
  removeCartItemApi,
  clearCartApi,
  mergeGuestCartApi,
} from "@/services/cart-service";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: CartResponse | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_SESSION_KEY = "alight_guest_session_id";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [guestSessionId, setGuestSessionId] = useState<string>("");

  useEffect(() => {
    let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (!sessionId) {
      sessionId = "guest_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(GUEST_SESSION_KEY, sessionId);
    }
    setGuestSessionId(sessionId);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!guestSessionId && !token) return;
    setIsLoading(true);
    try {
      const res = await getCartApi(token ? undefined : guestSessionId, token || undefined);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, [guestSessionId, token]);

  // Merge guest cart if user just logged in
  useEffect(() => {
    if (token && user && guestSessionId) {
      mergeGuestCartApi(guestSessionId, token)
        .then((res) => {
          if (res.success && res.data) {
            setCart(res.data);
          }
        })
        .catch(() => {
          refreshCart();
        });
    } else {
      refreshCart();
    }
  }, [token, user, guestSessionId, refreshCart]);

  const addToCart = async (variantId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const res = await addToCartApi(
        {
          variantId,
          quantity,
          guestSessionId: token ? undefined : guestSessionId,
        },
        token || undefined
      );
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const res = await updateCartItemQuantityApi(
        cartItemId,
        quantity,
        token ? undefined : guestSessionId,
        token || undefined
      );
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    setIsLoading(true);
    try {
      const res = await removeCartItemApi(
        cartItemId,
        token ? undefined : guestSessionId,
        token || undefined
      );
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const res = await clearCartApi(
        token ? undefined : guestSessionId,
        token || undefined
      );
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const itemCount = cart?.totalItems || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
