import { IsString, IsEmail, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsOptional()
  email?: string;
}
