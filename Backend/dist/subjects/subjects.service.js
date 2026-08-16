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
exports.SubjectsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const path_1 = require("path");
const fs_1 = require("fs");
const subject_schema_1 = require("./schemas/subject.schema");
const material_schema_1 = require("../materials/schemas/material.schema");
const quiz_attempt_schema_1 = require("../ai/schemas/quiz-attempt.schema");
const activities_service_1 = require("../activities/activities.service");
let SubjectsService = class SubjectsService {
    constructor(subjectModel, materialModel, quizAttemptModel, activitiesService) {
        this.subjectModel = subjectModel;
        this.materialModel = materialModel;
        this.quizAttemptModel = quizAttemptModel;
        this.activitiesService = activitiesService;
    }
    async create(userId, createSubjectDto) {
        const newSubject = new this.subjectModel({
            ...createSubjectDto,
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        const saved = await newSubject.save();
        await this.activitiesService.logActivity(userId, 'subject', `Created subject "${saved.name}"`);
        return saved;
    }
    async findAll(userId) {
        const subjects = await this.subjectModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
        return subjects.map((s) => {
            const filesCount = s.filesCount || 0;
            const progress = s.progress && s.progress > 0 ? s.progress : Math.min(100, filesCount * 25);
            return {
                ...s.toObject(),
                progress,
            };
        });
    }
    async findOne(userId, id) {
        const subject = await this.subjectModel
            .findOne({ _id: new mongoose_2.Types.ObjectId(id), userId: new mongoose_2.Types.ObjectId(userId) })
            .exec();
        if (!subject) {
            throw new common_1.NotFoundException('Subject not found');
        }
        return subject;
    }
    async update(userId, id, dto) {
        const updated = await this.subjectModel
            .findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(id), userId: new mongoose_2.Types.ObjectId(userId) }, { $set: dto }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Subject not found or unauthorized');
        }
        return updated;
    }
    async remove(userId, id) {
        const subjectObjectId = new mongoose_2.Types.ObjectId(id);
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const result = await this.subjectModel
            .deleteOne({ _id: subjectObjectId, userId: userObjectId })
            .exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Subject not found or unauthorized');
        }
        const materials = await this.materialModel.find({
            subjectId: subjectObjectId,
            userId: userObjectId,
        }).exec();
        for (const mat of materials) {
            if (mat.fileUrl && mat.fileUrl.startsWith('/uploads/')) {
                const filename = mat.fileUrl.replace('/uploads/', '');
                const filePath = (0, path_1.join)(process.cwd(), 'uploads', filename);
                if ((0, fs_1.existsSync)(filePath)) {
                    try {
                        (0, fs_1.unlinkSync)(filePath);
                    }
                    catch (_) { }
                }
            }
        }
        await this.materialModel.deleteMany({
            subjectId: subjectObjectId,
            userId: userObjectId,
        }).exec();
        return { message: 'Subject and all associated materials deleted successfully' };
    }
    async getDashboardStats(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const totalSubjects = await this.subjectModel.countDocuments({ userId: userObjectId });
        let subjectsThisMonth = await this.subjectModel.countDocuments({
            userId: userObjectId,
            createdAt: { $gte: startOfMonth },
        });
        if (subjectsThisMonth === 0 && totalSubjects > 0) {
            subjectsThisMonth = totalSubjects;
        }
        const subjects = await this.subjectModel.find({ userId: userObjectId }).exec();
        const sumFilesFromSubjects = subjects.reduce((sum, s) => sum + (s.filesCount || 0), 0);
        const materialsCount = await this.materialModel.countDocuments({ userId: userObjectId });
        const totalFiles = Math.max(sumFilesFromSubjects, materialsCount);
        let filesThisWeek = await this.materialModel.countDocuments({
            userId: userObjectId,
            createdAt: { $gte: startOfWeek },
        });
        if (filesThisWeek === 0 && totalFiles > 0) {
            filesThisWeek = totalFiles;
        }
        const realActivitiesCount = await this.activitiesService.getCount(userId);
        const completedActivities = Math.max(realActivitiesCount, totalSubjects + totalFiles);
        const quizAttempts = await this.quizAttemptModel.find({ userId: userObjectId }).exec();
        let avgQuizScore = 0;
        if (quizAttempts && quizAttempts.length > 0) {
            const sum = quizAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
            avgQuizScore = Math.round(sum / quizAttempts.length);
        }
        return {
            totalSubjects,
            subjectsThisMonth,
            uploadedFiles: totalFiles,
            filesThisWeek,
            avgQuizScore,
            completedActivities,
        };
    }
};
exports.SubjectsService = SubjectsService;
exports.SubjectsService = SubjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subject_schema_1.Subject.name)),
    __param(1, (0, mongoose_1.InjectModel)(material_schema_1.Material.name)),
    __param(2, (0, mongoose_1.InjectModel)(quiz_attempt_schema_1.QuizAttempt.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        activities_service_1.ActivitiesService])
], SubjectsService);
//# sourceMappingURL=subjects.service.js.map