// FIXED: subjectService in TypeScript with explicit interfaces and error handling
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface SubjectItem {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  color?: string;
  filesCount?: number;
  progress?: number;
  materials?: MaterialItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialItem {
  id: string;
  _id?: string;
  name: string;
  size?: string;
  type?: string;
  fileUrl?: string;
  subjectId?: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalSubjects: number;
  subjectsThisMonth: number;
  uploadedFiles: number;
  filesThisWeek: number;
  avgQuizScore: number;
  completedActivities: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  type: string;
  time: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    }
  } catch (_) { }

  return null;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {
    // Empty body
  }

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(endpoint, options, true);
    }
  }

  if (!res.ok) {
    const message = (Array.isArray(data?.message) ? data.message[0] : data?.message) || "API request failed";
    throw new Error(message);
  }

  return data as T;
}

const subjectCache = new Map<string, SubjectItem>();

export const subjectService = {
  clearCache(id?: string) {
    if (id) subjectCache.delete(id);
    else subjectCache.clear();
  },

  getCachedById(id: string): SubjectItem | null {
    return subjectCache.get(id) || null;
  },

  async getAll(): Promise<SubjectItem[]> {
    try {
      const data = await apiFetch<any[]>("/subjects");
      if (Array.isArray(data)) {
        return data.map((s) => ({
          ...s,
          id: s._id || s.id,
          filesCount: s.filesCount || 0,
          progress: s.progress || 0,
        }));
      }
      return [];
    } catch (e: any) {
      console.error("Error fetching subjects:", e?.message || e);
      return [];
    }
  },

  async getById(id: string, useCache = true): Promise<SubjectItem | null> {
    if (useCache && subjectCache.has(id)) {
      const cached = subjectCache.get(id)!;
      apiFetch<any>(`/subjects/${id}`)
        .then(async (subject) => {
          const materials = await apiFetch<any[]>(`/materials/subject/${id}`);
          const updatedItem: SubjectItem = {
            ...subject,
            id: subject._id || subject.id,
            materials: Array.isArray(materials)
              ? materials.map((m) => ({ ...m, id: m._id || m.id }))
              : [],
          };
          subjectCache.set(id, updatedItem);
        })
        .catch(() => {});
      return cached;
    }

    try {
      const subject = await apiFetch<any>(`/subjects/${id}`);
      const materials = await apiFetch<any[]>(`/materials/subject/${id}`);
      const item: SubjectItem = {
        ...subject,
        id: subject._id || subject.id,
        materials: Array.isArray(materials)
          ? materials.map((m) => ({ ...m, id: m._id || m.id }))
          : [],
      };
      subjectCache.set(id, item);
      return item;
    } catch (e: any) {
      console.error("Error fetching subject details:", e?.message || e);
      return null;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const stats = await apiFetch<any>("/subjects/dashboard/stats");
      return {
        totalSubjects: stats.totalSubjects || 0,
        subjectsThisMonth: stats.subjectsThisMonth || 0,
        uploadedFiles: stats.uploadedFiles || 0,
        filesThisWeek: stats.filesThisWeek || 0,
        avgQuizScore: typeof stats?.avgQuizScore === "number" ? stats.avgQuizScore : 0,
        completedActivities: stats.completedActivities || 0,
      };
    } catch (e: any) {
      console.error("Error fetching dashboard stats:", e?.message || e);
      return {
        totalSubjects: 0,
        subjectsThisMonth: 0,
        uploadedFiles: 0,
        filesThisWeek: 0,
        avgQuizScore: 0,
        completedActivities: 0,
      };
    }
  },

  async getRecentActivities(): Promise<ActivityItem[]> {
    try {
      const data = await apiFetch<any[]>("/activities/recent?limit=5");
      if (Array.isArray(data)) {
        return data.map((a) => ({
          id: a._id || a.id,
          title: a.title,
          type: a.type || "upload",
          time: a.timestamp || "Just now",
        }));
      }
      return [];
    } catch (e: any) {
      console.error("Error fetching recent activities:", e?.message || e);
      return [];
    }
  },

  async create(data: { name: string; description?: string; color?: string;[key: string]: any }): Promise<SubjectItem> {
    const res = await apiFetch<any>("/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        description: data.description || "",
        color: data.color || "#2563EB",
      }),
    });
    return {
      ...res,
      id: res._id || res.id,
    };
  },

  async update(id: string, data: { name: string; description?: string; color?: string;[key: string]: any }): Promise<SubjectItem> {
    const res = await apiFetch<any>(`/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        description: data.description || "",
        color: data.color || "#2563EB",
      }),
    });
    return {
      ...res,
      id: res._id || res.id,
    };
  },

  async delete(id: string): Promise<boolean> {
    await apiFetch(`/subjects/${id}`, { method: "DELETE" });
    return true;
  },

  async uploadFile(subjectId: string, file: File, onProgress?: (percent: number) => void): Promise<MaterialItem> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", subjectId);
      formData.append("name", file.name);

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${API_URL}/materials/upload`);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ...data, id: data._id || data.id });
          } catch (err) {
            reject(new Error("Failed to parse response"));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.message || "Upload failed"));
          } catch (_) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during file upload"));
      };

      xhr.send(formData);
    });
  },

  async deleteFile(subjectId: string, fileId: string): Promise<boolean> {
    await apiFetch(`/materials/${fileId}`, { method: "DELETE" });
    return true;
  },
};
