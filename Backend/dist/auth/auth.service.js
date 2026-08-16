"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const user_schema_1 = require("./schemas/user.schema");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const SALT_ROUNDS = 10;
let AuthService = class AuthService {
    constructor(userModel, jwtService, configService, cloudinaryService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.cloudinaryService = cloudinaryService;
    }
    async signUp(dto) {
        const existingUser = await this.userModel.findOne({ email: dto.email });
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const user = await this.userModel.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
        });
        const { token, hashedToken, expires } = await this.generateVerificationToken();
        user.verificationToken = hashedToken;
        user.verificationTokenExpires = expires;
        await user.save();
        await this.sendVerificationEmail(user.email, token);
        return {
            message: 'Account created successfully. Please verify your email before signing in.',
            user: this.sanitizeUser(user),
        };
    }
    async signIn(dto) {
        const user = await this.userModel.findOne({ email: dto.email });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.emailVerified) {
            throw new common_1.UnauthorizedException('Email not verified. Please verify your email before signing in.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.generateTokens(user._id.toString(), user.email);
        await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);
        return {
            message: 'Signed in successfully',
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async refreshTokens(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.userModel.findById(payload.sub);
        if (!user || !user.refreshToken) {
            throw new common_1.UnauthorizedException('Access denied');
        }
        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Access denied');
        }
        const tokens = await this.generateTokens(user._id.toString(), user.email);
        await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);
        return tokens;
    }
    async forgotPassword(dto) {
        const user = await this.userModel.findOne({ email: dto.email });
        const genericResponse = {
            message: 'If an account with that email exists, a password reset link has been sent',
        };
        if (!user) {
            return genericResponse;
        }
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
        const expiresInMin = Number(this.configService.get('RESET_TOKEN_EXPIRES_MIN') ?? 15);
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + expiresInMin * 60 * 1000);
        await user.save();
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
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
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        if (smtpHost && smtpUser && smtpPass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: Number(this.configService.get('SMTP_PORT') || 587),
                    secure: false,
                    auth: { user: smtpUser, pass: smtpPass },
                });
                await transporter.sendMail({
                    from: `"StudyAI Assistant" <${smtpUser}>`,
                    to: dto.email,
                    subject: 'Password Reset Request — StudyAI Assistant',
                    html: emailHtml,
                });
            }
            catch (emailErr) {
                console.error('Failed to send SMTP email:', emailErr);
            }
        }
        else {
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
                console.log(`\n==================================================`);
                console.log(`📧 REAL SENT TEST EMAIL FOR [${dto.email}]:`);
                console.log(`📩 View Sent Email Inbox: ${previewUrl}`);
                console.log(`🔗 Reset Link: ${resetUrl}`);
                console.log(`==================================================\n`);
            }
            catch (_) {
                console.log(`\n==================================================`);
                console.log(`📧 PASSWORD RESET LINK FOR [${dto.email}]:`);
                console.log(`🔗 ${resetUrl}`);
                console.log(`==================================================\n`);
            }
        }
        return genericResponse;
    }
    async resetPassword(dto) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(dto.token)
            .digest('hex');
        const user = await this.userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new common_1.BadRequestException('Reset token is invalid or has expired');
        }
        user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.refreshToken = null;
        await user.save();
        return { message: 'Password has been reset successfully' };
    }
    async logout(userId) {
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
        return { message: 'Logged out successfully' };
    }
    async updateProfile(userId, dto) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (dto.email && dto.email !== user.email) {
            const existing = await this.userModel.findOne({ email: dto.email });
            if (existing)
                throw new common_1.ConflictException('An account with this email already exists');
        }
        user.name = dto.name;
        if (dto.email)
            user.email = dto.email.toLowerCase().trim();
        await user.save();
        return { message: 'Profile updated successfully', user: this.sanitizeUser(user) };
    }
    async changePassword(userId, dto) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Current password is incorrect');
        user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
        await user.save();
        return { message: 'Password changed successfully' };
    }
    async generateVerificationToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiresHours = Number(this.configService.get('EMAIL_VERIFICATION_EXPIRES_HOURS') ?? '24');
        const expires = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
        return { token, hashedToken, expires };
    }
    async sendVerificationEmail(email, token) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
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
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        if (smtpHost && smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: Number(this.configService.get('SMTP_PORT') || 587),
                secure: false,
                auth: { user: smtpUser, pass: smtpPass },
            });
            await transporter.sendMail({
                from: `"StudyAI Assistant" <${smtpUser}>`,
                to: email,
                subject: 'Verify your email — StudyAI Assistant',
                html: emailHtml,
            });
        }
        else {
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
            await transporter.sendMail({
                from: '"StudyAI Assistant" <noreply@studyai.com>',
                to: email,
                subject: 'Verify your email — StudyAI Assistant',
                html: emailHtml,
            });
        }
    }
    async verifyEmail(token) {
        const hashed = crypto.createHash('sha256').update(token).digest('hex');
        const user = await this.userModel.findOne({
            verificationToken: hashed,
            verificationTokenExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
        user.emailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();
        return { message: 'Email verified successfully' };
    }
    async resendVerificationEmail(email) {
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
    async generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async saveRefreshToken(userId, refreshToken) {
        const hashed = await bcrypt.hash(refreshToken, SALT_ROUNDS);
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed });
    }
    sanitizeUser(user) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture || null,
            createdAt: user.createdAt,
        };
    }
    async uploadProfilePicture(userId, file) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.profilePicturePublicId) {
            await this.cloudinaryService.deleteImage(user.profilePicturePublicId);
        }
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
    async removeProfilePicture(userId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService,
        cloudinary_service_1.CloudinaryService])
], AuthService);
//# sourceMappingURL=auth.service.js.map