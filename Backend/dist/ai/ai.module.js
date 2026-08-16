"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./services/ai.service");
const openrouter_service_1 = require("./services/openrouter.service");
const text_extractor_service_1 = require("./services/text-extractor.service");
const ai_cache_schema_1 = require("./schemas/ai-cache.schema");
const quiz_attempt_schema_1 = require("./schemas/quiz-attempt.schema");
const chat_session_schema_1 = require("./schemas/chat-session.schema");
const general_chat_session_schema_1 = require("./schemas/general-chat-session.schema");
const material_schema_1 = require("../materials/schemas/material.schema");
const subject_schema_1 = require("../subjects/schemas/subject.schema");
const activities_module_1 = require("../activities/activities.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: ai_cache_schema_1.AiCache.name, schema: ai_cache_schema_1.AiCacheSchema },
                { name: quiz_attempt_schema_1.QuizAttempt.name, schema: quiz_attempt_schema_1.QuizAttemptSchema },
                { name: chat_session_schema_1.ChatSession.name, schema: chat_session_schema_1.ChatSessionSchema },
                { name: general_chat_session_schema_1.GeneralChatSession.name, schema: general_chat_session_schema_1.GeneralChatSessionSchema },
                { name: material_schema_1.Material.name, schema: material_schema_1.MaterialSchema },
                { name: subject_schema_1.Subject.name, schema: subject_schema_1.SubjectSchema },
            ]),
            jwt_1.JwtModule.register({}),
            activities_module_1.ActivitiesModule,
        ],
        controllers: [ai_controller_1.AiController],
        providers: [ai_service_1.AiService, openrouter_service_1.OpenRouterService, text_extractor_service_1.TextExtractorService],
        exports: [ai_service_1.AiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map