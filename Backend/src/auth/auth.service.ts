import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

import { User, UserDocument } from './schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private isSmtpConfigured(): boolean {
    const smtpHost = (this.configService.get<string>('SMTP_HOST') || '').trim();
    const smtpUser = (this.configService.get<string>('SMTP_USER') || '').trim();
    const smtpPass = (this.configService.get<string>('SMTP_PASS') || '').trim();
    return !!(smtpHost && smtpUser && smtpPass);
  }

  private createTransporter() {
    const smtpHost = (this.configService.get<string>('SMTP_HOST') || '').trim();
    const smtpUser = (this.configService.get<string>('SMTP_USER') || '').trim();
    const rawPass = (this.configService.get<string>('SMTP_PASS') || '').trim();
    const smtpPass = rawPass.replace(/\s+/g, ''); // Strip spaces from Gmail App Passwords

    if (!smtpHost || !smtpUser || !smtpPass) {
      return null;
    }

    const isGmail = smtpHost.toLowerCase().includes('gmail');

    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    return nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // ---------- SIGN UP ----------
  async signUp(dto: SignUpDto) {
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      emailVerified: !this.isSmtpConfigured(), // Auto-verify if SMTP is not configured
    });

    // Generate verification token and send email (wrapped in try/catch so email failure never crashes signup)
    if (this.isSmtpConfigured()) {
      try {
        const { token, hashedToken, expires } = await this.generateVerificationToken();
        user.verificationToken = hashedToken;
        user.verificationTokenExpires = expires;
        await user.save();
        await this.sendVerificationEmail(user.email, token);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Email verification error during signup:', err);
      }
    }

    return {
      message: this.isSmtpConfigured()
        ? 'Account created successfully. Please verify your email before signing in.'
        : 'Account created successfully. You can now sign in.',
      user: this.sanitizeUser(user),
    };
  }

  // ---------- SIGN IN ----------
  async signIn(dto: SignInDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Auto-verify account upon successful password verification
    if (!user.emailVerified) {
      user.emailVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      await user.save();
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      message: 'Signed in successfully',
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ---------- REFRESH TOKEN ----------
  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  // ---------- FORGOT PASSWORD ----------
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email });

    const genericResponse = {
      message:
        'If an account with that email exists, a password reset link has been sent',
    };

    if (!user) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresInMin = Number(
      this.configService.get<string>('RESET_TOKEN_EXPIRES_MIN') ?? 15,
    );

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + expiresInMin * 60 * 1000);
    await user.save();

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #2563eb; font-size: 20px; font-weight: 800; margin-bottom: 8px;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to reset the password for your <strong>StudyAI Assistant</strong> account.</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Click the button below to set up a new password (valid for ${expiresInMin} minutes):</p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">If you did not request this password reset, please ignore this email.</p>
      </div>
    `;

    const transporter = this.createTransporter();
    const smtpUser = (this.configService.get<string>('SMTP_USER') || '').trim();

    if (transporter && smtpUser) {
      try {
        await transporter.sendMail({
          from: `"StudyAI Assistant" <${smtpUser}>`,
          to: dto.email,
          subject: 'Password Reset Request — StudyAI Assistant',
          html: emailHtml,
        });
        // eslint-disable-next-line no-console
        console.log(`✅ Password reset email sent via SMTP to ${dto.email}`);
      } catch (emailErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to send SMTP email:', emailErr);
      }
    } else {
      // Send real test email via Ethereal Email Service
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await transporter.sendMail({
          from: '"StudyAI Assistant" <noreply@studyai.com>',
          to: dto.email,
          subject: 'Password Reset Request — StudyAI Assistant',
          html: emailHtml,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        // eslint-disable-next-line no-console
        console.log(`\n==================================================`);
        // eslint-disable-next-line no-console
        console.log(`📧 REAL SENT TEST EMAIL FOR [${dto.email}]:`);
        // eslint-disable-next-line no-console
        console.log(`📩 View Sent Email Inbox: ${previewUrl}`);
        // eslint-disable-next-line no-console
        console.log(`🔗 Reset Link: ${resetUrl}`);
        // eslint-disable-next-line no-console
        console.log(`==================================================\n`);
      } catch (_) {
        // eslint-disable-next-line no-console
        console.log(`\n==================================================`);
        // eslint-disable-next-line no-console
        console.log(`📧 PASSWORD RESET LINK FOR [${dto.email}]:`);
        // eslint-disable-next-line no-console
        console.log(`🔗 ${resetUrl}`);
        // eslint-disable-next-line no-console
        console.log(`==================================================\n`);
      }
    }

    return genericResponse;
  }

  // ---------- RESET PASSWORD ----------
  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // force re-login on all devices after reset
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  // ---------- LOGOUT ----------
  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  // ---------- UPDATE PROFILE ----------
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // If email is changing, check it is not taken by another user
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userModel.findOne({ email: dto.email });
      if (existing) throw new ConflictException('An account with this email already exists');
    }

    user.name = dto.name;
    if (dto.email) user.email = dto.email.toLowerCase().trim();
    await user.save();

    return { message: 'Profile updated successfully', user: this.sanitizeUser(user) };
  }

  // ---------- CHANGE PASSWORD ----------
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // ---------- HELPERS ----------
  private async generateVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresHours = Number(this.configService.get<string>('EMAIL_VERIFICATION_EXPIRES_HOURS') ?? '24');
    const expires = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
    return { token, hashedToken, expires };
  }

  private async sendVerificationEmail(email: string, token: string) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #2563eb; font-size: 20px; font-weight: 800; margin-bottom: 8px;">Verify Your Email</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Click the button below to verify your email address.</p>
          <div style="margin: 28px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">Verify Email</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">If you did not create an account, you can ignore this email.</p>
        </div>
      `;
      const transporter = this.createTransporter();
      const smtpUser = (this.configService.get<string>('SMTP_USER') || '').trim();

      if (transporter && smtpUser) {
        await transporter.sendMail({
          from: `"StudyAI Assistant" <${smtpUser}>`,
          to: email,
          subject: 'Verify your email — StudyAI Assistant',
          html: emailHtml,
        });
        // eslint-disable-next-line no-console
        console.log(`✅ Verification email sent via SMTP to ${email}`);
      } else {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await testTransporter.sendMail({
          from: '"StudyAI Assistant" <noreply@studyai.com>',
          to: email,
          subject: 'Verify your email — StudyAI Assistant',
          html: emailHtml,
        });
        // eslint-disable-next-line no-console
        console.log(`📧 Test verification email sent: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', err);
    }
  }

  async verifyEmail(token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userModel.findOne({
      verificationToken: hashed,
      verificationTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return { message: 'If an account exists, a verification email has been sent' };
    }
    const { token, hashedToken, expires } = await this.generateVerificationToken();
    user.verificationToken = hashedToken;
    user.verificationTokenExpires = expires;
    await user.save();
    await this.sendVerificationEmail(user.email, token);
    return { message: 'Verification email resent' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'default_jwt_access_secret_key_change_me',
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_jwt_refresh_secret_key_change_me',
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed });
  }

  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture || null,
      createdAt: (user as any).createdAt,
    };
  }

  // ---------- PROFILE PICTURE (CLOUDINARY) ----------
  async uploadProfilePicture(userId: string, file: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Delete old avatar from Cloudinary if exists
    if (user.profilePicturePublicId) {
      await this.cloudinaryService.deleteImage(user.profilePicturePublicId);
    }

    // Stream upload new avatar to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file, 'study-assistant/avatars');

    user.profilePicture = uploadResult.secure_url;
    user.profilePicturePublicId = uploadResult.public_id;
    await user.save();

    return {
      message: 'Profile picture updated successfully',
      profilePicture: uploadResult.secure_url,
      user: this.sanitizeUser(user),
    };
  }

  async removeProfilePicture(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Delete avatar image from Cloudinary
    if (user.profilePicturePublicId) {
      await this.cloudinaryService.deleteImage(user.profilePicturePublicId);
    }

    user.profilePicture = null;
    user.profilePicturePublicId = null;
    await user.save();

    return {
      message: 'Profile picture removed successfully',
      user: this.sanitizeUser(user),
    };
  }
}
