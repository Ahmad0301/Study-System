// Centralized, resilient HTTP API client with automatic token attachment & 401 refresh retry

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
}

export function setTokens({ accessToken, refreshToken }: { accessToken?: string; refreshToken?: string }) {
  if (typeof window === "undefined") return;
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("studyai_user");
}

let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    if (data.accessToken) {
      setTokens(data);
      return data.accessToken;
    }
  } catch (_) {
    clearTokens();
  }

  return null;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Auto-set JSON content-type if body is stringified JSON and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(`${API_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized with token refresh & retry
  if (res.status === 401 && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = performTokenRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      return apiClient<T>(endpoint, options, true);
    }
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {
    // Empty or non-JSON body
  }

  if (!res.ok) {
    const message =
      (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
      res.statusText ||
      "API request failed";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
