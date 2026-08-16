import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MaterialDocument = Material & Document;

@Schema({ timestamps: true })
export class Material {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true, default: 'pdf' })
  type: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: true })
  subjectId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
