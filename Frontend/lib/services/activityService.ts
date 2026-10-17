import { api } from "@/lib/apiClient";

export interface WeeklyStudyData {
  days: Array<{ day: string; hours: number; date: string }>;
  totalHours: number;
}

export const activityService = {
  async getRecent(limit = 5) {
    return api.get(`/activities/recent?limit=${limit}`);
  },

  async getWeeklyStats(): Promise<WeeklyStudyData> {
    return api.get<WeeklyStudyData>("/activities/weekly-stats");
  },
};
