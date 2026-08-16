import { Request } from 'express';
import { AiService } from './services/ai.service';
import { GenerateAiContentDto, ChatAiDto, SubmitQuizScoreDto } from './dto/ai-request.dto';
import { CreateChatSessionDto, SendSessionMessageDto, RenameChatSessionDto } from './dto/chat-session.dto';
import { SendGeneralChatMessageDto } from './dto/general-chat.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    getGeneralChatSession(req: Request): Promise<import("mongoose").Document<unknown, {}, import("./schemas/general-chat-session.schema").GeneralChatSessionDocument, {}, {}> & import("./schemas/general-chat-session.schema").GeneralChatSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    sendGeneralChatMessage(req: Request, dto: SendGeneralChatMessageDto): Promise<{
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
        messages: import("./schemas/general-chat-session.schema").GeneralChatMessageItem[];
    }>;
    clearGeneralChatSession(req: Request): Promise<{
        message: string;
        messages: never[];
    }>;
    generateSummary(req: Request, dto: GenerateAiContentDto): Promise<any>;
    chat(req: Request, dto: ChatAiDto): Promise<{
        id: string;
        role: string;
        text: string;
        time: string;
    }>;
    generateFlashcards(req: Request, dto: GenerateAiContentDto): Promise<any[]>;
    generateQuiz(req: Request, dto: GenerateAiContentDto): Promise<any[]>;
    submitQuizScore(req: Request, dto: SubmitQuizScoreDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/quiz-attempt.schema").QuizAttemptDocument, {}, {}> & import("./schemas/quiz-attempt.schema").QuizAttempt & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    createChatSession(req: Request, dto: CreateChatSessionDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/chat-session.schema").ChatSessionDocument, {}, {}> & import("./schemas/chat-session.schema").ChatSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getChatSessions(req: Request, subjectId?: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/chat-session.schema").ChatSessionDocument, {}, {}> & import("./schemas/chat-session.schema").ChatSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getChatSessionById(req: Request, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/chat-session.schema").ChatSessionDocument, {}, {}> & import("./schemas/chat-session.schema").ChatSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    sendSessionMessage(req: Request, id: string, dto: SendSessionMessageDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/chat-session.schema").ChatSessionDocument, {}, {}> & import("./schemas/chat-session.schema").ChatSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    renameChatSession(req: Request, id: string, dto: RenameChatSessionDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/chat-session.schema").ChatSessionDocument, {}, {}> & import("./schemas/chat-session.schema").ChatSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    deleteChatSession(req: Request, id: string): Promise<{
        message: string;
    }>;
    getCache(req: Request, subjectId: string, type: string, fileIdsStr?: string): Promise<any>;
}
