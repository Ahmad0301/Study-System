import { Request } from 'express';
import { ActivitiesService } from './activities.service';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    getRecent(req: Request, limit?: string): Promise<import("./schemas/activity.schema").Activity[]>;
    getWeeklyStats(req: Request): Promise<{
        days: Array<{
            day: string;
            hours: number;
            date: string;
        }>;
        totalHours: number;
    }>;
}
