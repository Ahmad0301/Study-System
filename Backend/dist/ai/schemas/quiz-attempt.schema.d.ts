import { Document, Schema as MongooseSchema } from 'mongoose';
export type QuizAttemptDocument = QuizAttempt & Document;
export declare class QuizAttempt {
    userId: MongooseSchema.Types.ObjectId;
    subjectId: MongooseSchema.Types.ObjectId;
    score: number;
    correctCount: number;
    totalQuestions: number;
}
export declare const QuizAttemptSchema: MongooseSchema<QuizAttempt, import("mongoose").Model<QuizAttempt, any, any, any, Document<unknown, any, QuizAttempt, any, {}> & QuizAttempt & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, QuizAttempt, Document<unknown, {}, import("mongoose").FlatRecord<QuizAttempt>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<QuizAttempt> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
