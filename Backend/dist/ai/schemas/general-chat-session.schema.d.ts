import { Document, Schema as MongooseSchema } from 'mongoose';
export type GeneralChatSessionDocument = GeneralChatSession & Document;
export declare class GeneralChatMessageItem {
    id: string;
    role: string;
    text: string;
    timestamp: string;
}
export declare class GeneralChatSession {
    userId: MongooseSchema.Types.ObjectId;
    title: string;
    messages: GeneralChatMessageItem[];
}
export declare const GeneralChatSessionSchema: MongooseSchema<GeneralChatSession, import("mongoose").Model<GeneralChatSession, any, any, any, Document<unknown, any, GeneralChatSession, any, {}> & GeneralChatSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, GeneralChatSession, Document<unknown, {}, import("mongoose").FlatRecord<GeneralChatSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<GeneralChatSession> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
