import { apiClient } from "./api-client";
import { AuthResponse, UserProfile } from "@/types/auth";
import { ApiResponse } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  accountType?: "CUSTOMER" | "VENDOR";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export async function registerApi(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshTokenApi(payload: RefreshTokenPayload): Promise<ApiResponse<AuthResponse>> {
  return apiClient<AuthResponse>("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutApi(token: string): Promise<ApiResponse<void>> {
  return apiClient<void>("/auth/logout", {
    method: "POST",
    token,
  });
}

export async function getMeApi(token: string): Promise<ApiResponse<UserProfile>> {
  return apiClient<UserProfile>("/auth/me", {
    token,
  });
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("alight_token") || localStorage.getItem("token");
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const user = localStorage.getItem("alight_user") || localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

