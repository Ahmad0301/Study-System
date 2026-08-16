import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    updateProfile(req: Request, dto: UpdateProfileDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            profilePicture: string | null;
            createdAt: any;
        };
    }>;
    changePassword(req: Request, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    uploadProfilePicture(req: Request, file: any): Promise<{
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
    removeProfilePicture(req: Request): Promise<{
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
