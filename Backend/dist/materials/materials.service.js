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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const path_1 = require("path");
const fs_1 = require("fs");
const material_schema_1 = require("./schemas/material.schema");
const subject_schema_1 = require("../subjects/schemas/subject.schema");
const activities_service_1 = require("../activities/activities.service");
let MaterialsService = class MaterialsService {
    constructor(materialModel, subjectModel, activitiesService) {
        this.materialModel = materialModel;
        this.subjectModel = subjectModel;
        this.activitiesService = activitiesService;
    }
    async create(userId, subjectId, name, file) {
        const sizeInMb = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB';
        const ext = file?.originalname?.split('.').pop()?.toLowerCase() || 'pdf';
        const targetName = name || file?.originalname || 'Uploaded_Document.pdf';
        const existing = await this.materialModel.findOne({
            subjectId: new mongoose_2.Types.ObjectId(subjectId),
            userId: new mongoose_2.Types.ObjectId(userId),
            name: targetName,
        });
        if (existing) {
            if (existing.fileUrl && existing.fileUrl.startsWith('/uploads/')) {
                const filename = existing.fileUrl.replace('/uploads/', '');
                const filePath = (0, path_1.join)(process.cwd(), 'uploads', filename);
                if ((0, fs_1.existsSync)(filePath)) {
                    try {
                        (0, fs_1.unlinkSync)(filePath);
                    }
                    catch (_) { }
                }
            }
            await this.materialModel.deleteOne({ _id: existing._id });
        }
        const newMaterial = new this.materialModel({
            name: targetName,
            size: sizeInMb,
            type: ext,
            fileUrl: file?.filename ? `/uploads/${file.filename}` : '/uploads/default.pdf',
            subjectId: new mongoose_2.Types.ObjectId(subjectId),
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        const saved = await newMaterial.save();
        const subject = await this.subjectModel.findById(subjectId);
        const newCount = (subject?.filesCount || 0) + 1;
        const newProgress = Math.min(100, newCount * 25);
        await this.subjectModel.updateOne({ _id: new mongoose_2.Types.ObjectId(subjectId) }, { $set: { filesCount: newCount, progress: newProgress } });
        await this.activitiesService.logActivity(userId, 'upload', `Uploaded "${saved.name}"`);
        return saved;
    }
    async findBySubject(userId, subjectId) {
        return this.materialModel
            .find({
            subjectId: new mongoose_2.Types.ObjectId(subjectId),
            userId: new mongoose_2.Types.ObjectId(userId),
        })
            .sort({ createdAt: -1 })
            .exec();
    }
    async remove(userId, id) {
        const material = await this.materialModel.findOne({
            _id: new mongoose_2.Types.ObjectId(id),
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        if (!material) {
            throw new common_1.NotFoundException('Material not found');
        }
        if (material.fileUrl && material.fileUrl.startsWith('/uploads/')) {
            const filename = material.fileUrl.replace('/uploads/', '');
            const filePath = (0, path_1.join)(process.cwd(), 'uploads', filename);
            if ((0, fs_1.existsSync)(filePath)) {
                try {
                    (0, fs_1.unlinkSync)(filePath);
                }
                catch (_) { }
            }
        }
        await this.materialModel.deleteOne({ _id: new mongoose_2.Types.ObjectId(id) });
        const subject = await this.subjectModel.findById(material.subjectId);
        const newCount = Math.max(0, (subject?.filesCount || 1) - 1);
        const newProgress = Math.min(100, newCount * 25);
        await this.subjectModel.updateOne({ _id: material.subjectId }, { $set: { filesCount: newCount, progress: newProgress } });
        return { message: 'Material deleted successfully' };
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(material_schema_1.Material.name)),
    __param(1, (0, mongoose_1.InjectModel)(subject_schema_1.Subject.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        activities_service_1.ActivitiesService])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map