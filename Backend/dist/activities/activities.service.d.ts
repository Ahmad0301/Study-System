import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
export declare class ActivitiesService {
    private activityModel;
    constructor(activityModel: Model<ActivityDocument>);
    logActivity(userId: string, type: string, title: string, durationMinutes?: number): Promise<Activity>;
    getRecent(userId: string, limit?: number): Promise<Activity[]>;
    getCount(userId: string): Promise<number>;
    getWeeklyStudyStats(userId: string): Promise<{
        days: Array<{
            day: string;
            hours: number;
            date: string;
        }>;
        totalHours: number;
    }>;
}
