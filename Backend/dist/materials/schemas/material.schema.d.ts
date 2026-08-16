import { Document, Schema as MongooseSchema } from 'mongoose';
export type MaterialDocument = Material & Document;
export declare class Material {
    name: string;
    size: string;
    type: string;
    fileUrl: string;
    subjectId: MongooseSchema.Types.ObjectId;
    userId: MongooseSchema.Types.ObjectId;
}
export declare const MaterialSchema: MongooseSchema<Material, import("mongoose").Model<Material, any, any, any, Document<unknown, any, Material, any, {}> & Material & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Material, Document<unknown, {}, import("mongoose").FlatRecord<Material>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Material> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
