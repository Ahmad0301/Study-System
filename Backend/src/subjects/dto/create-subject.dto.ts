import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Subject name must be at least 2 characters.' })
  @MaxLength(30, { message: 'Subject name cannot exceed 30 characters.' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'Description cannot exceed 150 characters.' })
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
