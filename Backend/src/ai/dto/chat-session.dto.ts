import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class SendSessionMessageDto {
  @IsString()
  message: string;
}

export class RenameChatSessionDto {
  @IsString()
  title: string;
}
