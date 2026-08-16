import { Document, Schema as MongooseSchema } from 'mongoose';
export type ActivityDocument = Activity & Document;
export declare class Activity {
    userId: MongooseSchema.Types.ObjectId;
    type: string;
    title: string;
    timestamp: string;
    durationMinutes: number;
}
export declare const ActivitySchema: MongooseSchema<Activity, import("mongoose").Model<Activity, any, any, any, Document<unknown, any, Activity, any, {}> & Activity & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Activity, Document<unknown, {}, import("mongoose").FlatRecord<Activity>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Activity> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
