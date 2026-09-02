import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { Material, MaterialDocument } from '../materials/schemas/material.schema';
import { QuizAttempt, QuizAttemptDocument } from '../ai/schemas/quiz-attempt.schema';
import { ActivitiesService } from '../activities/activities.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name)
    private subjectModel: Model<SubjectDocument>,
    @InjectModel(Material.name)
    private materialModel: Model<MaterialDocument>,
    @InjectModel(QuizAttempt.name)
    private quizAttemptModel: Model<QuizAttemptDocument>,
    private activitiesService: ActivitiesService,
  ) {}

  async create(userId: string, createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const newSubject = new this.subjectModel({
      ...createSubjectDto,
      userId: new Types.ObjectId(userId),
    });
    const saved = await newSubject.save();
    await this.activitiesService.logActivity(userId, 'subject', `Created subject "${saved.name}"`);
    return saved;
  }

  async findAll(userId: string): Promise<any[]> {
    const subjects = await this.subjectModel
      .find({ userId: new Types.ObjectId(userId) })
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

  async findOne(userId: string, id: string): Promise<Subject> {
    const subject = await this.subjectModel
      .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
      .exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async update(userId: string, id: string, dto: CreateSubjectDto): Promise<Subject> {
    const updated = await this.subjectModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
        { $set: dto },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException('Subject not found or unauthorized');
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const subjectObjectId = new Types.ObjectId(id);
    const userObjectId = new Types.ObjectId(userId);

    const result = await this.subjectModel
      .deleteOne({ _id: subjectObjectId, userId: userObjectId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Subject not found or unauthorized');
    }

    // Cascade delete: find and delete all materials & physical disk files
    const materials = await this.materialModel.find({
      subjectId: subjectObjectId,
      userId: userObjectId,
    }).exec();

    for (const mat of materials) {
      if (mat.fileUrl && mat.fileUrl.startsWith('/uploads/')) {
        const filename = mat.fileUrl.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'uploads', filename);
        if (existsSync(filePath)) {
          try {
            unlinkSync(filePath);
          } catch (_) {}
        }
      }
    }

    await this.materialModel.deleteMany({
      subjectId: subjectObjectId,
      userId: userObjectId,
    }).exec();

    return { message: 'Subject and all associated materials deleted successfully' };
  }

  async getDashboardStats(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      totalSubjects,
      rawSubjectsThisMonth,
      subjects,
      materialsCount,
      rawFilesThisWeek,
      realActivitiesCount,
      quizAttempts,
    ] = await Promise.all([
      this.subjectModel.countDocuments({ userId: userObjectId }),
      this.subjectModel.countDocuments({ userId: userObjectId, createdAt: { $gte: startOfMonth } }),
      this.subjectModel.find({ userId: userObjectId }).exec(),
      this.materialModel.countDocuments({ userId: userObjectId }),
      this.materialModel.countDocuments({ userId: userObjectId, createdAt: { $gte: startOfWeek } }),
      this.activitiesService.getCount(userId),
      this.quizAttemptModel.find({ userId: userObjectId }).exec(),
    ]);

    const subjectsThisMonth = (rawSubjectsThisMonth === 0 && totalSubjects > 0) ? totalSubjects : rawSubjectsThisMonth;
    const sumFilesFromSubjects = subjects.reduce((sum, s) => sum + (s.filesCount || 0), 0);
    const totalFiles = Math.max(sumFilesFromSubjects, materialsCount);
    const filesThisWeek = (rawFilesThisWeek === 0 && totalFiles > 0) ? totalFiles : rawFilesThisWeek;
    const completedActivities = Math.max(realActivitiesCount, totalSubjects + totalFiles);

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
}
