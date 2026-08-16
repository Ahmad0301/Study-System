import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from './schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class AuthService {
    private userModel;
    private jwtService;
    private configService;
    private cloudinaryService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, configService: ConfigService, cloudinaryService: CloudinaryService);
    signUp(dto: SignUpDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            profilePicture: string | null;
            createdAt: any;
        };
    }>;
    signIn(dto: SignInDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            profilePicture: string | null;
            createdAt: any;
        };
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            profilePicture: string | null;
            createdAt: any;
        };
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    private generateVerificationToken;
    private sendVerificationEmail;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private saveRefreshToken;
    private sanitizeUser;
    uploadProfilePicture(userId: string, file: any): Promise<{
        message: string;
        profilePicture: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            profilePicture: string | null;
            createdAt: any;
        };
    }>;
    removeProfilePicture(userId: string): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            profilePicture: string | null;
            createdAt: any;
        };
    }>;
}
