"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const activity_schema_1 = require("./schemas/activity.schema");
let ActivitiesService = class ActivitiesService {
    constructor(activityModel) {
        this.activityModel = activityModel;
    }
    async logActivity(userId, type, title, durationMinutes = 15) {
        const timeString = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
        const newActivity = new this.activityModel({
            userId: new mongoose_2.Types.ObjectId(userId),
            type,
            title,
            timestamp: timeString,
            durationMinutes,
        });
        return newActivity.save();
    }
    async getRecent(userId, limit = 5) {
        return this.activityModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    async getCount(userId) {
        return this.activityModel.countDocuments({
            userId: new mongoose_2.Types.ObjectId(userId),
        });
    }
    async getWeeklyStudyStats(userId) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - distanceToMonday);
        monday.setHours(0, 0, 0, 0);
        const activities = await this.activityModel
            .find({
            userId: new mongoose_2.Types.ObjectId(userId),
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
            const dayActivities = activities.filter((a) => a.createdAt >= dayStart && a.createdAt <= dayEnd);
            const minutesSum = dayActivities.reduce((acc, curr) => acc + (curr.durationMinutes || 15), 0);
            const hours = parseFloat((minutesSum / 60).toFixed(1));
            return {
                day: dayName,
                hours,
                date: d.toISOString().split('T')[0],
            };
        });
        const totalHours = parseFloat(daysData.reduce((acc, d) => acc + d.hours, 0).toFixed(1));
        return { days: daysData, totalHours };
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(activity_schema_1.Activity.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map