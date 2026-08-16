import { ConfigService } from '@nestjs/config';
export declare class OpenRouterService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    chatCompletion(messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>, temperature?: number, maxTokens?: number): Promise<string>;
    parseJsonResponse<T>(rawContent: string): Promise<T>;
}
