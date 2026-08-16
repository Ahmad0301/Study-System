import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { MaterialDocument } from '../materials/schemas/material.schema';
import { QuizAttemptDocument } from '../ai/schemas/quiz-attempt.schema';
import { ActivitiesService } from '../activities/activities.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
export declare class SubjectsService {
    private subjectModel;
    private materialModel;
    private quizAttemptModel;
    private activitiesService;
    constructor(subjectModel: Model<SubjectDocument>, materialModel: Model<MaterialDocument>, quizAttemptModel: Model<QuizAttemptDocument>, activitiesService: ActivitiesService);
    create(userId: string, createSubjectDto: CreateSubjectDto): Promise<Subject>;
    findAll(userId: string): Promise<any[]>;
    findOne(userId: string, id: string): Promise<Subject>;
    update(userId: string, id: string, dto: CreateSubjectDto): Promise<Subject>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
    getDashboardStats(userId: string): Promise<{
        totalSubjects: number;
        subjectsThisMonth: number;
        uploadedFiles: number;
        filesThisWeek: number;
        avgQuizScore: number;
        completedActivities: number;
    }>;
}
