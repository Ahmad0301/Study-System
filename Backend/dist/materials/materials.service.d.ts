import { Model } from 'mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import { SubjectDocument } from '../subjects/schemas/subject.schema';
import { ActivitiesService } from '../activities/activities.service';
export declare class MaterialsService {
    private materialModel;
    private subjectModel;
    private activitiesService;
    constructor(materialModel: Model<MaterialDocument>, subjectModel: Model<SubjectDocument>, activitiesService: ActivitiesService);
    create(userId: string, subjectId: string, name: string, file: any): Promise<Material>;
    findBySubject(userId: string, subjectId: string): Promise<Material[]>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
}
