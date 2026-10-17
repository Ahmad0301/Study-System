import { api, apiClient, setTokens, clearTokens } from "@/lib/apiClient";

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

function mapUser(backendUser: BackendUser): UserResponse {
  return {
    id: backendUser.id,
    email: backendUser.email,
    fullName: backendUser.name,
    profilePicture: backendUser.profilePicture || null,
  };
}

export const authService = {
  async login({ email, password }: { email: string; password: string; rememberMe?: boolean }) {
    const data = await api.post<{ user: BackendUser; accessToken: string; refreshToken?: string }>("/auth/signin", {
      email,
      password,
    });
    setTokens(data);
    return { user: mapUser(data.user), token: data.accessToken };
  },

  async signup({ fullName, email, password }: Record<string, string>) {
    const data = await api.post<{ message: string; user?: BackendUser }>("/auth/signup", {
      name: fullName,
      email,
      password,
    });
    return { message: data.message, user: data.user ? mapUser(data.user) : null };
  },

  async verifyEmail(token: string) {
    const data = await api.get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return { message: data.message };
  },

  async resendVerification(email: string) {
    const data = await api.post<{ message: string }>("/auth/resend-verification", { email });
    return { message: data.message };
  },

  async forgotPassword({ email }: { email: string }) {
    const data = await api.post<{ message: string }>("/auth/forgot-password", { email });
    return { message: data.message };
  },

  async resetPassword({ token, password }: Record<string, string>) {
    const data = await api.post<{ message: string }>("/auth/reset-password", {
      token,
      newPassword: password,
    });
    return { message: data.message };
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      // Even if server call fails, proceed with local cleanup
    } finally {
      clearTokens();
    }
    return true;
  },

  async updateProfile({ name, email }: { name: string; email: string }) {
    const data = await api.put<{ message: string; user?: BackendUser }>("/auth/profile", {
      name,
      email,
    });
    return { message: data.message, user: data.user ? mapUser(data.user) : null };
  },

  async changePassword({ currentPassword, newPassword }: Record<string, string>) {
    const data = await api.post<{ message: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return { message: data.message };
  },

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const data = await apiClient<{ message: string; user?: BackendUser; profilePicture?: string }>(
      "/auth/profile-picture",
      {
        method: "POST",
        body: formData,
      },
    );
    return {
      message: data.message,
      user: data.user ? mapUser(data.user) : null,
      profilePicture: data.profilePicture,
    };
  },

  async removeProfilePicture() {
    const data = await api.delete<{ message: string; user?: BackendUser }>("/auth/profile-picture");
    return { message: data.message, user: data.user ? mapUser(data.user) : null };
  },
};
