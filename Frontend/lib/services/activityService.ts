const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface WeeklyStudyData {
  days: Array<{ day: string; hours: number; date: string }>;
  totalHours: number;
}

export const activityService = {
  async getRecent(limit = 5) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const res = await fetch(`${API_URL}/activities/recent?limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error("Failed to fetch recent activities");
    }
    return res.json();
  },

  async getWeeklyStats(): Promise<WeeklyStudyData> {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const res = await fetch(`${API_URL}/activities/weekly-stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error("Failed to fetch weekly study stats");
    }
    return res.json();
  },
};
