import { Request } from 'express';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
export declare class SubjectsController {
    private readonly subjectsService;
    constructor(subjectsService: SubjectsService);
    create(req: Request, dto: CreateSubjectDto): Promise<import("./schemas/subject.schema").Subject>;
    findAll(req: Request): Promise<any[]>;
    getStats(req: Request): Promise<{
        totalSubjects: number;
        subjectsThisMonth: number;
        uploadedFiles: number;
        filesThisWeek: number;
        avgQuizScore: number;
        completedActivities: number;
    }>;
    findOne(req: Request, id: string): Promise<import("./schemas/subject.schema").Subject>;
    update(req: Request, id: string, dto: CreateSubjectDto): Promise<import("./schemas/subject.schema").Subject>;
    remove(req: Request, id: string): Promise<{
        message: string;
    }>;
}
