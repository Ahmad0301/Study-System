import { IsNotEmpty, MinLength, MaxLength } from "class-validator";

export class ResetPasswordDto {
  @IsNotEmpty({ message: "Reset token is required" })
  token!: string;

  @IsNotEmpty({ message: "New password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(128, { message: "Password is too long" })
  newPassword!: string;
}
