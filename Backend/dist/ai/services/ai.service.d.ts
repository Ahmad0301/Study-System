import { Model, Types } from 'mongoose';
import { AiCache, AiCacheDocument } from '../schemas/ai-cache.schema';
import { QuizAttempt, QuizAttemptDocument } from '../schemas/quiz-attempt.schema';
import { ChatSession, ChatSessionDocument } from '../schemas/chat-session.schema';
import { GeneralChatSession, GeneralChatSessionDocument } from '../schemas/general-chat-session.schema';
import { MaterialDocument } from '../../materials/schemas/material.schema';
import { SubjectDocument } from '../../subjects/schemas/subject.schema';
import { TextExtractorService } from './text-extractor.service';
import { OpenRouterService } from './openrouter.service';
import { ActivitiesService } from '../../activities/activities.service';
import { GenerateAiContentDto, ChatAiDto, SubmitQuizScoreDto } from '../dto/ai-request.dto';
import { CreateChatSessionDto, SendSessionMessageDto, RenameChatSessionDto } from '../dto/chat-session.dto';
import { SendGeneralChatMessageDto } from '../dto/general-chat.dto';
export declare class AiService {
    private aiCacheModel;
    private quizAttemptModel;
    private chatSessionModel;
    private generalChatSessionModel;
    private materialModel;
    private subjectModel;
    private textExtractorService;
    private openRouterService;
    private activitiesService;
    private readonly logger;
    constructor(aiCacheModel: Model<AiCacheDocument>, quizAttemptModel: Model<QuizAttemptDocument>, chatSessionModel: Model<ChatSessionDocument>, generalChatSessionModel: Model<GeneralChatSessionDocument>, materialModel: Model<MaterialDocument>, subjectModel: Model<SubjectDocument>, textExtractorService: TextExtractorService, openRouterService: OpenRouterService, activitiesService: ActivitiesService);
    private getFileIdsKey;
    private getSelectedMaterials;
    getCachedContent(userId: string, subjectId: string, type: string, fileIds?: string[]): Promise<(import("mongoose").Document<unknown, {}, AiCacheDocument, {}, {}> & AiCache & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    generateSummary(userId: string, dto: GenerateAiContentDto): Promise<any>;
    chat(userId: string, dto: ChatAiDto): Promise<{
        id: string;
        role: string;
        text: string;
        time: string;
    }>;
    generateFlashcards(userId: string, dto: GenerateAiContentDto): Promise<any[]>;
    generateQuiz(userId: string, dto: GenerateAiContentDto): Promise<any[]>;
    saveQuizScore(userId: string, dto: SubmitQuizScoreDto): Promise<import("mongoose").Document<unknown, {}, QuizAttemptDocument, {}, {}> & QuizAttempt & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getAverageQuizScore(userId: string): Promise<number>;
    createChatSession(userId: string, dto: CreateChatSessionDto): Promise<import("mongoose").Document<unknown, {}, ChatSessionDocument, {}, {}> & ChatSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getChatSessions(userId: string, subjectId?: string): Promise<(import("mongoose").Document<unknown, {}, ChatSessionDocument, {}, {}> & ChatSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getChatSessionById(userId: string, sessionId: string): Promise<import("mongoose").Document<unknown, {}, ChatSessionDocument, {}, {}> & ChatSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    sendMessageToSession(userId: string, sessionId: string, dto: SendSessionMessageDto): Promise<import("mongoose").Document<unknown, {}, ChatSessionDocument, {}, {}> & ChatSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    renameChatSession(userId: string, sessionId: string, dto: RenameChatSessionDto): Promise<import("mongoose").Document<unknown, {}, ChatSessionDocument, {}, {}> & ChatSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    deleteChatSession(userId: string, sessionId: string): Promise<{
        message: string;
    }>;
    getGeneralChatSession(userId: string): Promise<import("mongoose").Document<unknown, {}, GeneralChatSessionDocument, {}, {}> & GeneralChatSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    sendGeneralChatMessage(userId: string, dto: SendGeneralChatMessageDto): Promise<{
        userMessage: {
            id: string;
            role: string;
            text: string;
            timestamp: string;
        };
        aiMessage: {
            id: string;
            role: string;
            text: string;
            timestamp: string;
        };
        messages: import("../schemas/general-chat-session.schema").GeneralChatMessageItem[];
    }>;
    clearGeneralChatSession(userId: string): Promise<{
        message: string;
        messages: never[];
    }>;
}
