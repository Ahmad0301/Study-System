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

  async logActivity(userId: string, type: string, title: string): Promise<Activity> {
    const timeString = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newActivity = new this.activityModel({
      userId: new Types.ObjectId(userId),
      type,
      title,
      timestamp: timeString,
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
}
