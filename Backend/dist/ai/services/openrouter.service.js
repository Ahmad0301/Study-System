"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenRouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let OpenRouterService = OpenRouterService_1 = class OpenRouterService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(OpenRouterService_1.name);
    }
    async chatCompletion(messages, temperature = 0.7, maxTokens = 4096) {
        const apiKey = this.configService.get('OPENROUTER_API_KEY');
        const baseUrl = this.configService.get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
        const configuredModel = this.configService.get('OPENROUTER_MODEL');
        const candidateModels = [
            configuredModel,
            'google/gemma-4-31b-it:free',
            'google/gemma-4-26b-a4b-it:free',
            'nvidia/nemotron-3-nano-30b-a3b:free',
            'liquid/lfm-2.5-2.6b:free',
        ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);
        if (!apiKey) {
            this.logger.warn('OPENROUTER_API_KEY is missing in .env');
        }
        let lastError = '';
        for (const model of candidateModels) {
            try {
                const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'AI Study Assistant',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature,
                        max_tokens: maxTokens,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const text = data.choices?.[0]?.message?.content;
                    if (text) {
                        return typeof text === 'string' ? text : JSON.stringify(text);
                    }
                }
                else {
                    const errText = await response.text();
                    lastError = `Model ${model} failed (${response.status}): ${errText}`;
                    this.logger.warn(lastError);
                }
            }
            catch (err) {
                lastError = `Model ${model} network error: ${err?.message || err}`;
                this.logger.warn(lastError);
            }
        }
        if (lastError.includes('free-models-per-day') || lastError.includes('Rate limit exceeded')) {
            throw new common_1.InternalServerErrorException('OpenRouter free daily quota (50 requests/day) has been reached for this API key. Please wait for the daily reset or update your OPENROUTER_API_KEY in backend/.env.');
        }
        throw new common_1.InternalServerErrorException(`All candidate AI models failed. ${lastError}`);
    }
    async parseJsonResponse(rawContent) {
        try {
            let cleanJsonStr = rawContent.trim();
            if (cleanJsonStr.startsWith('```')) {
                cleanJsonStr = cleanJsonStr
                    .replace(/^```(?:json|javascript|js)?\s*/i, '')
                    .replace(/\s*```\s*$/i, '')
                    .trim();
            }
            const jsonStart = cleanJsonStr.search(/[\[{]/);
            const jsonEnd = Math.max(cleanJsonStr.lastIndexOf('}'), cleanJsonStr.lastIndexOf(']'));
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                cleanJsonStr = cleanJsonStr.slice(jsonStart, jsonEnd + 1);
            }
            cleanJsonStr = cleanJsonStr
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/,\s*,/g, ',');
            return JSON.parse(cleanJsonStr);
        }
        catch (error) {
            this.logger.error(`Failed to parse AI JSON response. Raw content (first 500 chars): ${rawContent.substring(0, 500)}`);
            throw new common_1.InternalServerErrorException('The AI model returned a malformed response. Please try generating again.');
        }
    }
};
exports.OpenRouterService = OpenRouterService;
exports.OpenRouterService = OpenRouterService = OpenRouterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenRouterService);
//# sourceMappingURL=openrouter.service.js.map