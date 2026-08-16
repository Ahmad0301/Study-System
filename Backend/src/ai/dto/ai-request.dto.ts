import { IsString, IsArray, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class GenerateAiContentDto {
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];

  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;

  @IsOptional()
  @IsNumber()
  questionCount?: number;
}

export class ChatAiDto {
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];

  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  history?: Array<{ role: string; text: string }>;
}

export class SubmitQuizScoreDto {
  @IsString()
  subjectId: string;

  @IsNumber()
  score: number;

  @IsNumber()
  correctCount: number;

  @IsNumber()
  totalQuestions: number;
}

