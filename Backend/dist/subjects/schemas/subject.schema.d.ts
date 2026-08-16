import { Document, Schema as MongooseSchema } from 'mongoose';
export type SubjectDocument = Subject & Document;
export declare class Subject {
    name: string;
    description: string;
    color: string;
    userId: MongooseSchema.Types.ObjectId;
    filesCount: number;
    progress: number;
}
export declare const SubjectSchema: MongooseSchema<Subject, import("mongoose").Model<Subject, any, any, any, Document<unknown, any, Subject, any, {}> & Subject & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Subject, Document<unknown, {}, import("mongoose").FlatRecord<Subject>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Subject> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
