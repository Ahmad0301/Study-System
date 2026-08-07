import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 'upload' })
  type: string; // 'upload' | 'subject' | 'quiz' | 'flashcard' | 'summary' | 'security'

  @Prop({ required: true })
  title: string;

  @Prop({ required: false, default: '' })
  timestamp: string;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
