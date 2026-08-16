import { Document, Schema as MongooseSchema } from 'mongoose';
export type AiCacheDocument = AiCache & Document;
export declare class AiCache {
    userId: MongooseSchema.Types.ObjectId;
    subjectId: MongooseSchema.Types.ObjectId;
    fileIdsKey: string[];
    type: string;
    data: any;
}
export declare const AiCacheSchema: MongooseSchema<AiCache, import("mongoose").Model<AiCache, any, any, any, Document<unknown, any, AiCache, any, {}> & AiCache & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AiCache, Document<unknown, {}, import("mongoose").FlatRecord<AiCache>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AiCache> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
