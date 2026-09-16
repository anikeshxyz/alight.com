import { ApiResponse, ApiErrorResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export class ApiError extends Error {
  public code: string;
  public status: number;
  public traceId?: string;
  public validationErrors?: Record<string, string>;

  constructor(errorResponse: Partial<ApiErrorResponse>, status: number) {
    super(errorResponse.message || "An unexpected error occurred");
    this.name = "ApiError";
    this.code = errorResponse.code || "INTERNAL_SERVER_ERROR";
    this.status = status;
    this.traceId = errorResponse.traceId;
    this.validationErrors = errorResponse.validationErrors;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  token?: string;
  timeoutMs?: number;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, token, headers, timeoutMs = 15000, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Automatic token fallback on client
  let authToken = token;
  if (!authToken && typeof window !== "undefined") {
    authToken =
      localStorage.getItem("alight_token") ||
      localStorage.getItem("alight_access_token") ||
      localStorage.getItem("token") ||
      undefined;
  }

  // Generate trace ID for correlation
  const clientTraceId = `req_${Math.random().toString(36).substring(2, 10)}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Request-ID": clientTraceId,
  };

  if (authToken) {
    defaultHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  // Setup abort controller for timeout resilience
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    method: "GET",
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const correlationId = response.headers.get("X-Request-ID") || clientTraceId;

    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      // Handle expired session / token revocation
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("alight_token");
        localStorage.removeItem("alight_user");
        window.dispatchEvent(
          new CustomEvent("alight:unauthorized", {
            detail: { endpoint, traceId: correlationId },
          })
        );
      }

      throw new ApiError(
        {
          ...data,
          traceId: data?.traceId || correlationId,
        },
        response.status
      );
    }

    if (data && typeof data === "object" && !data.traceId) {
      data.traceId = correlationId;
    }

    return data as ApiResponse<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new ApiError(
        {
          message: "Request timed out. Please check your network connection and retry.",
          code: "REQUEST_TIMEOUT",
          traceId: clientTraceId,
        },
        408
      );
    }

    throw new ApiError(
      {
        message:
          error instanceof Error
            ? error.message
            : "Network error or backend unreachable",
        code: "NETWORK_ERROR",
        traceId: clientTraceId,
      },
      0
    );
  }
}

// Typed convenience helpers
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
