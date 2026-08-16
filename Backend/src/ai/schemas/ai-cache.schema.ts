import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AiCacheDocument = AiCache & Document;

@Schema({ timestamps: true })
export class AiCache {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], required: true })
  fileIdsKey: string[];

  @Prop({ required: true, enum: ['summary', 'chat', 'flashcards', 'quiz'] })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: any;
}

export const AiCacheSchema = SchemaFactory.createForClass(AiCache);
AiCacheSchema.index({ userId: 1, subjectId: 1, type: 1 });
