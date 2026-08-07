import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

export class ChatMessageItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['user', 'ai'] })
  role: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: false, index: true })
  subjectId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 'New Conversation' })
  title: string;

  @Prop({ type: [String], default: [] })
  fileIds: string[];

  @Prop({ type: Array, default: [] })
  messages: ChatMessageItem[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
