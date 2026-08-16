import { MaterialDocument } from '../../materials/schemas/material.schema';
export declare class TextExtractorService {
    private readonly logger;
    private extractionCache;
    extractTextFromMaterials(materials: MaterialDocument[]): Promise<string>;
    clearCacheForFile(filePath: string): void;
    private chunkText;
}
