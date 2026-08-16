import { Document, Schema as MongooseSchema } from 'mongoose';
export type ChatSessionDocument = ChatSession & Document;
export declare class ChatMessageItem {
    id: string;
    role: string;
    text: string;
    timestamp: string;
}
export declare class ChatSession {
    userId: MongooseSchema.Types.ObjectId;
    subjectId?: MongooseSchema.Types.ObjectId;
    title: string;
    fileIds: string[];
    messages: ChatMessageItem[];
}
export declare const ChatSessionSchema: MongooseSchema<ChatSession, import("mongoose").Model<ChatSession, any, any, any, Document<unknown, any, ChatSession, any, {}> & ChatSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatSession, Document<unknown, {}, import("mongoose").FlatRecord<ChatSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatSession> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
