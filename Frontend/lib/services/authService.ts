// FIXED: authService in TypeScript with explicit interfaces and error handling
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string | null;
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  profilePicture?: string | null;
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch (_) {
    // no JSON body
  }

  if (!res.ok) {
    const message =
      (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

function mapUser(backendUser: BackendUser): UserResponse {
  return {
    id: backendUser.id,
    email: backendUser.email,
    fullName: backendUser.name,
    profilePicture: backendUser.profilePicture || null,
  };
}

function storeTokens({ accessToken, refreshToken }: { accessToken?: string; refreshToken?: string }) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export const authService = {
  async login({ email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }) {
    const data = await apiRequest<{ user: BackendUser; accessToken: string; refreshToken?: string }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeTokens(data);
    return { user: mapUser(data.user), token: data.accessToken };
  },

  async signup({ fullName, email, password }: Record<string, string>) {
    const data = await apiRequest<{ message: string; user?: BackendUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name: fullName, email, password }),
    });
    return { message: data.message, user: data.user ? mapUser(data.user) : null };
  },

  async verifyEmail(token: string) {
    const data = await apiRequest<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return { message: data.message };
  },

  async resendVerification(email: string) {
    const data = await apiRequest<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { message: data.message };
  },

  async forgotPassword({ email }: { email: string }) {
    const data = await apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { message: data.message };
  },

  async resetPassword({ token, password }: Record<string, string>) {
    const data = await apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword: password }),
    });
    return { message: data.message };
  },

  async logout() {
    const accessToken = localStorage.getItem("accessToken");
    try {
      if (accessToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (_) {
      // even if server call fails, clear local tokens
    } finally {
      clearTokens();
    }
    return true;
  },

  async updateProfile({ name, email }: { name: string; email: string }) {
    const accessToken = localStorage.getItem("accessToken");
    const data = await apiRequest<{ message: string; user?: BackendUser }>("/auth/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name, email }),
    });
    return { message: data.message, user: data.user ? mapUser(data.user) : null };
  },

  async changePassword({ currentPassword, newPassword }: Record<string, string>) {
    const accessToken = localStorage.getItem("accessToken");
    const data = await apiRequest<{ message: string }>("/auth/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { message: data.message };
  },

  async uploadProfilePicture(file: File) {
    const accessToken = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/auth/profile-picture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    let data: any = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const message = (Array.isArray(data?.message) ? data.message[0] : data?.message) || "Upload failed.";
      throw new Error(message);
    }
    return { message: data.message, user: data.user ? mapUser(data.user) : null, profilePicture: data.profilePicture };
  },

  async removeProfilePicture() {
    const accessToken = localStorage.getItem("accessToken");
    const data = await apiRequest<{ message: string; user?: BackendUser }>("/auth/profile-picture", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { message: data.message, user: data.user ? mapUser(data.user) : null };
  },
};
