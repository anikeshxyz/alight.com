"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AuthResponse } from "@/types/auth";
import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  LoginPayload,
  RegisterPayload,
} from "@/services/auth-service";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  roles: string[];
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isCustomer: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "alight_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "alight_refresh_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken =
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      localStorage.getItem("alight_token") ||
      localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      getMeApi(savedToken)
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            setRoles(res.data.roles || []);
          }
        })
        .catch(() => {
          // Token invalid or expired
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem("alight_token");
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          localStorage.removeItem("alight_user");
          setToken(null);
          setUser(null);
          setRoles([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await loginApi(payload);
    if (res.success && res.data) {
      const authData = res.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, authData.accessToken);
      localStorage.setItem("alight_token", authData.accessToken);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, authData.refreshToken);
      localStorage.setItem("alight_user", JSON.stringify(authData.user));
      setToken(authData.accessToken);
      setUser(authData.user);
      setRoles(authData.roles || []);
      return authData;
    }
    throw new Error(res.message || "Login failed");
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await registerApi(payload);
    if (res.success && res.data) {
      const authData = res.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, authData.accessToken);
      localStorage.setItem("alight_token", authData.accessToken);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, authData.refreshToken);
      localStorage.setItem("alight_user", JSON.stringify(authData.user));
      setToken(authData.accessToken);
      setUser(authData.user);
      setRoles(authData.roles || []);
      return authData;
    }
    throw new Error(res.message || "Registration failed");
  };

  const logout = async (): Promise<void> => {
    if (token) {
      try {
        await logoutApi(token);
      } catch (err) {
        // Silently clear state even if network logout fails
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("alight_token");
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem("alight_user");
    setToken(null);
    setUser(null);
    setRoles([]);
  };

  const refreshProfile = async (): Promise<void> => {
    if (token) {
      const res = await getMeApi(token);
      if (res.success && res.data) {
        setUser(res.data);
        setRoles(res.data.roles || []);
      }
    }
  };

  const isCustomer = roles.includes("ROLE_CUSTOMER");
  const isVendor = roles.includes("ROLE_VENDOR");
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN");
  const isSuperAdmin = roles.includes("ROLE_SUPER_ADMIN");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        isCustomer,
        isVendor,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
