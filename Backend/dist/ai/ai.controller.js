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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./services/ai.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_request_dto_1 = require("./dto/ai-request.dto");
const chat_session_dto_1 = require("./dto/chat-session.dto");
const general_chat_dto_1 = require("./dto/general-chat.dto");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    getGeneralChatSession(req) {
        const userId = req.user.sub;
        return this.aiService.getGeneralChatSession(userId);
    }
    sendGeneralChatMessage(req, dto) {
        const userId = req.user.sub;
        return this.aiService.sendGeneralChatMessage(userId, dto);
    }
    clearGeneralChatSession(req) {
        const userId = req.user.sub;
        return this.aiService.clearGeneralChatSession(userId);
    }
    generateSummary(req, dto) {
        const userId = req.user.sub;
        return this.aiService.generateSummary(userId, dto);
    }
    chat(req, dto) {
        const userId = req.user.sub;
        return this.aiService.chat(userId, dto);
    }
    generateFlashcards(req, dto) {
        const userId = req.user.sub;
        return this.aiService.generateFlashcards(userId, dto);
    }
    generateQuiz(req, dto) {
        const userId = req.user.sub;
        return this.aiService.generateQuiz(userId, dto);
    }
    submitQuizScore(req, dto) {
        const userId = req.user.sub;
        return this.aiService.saveQuizScore(userId, dto);
    }
    createChatSession(req, dto) {
        const userId = req.user.sub;
        return this.aiService.createChatSession(userId, dto);
    }
    getChatSessions(req, subjectId) {
        const userId = req.user.sub;
        return this.aiService.getChatSessions(userId, subjectId);
    }
    getChatSessionById(req, id) {
        const userId = req.user.sub;
        return this.aiService.getChatSessionById(userId, id);
    }
    sendSessionMessage(req, id, dto) {
        const userId = req.user.sub;
        return this.aiService.sendMessageToSession(userId, id, dto);
    }
    renameChatSession(req, id, dto) {
        const userId = req.user.sub;
        return this.aiService.renameChatSession(userId, id, dto);
    }
    deleteChatSession(req, id) {
        const userId = req.user.sub;
        return this.aiService.deleteChatSession(userId, id);
    }
    async getCache(req, subjectId, type, fileIdsStr) {
        const userId = req.user.sub;
        const fileIds = fileIdsStr ? fileIdsStr.split(',').filter(Boolean) : [];
        const cached = await this.aiService.getCachedContent(userId, subjectId, type, fileIds);
        return cached ? cached.data : null;
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('general-chat'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getGeneralChatSession", null);
__decorate([
    (0, common_1.Post)('general-chat/message'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, general_chat_dto_1.SendGeneralChatMessageDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "sendGeneralChatMessage", null);
__decorate([
    (0, common_1.Delete)('general-chat'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "clearGeneralChatSession", null);
__decorate([
    (0, common_1.Post)('generate-summary'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_request_dto_1.GenerateAiContentDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateSummary", null);
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_request_dto_1.ChatAiDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('generate-flashcards'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_request_dto_1.GenerateAiContentDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateFlashcards", null);
__decorate([
    (0, common_1.Post)('generate-quiz'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_request_dto_1.GenerateAiContentDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateQuiz", null);
__decorate([
    (0, common_1.Post)('quiz-score'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_request_dto_1.SubmitQuizScoreDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "submitQuizScore", null);
__decorate([
    (0, common_1.Post)('chat-sessions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_session_dto_1.CreateChatSessionDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "createChatSession", null);
__decorate([
    (0, common_1.Get)('chat-sessions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getChatSessions", null);
__decorate([
    (0, common_1.Get)('chat-sessions/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getChatSessionById", null);
__decorate([
    (0, common_1.Post)('chat-sessions/:id/messages'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_session_dto_1.SendSessionMessageDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "sendSessionMessage", null);
__decorate([
    (0, common_1.Put)('chat-sessions/:id/title'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_session_dto_1.RenameChatSessionDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "renameChatSession", null);
__decorate([
    (0, common_1.Delete)('chat-sessions/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "deleteChatSession", null);
__decorate([
    (0, common_1.Get)('cache/:subjectId/:type'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('subjectId')),
    __param(2, (0, common_1.Param)('type')),
    __param(3, (0, common_1.Query)('fileIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getCache", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map