import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<ActivityDocument>,
  ) {}

  async logActivity(userId: string, type: string, title: string, durationMinutes = 15): Promise<Activity> {
    const timeString = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newActivity = new this.activityModel({
      userId: new Types.ObjectId(userId),
      type,
      title,
      timestamp: timeString,
      durationMinutes,
    });

    return newActivity.save();
  }

  async getRecent(userId: string, limit = 5): Promise<Activity[]> {
    return this.activityModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getCount(userId: string): Promise<number> {
    return this.activityModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
  }

  async getWeeklyStudyStats(userId: string): Promise<{
    days: Array<{ day: string; hours: number; date: string }>;
    totalHours: number;
  }> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const activities = await this.activityModel
      .find({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: monday },
      })
      .exec();

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysData = dayLabels.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayActivities = activities.filter(
        (a: any) => a.createdAt >= dayStart && a.createdAt <= dayEnd,
      );

      const minutesSum = dayActivities.reduce(
        (acc: number, curr: any) => acc + (curr.durationMinutes || 15),
        0,
      );

      const hours = parseFloat((minutesSum / 60).toFixed(1));

      return {
        day: dayName,
        hours,
        date: d.toISOString().split('T')[0],
      };
    });

    const totalHours = parseFloat(
      daysData.reduce((acc, d) => acc + d.hours, 0).toFixed(1),
    );

    return { days: daysData, totalHours };
  }
}
