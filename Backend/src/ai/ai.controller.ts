import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AiService } from './services/ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateAiContentDto, ChatAiDto, SubmitQuizScoreDto } from './dto/ai-request.dto';
import { CreateChatSessionDto, SendSessionMessageDto, RenameChatSessionDto } from './dto/chat-session.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-summary')
  @HttpCode(HttpStatus.OK)
  generateSummary(@Req() req: Request, @Body() dto: GenerateAiContentDto) {
    const userId = (req as any).user.sub;
    return this.aiService.generateSummary(userId, dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Req() req: Request, @Body() dto: ChatAiDto) {
    const userId = (req as any).user.sub;
    return this.aiService.chat(userId, dto);
  }

  @Post('generate-flashcards')
  @HttpCode(HttpStatus.OK)
  generateFlashcards(@Req() req: Request, @Body() dto: GenerateAiContentDto) {
    const userId = (req as any).user.sub;
    return this.aiService.generateFlashcards(userId, dto);
  }

  @Post('generate-quiz')
  @HttpCode(HttpStatus.OK)
  generateQuiz(@Req() req: Request, @Body() dto: GenerateAiContentDto) {
    const userId = (req as any).user.sub;
    return this.aiService.generateQuiz(userId, dto);
  }

  @Post('quiz-score')
  @HttpCode(HttpStatus.CREATED)
  submitQuizScore(@Req() req: Request, @Body() dto: SubmitQuizScoreDto) {
    const userId = (req as any).user.sub;
    return this.aiService.saveQuizScore(userId, dto);
  }

  // --- Multi-Session Chat Session Endpoints ---

  @Post('chat-sessions')
  @HttpCode(HttpStatus.CREATED)
  createChatSession(@Req() req: Request, @Body() dto: CreateChatSessionDto) {
    const userId = (req as any).user.sub;
    return this.aiService.createChatSession(userId, dto);
  }

  @Get('chat-sessions')
  getChatSessions(@Req() req: Request, @Query('subjectId') subjectId?: string) {
    const userId = (req as any).user.sub;
    return this.aiService.getChatSessions(userId, subjectId);
  }

  @Get('chat-sessions/:id')
  getChatSessionById(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.aiService.getChatSessionById(userId, id);
  }

  @Post('chat-sessions/:id/messages')
  @HttpCode(HttpStatus.OK)
  sendSessionMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendSessionMessageDto,
  ) {
    const userId = (req as any).user.sub;
    return this.aiService.sendMessageToSession(userId, id, dto);
  }

  @Put('chat-sessions/:id/title')
  renameChatSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: RenameChatSessionDto,
  ) {
    const userId = (req as any).user.sub;
    return this.aiService.renameChatSession(userId, id, dto);
  }

  @Delete('chat-sessions/:id')
  deleteChatSession(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.aiService.deleteChatSession(userId, id);
  }

  @Get('cache/:subjectId/:type')
  async getCache(
    @Req() req: Request,
    @Param('subjectId') subjectId: string,
    @Param('type') type: string,
    @Query('fileIds') fileIdsStr?: string,
  ) {
    const userId = (req as any).user.sub;
    const fileIds = fileIdsStr ? fileIdsStr.split(',').filter(Boolean) : [];
    const cached = await this.aiService.getCachedContent(userId, subjectId, type, fileIds);
    return cached ? cached.data : null;
  }
}
