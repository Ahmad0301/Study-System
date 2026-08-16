import { Request } from 'express';
import { MaterialsService } from './materials.service';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    uploadFile(req: Request, subjectId: string, name: string, file: any): Promise<import("./schemas/material.schema").Material>;
    findBySubject(req: Request, subjectId: string): Promise<import("./schemas/material.schema").Material[]>;
    remove(req: Request, id: string): Promise<{
        message: string;
    }>;
}
