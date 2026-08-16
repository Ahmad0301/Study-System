import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { OpenRouterService } from './services/openrouter.service';
import { TextExtractorService } from './services/text-extractor.service';
import { AiCache, AiCacheSchema } from './schemas/ai-cache.schema';
import { QuizAttempt, QuizAttemptSchema } from './schemas/quiz-attempt.schema';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema';
import { GeneralChatSession, GeneralChatSessionSchema } from './schemas/general-chat-session.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { Subject, SubjectSchema } from '../subjects/schemas/subject.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiCache.name, schema: AiCacheSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: GeneralChatSession.name, schema: GeneralChatSessionSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    JwtModule.register({}),
    ActivitiesModule,
  ],
  controllers: [AiController],
  providers: [AiService, OpenRouterService, TextExtractorService],
  exports: [AiService],
})
export class AiModule {}
