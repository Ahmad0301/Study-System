import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // adds createdAt & updatedAt automatically
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string; // stored as bcrypt hash, never plain text

  @Prop({ type: String, default: null })
  resetPasswordToken!: string | null; // hashed reset token

  @Prop({ type: Date, default: null })
  resetPasswordExpires!: Date | null; // expiry for the reset token

  @Prop({ type: String, default: null })
  refreshToken!: string | null; // hashed refresh token (for logout/rotation support)

  @Prop({ type: Boolean, default: false })
  emailVerified!: boolean;

  @Prop({ type: String, default: null })
  verificationToken!: string | null;

  @Prop({ type: Date, default: null })
  verificationTokenExpires!: Date | null;

  @Prop({ type: String, default: null })
  profilePicture!: string | null; // relative path to avatar image (e.g. avatars/avatar-123.jpg)
}

export const UserSchema = SchemaFactory.createForClass(User);
