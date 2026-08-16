import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Material, MaterialDocument } from './schemas/material.schema';
import { Subject, SubjectDocument } from '../subjects/schemas/subject.schema';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name)
    private materialModel: Model<MaterialDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<SubjectDocument>,
    private activitiesService: ActivitiesService,
  ) {}

  async create(
    userId: string,
    subjectId: string,
    name: string,
    file: any,
  ): Promise<Material> {
    const sizeInMb = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB';
    const ext = file?.originalname?.split('.').pop()?.toLowerCase() || 'pdf';

    const targetName = name || file?.originalname || 'Uploaded_Document.pdf';

    // Delete existing material with the same name if present
    const existing = await this.materialModel.findOne({
      subjectId: new Types.ObjectId(subjectId),
      userId: new Types.ObjectId(userId),
      name: targetName,
    });

    if (existing) {
      if (existing.fileUrl && existing.fileUrl.startsWith('/uploads/')) {
        const filename = existing.fileUrl.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'uploads', filename);
        if (existsSync(filePath)) {
          try {
            unlinkSync(filePath);
          } catch (_) {}
        }
      }
      await this.materialModel.deleteOne({ _id: existing._id });
    }

    const newMaterial = new this.materialModel({
      name: targetName,
      size: sizeInMb,
      type: ext,
      fileUrl: file?.filename ? `/uploads/${file.filename}` : '/uploads/default.pdf',
      subjectId: new Types.ObjectId(subjectId),
      userId: new Types.ObjectId(userId),
    });

    const saved = await newMaterial.save();

    // Recalculate filesCount and progress in Subject (25% per file, up to 100%)
    const subject = await this.subjectModel.findById(subjectId);
    const newCount = (subject?.filesCount || 0) + 1;
    const newProgress = Math.min(100, newCount * 25);

    await this.subjectModel.updateOne(
      { _id: new Types.ObjectId(subjectId) },
      { $set: { filesCount: newCount, progress: newProgress } },
    );

    // Log upload activity
    await this.activitiesService.logActivity(userId, 'upload', `Uploaded "${saved.name}"`);

    return saved;
  }

  async findBySubject(userId: string, subjectId: string): Promise<Material[]> {
    return this.materialModel
      .find({
        subjectId: new Types.ObjectId(subjectId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const material = await this.materialModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Delete physical file from disk if it exists
    if (material.fileUrl && material.fileUrl.startsWith('/uploads/')) {
      const filename = material.fileUrl.replace('/uploads/', '');
      const filePath = join(process.cwd(), 'uploads', filename);
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
        } catch (_) {}
      }
    }

    await this.materialModel.deleteOne({ _id: new Types.ObjectId(id) });

    // Recalculate filesCount and progress in Subject
    const subject = await this.subjectModel.findById(material.subjectId);
    const newCount = Math.max(0, (subject?.filesCount || 1) - 1);
    const newProgress = Math.min(100, newCount * 25);

    await this.subjectModel.updateOne(
      { _id: material.subjectId },
      { $set: { filesCount: newCount, progress: newProgress } },
    );

    return { message: 'Material deleted successfully' };
  }
}
