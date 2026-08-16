import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GeneralChatSessionDocument = GeneralChatSession & Document;

export class GeneralChatMessageItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['user', 'ai', 'assistant'] })
  role: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({ timestamps: true })
export class GeneralChatSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 'StudyAI Assistant Chat' })
  title: string;

  @Prop({ type: Array, default: [] })
  messages: GeneralChatMessageItem[];
}

export const GeneralChatSessionSchema = SchemaFactory.createForClass(GeneralChatSession);
