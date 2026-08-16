import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/signup
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  // POST /auth/signin
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  // POST /auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // POST /auth/forgot-password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /auth/reset-password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // POST /auth/logout (protected route example)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.authService.logout(userId);
  }

  // PUT /auth/profile — update name and email
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req as any).user.sub;
    return this.authService.updateProfile(userId, dto);
  }

  // POST /auth/change-password — change password with current password verification
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = (req as any).user.sub;
    return this.authService.changePassword(userId, dto);
  }

  // GET /auth/verify-email?token=...
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // GET /auth/test-email?to=email@example.com — test live SMTP email delivery
  @Get('test-email')
  @HttpCode(HttpStatus.OK)
  testEmail(@Query('to') to: string) {
    return this.authService.testEmailDelivery(to);
  }

  // POST /auth/resend-verification
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  // POST /auth/profile-picture — upload avatar image to Cloudinary (max 2MB, images only)
  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|jpg)$/)) {
          return cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadProfilePicture(@Req() req: Request, @UploadedFile() file: any) {
    const userId = (req as any).user.sub;
    return this.authService.uploadProfilePicture(userId, file);
  }

  // DELETE /auth/profile-picture — remove avatar
  @Delete('profile-picture')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  removeProfilePicture(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.authService.removeProfilePicture(userId);
  }
}
