import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type QuizAttemptDocument = QuizAttempt & Document;

@Schema({ timestamps: true })
export class QuizAttempt {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  correctCount: number;

  @Prop({ required: true })
  totalQuestions: number;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
