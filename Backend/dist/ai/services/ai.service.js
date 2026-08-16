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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ai_cache_schema_1 = require("../schemas/ai-cache.schema");
const quiz_attempt_schema_1 = require("../schemas/quiz-attempt.schema");
const chat_session_schema_1 = require("../schemas/chat-session.schema");
const general_chat_session_schema_1 = require("../schemas/general-chat-session.schema");
const material_schema_1 = require("../../materials/schemas/material.schema");
const subject_schema_1 = require("../../subjects/schemas/subject.schema");
const text_extractor_service_1 = require("./text-extractor.service");
const openrouter_service_1 = require("./openrouter.service");
const activities_service_1 = require("../../activities/activities.service");
let AiService = AiService_1 = class AiService {
    constructor(aiCacheModel, quizAttemptModel, chatSessionModel, generalChatSessionModel, materialModel, subjectModel, textExtractorService, openRouterService, activitiesService) {
        this.aiCacheModel = aiCacheModel;
        this.quizAttemptModel = quizAttemptModel;
        this.chatSessionModel = chatSessionModel;
        this.generalChatSessionModel = generalChatSessionModel;
        this.materialModel = materialModel;
        this.subjectModel = subjectModel;
        this.textExtractorService = textExtractorService;
        this.openRouterService = openRouterService;
        this.activitiesService = activitiesService;
        this.logger = new common_1.Logger(AiService_1.name);
    }
    getFileIdsKey(fileIds) {
        if (!fileIds || fileIds.length === 0)
            return ['ALL'];
        return [...fileIds].sort();
    }
    async getSelectedMaterials(userId, subjectId, fileIds) {
        const subject = await this.subjectModel.findOne({
            _id: new mongoose_2.Types.ObjectId(subjectId),
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        if (!subject) {
            throw new common_1.NotFoundException('Subject not found or access denied');
        }
        const query = {
            subjectId: new mongoose_2.Types.ObjectId(subjectId),
            userId: new mongoose_2.Types.ObjectId(userId),
        };
        if (fileIds && fileIds.length > 0) {
            query._id = { $in: fileIds.map((id) => new mongoose_2.Types.ObjectId(id)) };
        }
        const materials = await this.materialModel.find(query).exec();
        if (!materials || materials.length === 0) {
            throw new common_1.BadRequestException('No materials found for the selected subject and files');
        }
        return materials;
    }
    async getCachedContent(userId, subjectId, type, fileIds) {
        const fileIdsKey = this.getFileIdsKey(fileIds);
        return this.aiCacheModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            subjectId: new mongoose_2.Types.ObjectId(subjectId),
            type,
            fileIdsKey,
        }).exec();
    }
    async generateSummary(userId, dto) {
        const fileIdsKey = this.getFileIdsKey(dto.fileIds);
        if (!dto.forceRefresh) {
            const cached = await this.getCachedContent(userId, dto.subjectId, 'summary', dto.fileIds);
            if (cached && cached.data && cached.data.title) {
                return cached.data;
            }
        }
        const materials = await this.getSelectedMaterials(userId, dto.subjectId, dto.fileIds);
        const subject = await this.subjectModel.findById(dto.subjectId);
        const documentText = await this.textExtractorService.extractTextFromMaterials(materials);
        const fileNames = materials.map((m) => m.name).join(', ');
        const systemPrompt = `You are an expert AI academic study assistant. Your job is to generate a comprehensive, well-structured Executive Summary from the provided document text.

STRICT RULES:
1. Base the summary ONLY on the provided document content — do NOT add outside knowledge.
2. Be specific and detailed — include actual topics, concepts, and terms from the document.
3. Return ONLY a single valid raw JSON object — no markdown, no code fences, no commentary.
4. The summary MUST have these exact 6 sections in "sections":
   - "Main Topics Covered"
   - "Key Concepts & Theories"
   - "Important Definitions"
   - "Critical Analysis & Insights"
   - "Practical Applications"
   - "Conclusion"
5. Each section must have 3–6 specific bullet points drawn directly from the document.
6. keyTakeaways must be 4–6 exam-relevant points.

JSON Format (return EXACTLY this structure):
{
  "title": "Specific descriptive title based on document content",
  "subject": "${subject?.name || 'Course Subject'}",
  "analyzedFiles": "${fileNames}",
  "sections": [
    {
      "heading": "Section Heading",
      "bullets": ["Specific point from document", "Another specific point"]
    }
  ],
  "keyTakeaways": ["Exam-relevant takeaway 1", "Exam-relevant takeaway 2"]
}`;
        const userPrompt = `Analyze the following document and generate a detailed Executive Summary following the JSON format specified:\n\n${documentText}`;
        const rawResponse = await this.openRouterService.chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 0.3, 3000);
        const summaryData = await this.openRouterService.parseJsonResponse(rawResponse);
        await this.aiCacheModel.findOneAndUpdate({
            userId: new mongoose_2.Types.ObjectId(userId),
            subjectId: new mongoose_2.Types.ObjectId(dto.subjectId),
            type: 'summary',
            fileIdsKey,
        }, { data: summaryData }, { upsert: true, new: true });
        await this.activitiesService.logActivity(userId, 'summary', `Generated AI summary for ${subject?.name || 'subject'}`);
        return summaryData;
    }
    async chat(userId, dto) {
        const materials = await this.getSelectedMaterials(userId, dto.subjectId, dto.fileIds);
        const documentText = await this.textExtractorService.extractTextFromMaterials(materials);
        const systemPrompt = `You are an AI Study Buddy. You answer student questions based strictly on the provided course material text.
CRITICAL RULE: Primary source of truth is the provided course material. If the requested information is not present or cannot be inferred from the uploaded content, clearly state: "The provided documents do not contain information to answer this question." Do not fabricate or invent information.

RESPONSE FORMAT RULES:
1. Give a direct, well-structured answer using clear Markdown bullet points and bold key terms.
2. Use Markdown tables or syntax-highlighted code blocks with language identifiers when helpful.
3. Conclude with a section titled:
   ### 💡 Suggested Follow-up Questions:
   - Follow-up question 1?
   - Follow-up question 2?

Course Materials Text:
${documentText}`;
        const messages = [
            { role: 'system', content: systemPrompt },
        ];
        if (dto.history && dto.history.length > 0) {
            for (const h of dto.history.slice(-6)) {
                messages.push({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.text,
                });
            }
        }
        messages.push({ role: 'user', content: dto.message });
        const replyText = await this.openRouterService.chatCompletion(messages, 0.4, 1500);
        return {
            id: `m-${Date.now()}`,
            role: 'ai',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
    }
    async generateFlashcards(userId, dto) {
        const fileIdsKey = this.getFileIdsKey(dto.fileIds);
        if (!dto.forceRefresh) {
            const cached = await this.getCachedContent(userId, dto.subjectId, 'flashcards', dto.fileIds);
            if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
                return cached.data;
            }
        }
        const materials = await this.getSelectedMaterials(userId, dto.subjectId, dto.fileIds);
        const subject = await this.subjectModel.findById(dto.subjectId);
        const documentText = await this.textExtractorService.extractTextFromMaterials(materials);
        const fileNames = materials.map((m) => m.name).join(', ');
        const wordCount = documentText.split(/\s+/).length;
        const cardCount = wordCount < 500 ? 6 : wordCount < 2000 ? 10 : wordCount < 5000 ? 15 : 20;
        const systemPrompt = `You are an expert AI academic tutor. Generate exactly ${cardCount} high-quality study flashcards from the provided document.

STRICT RULES:
1. Base ALL flashcards ONLY on the provided document content — no outside information.
2. Each flashcard must test a SPECIFIC concept, definition, formula, or fact from the document.
3. Front: A clear, specific question or term. Back: A detailed, accurate explanation or answer.
4. Vary the types: include definitions, "What is...", "Explain...", "What are the steps to...", cause-effect questions.
5. Return ONLY a raw JSON array — no markdown, no code fences, no extra text.
6. Source documents: ${fileNames}

JSON Format (return EXACTLY this):
[
  {
    "id": "fc1",
    "front": "Specific question or key term from the document?",
    "back": "Detailed, accurate answer based on document content"
  }
]`;
        const userPrompt = `Generate ${cardCount} study flashcards from the following document content:\n\n${documentText}`;
        const rawResponse = await this.openRouterService.chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 0.5, 4096);
        const flashcardsData = await this.openRouterService.parseJsonResponse(rawResponse);
        await this.aiCacheModel.findOneAndUpdate({
            userId: new mongoose_2.Types.ObjectId(userId),
            subjectId: new mongoose_2.Types.ObjectId(dto.subjectId),
            type: 'flashcards',
            fileIdsKey,
        }, { data: flashcardsData }, { upsert: true, new: true });
        await this.activitiesService.logActivity(userId, 'flashcard', `Generated ${cardCount} flashcards for ${subject?.name || 'subject'}`);
        return flashcardsData;
    }
    async generateQuiz(userId, dto) {
        const fileIdsKey = this.getFileIdsKey(dto.fileIds);
        const count = Math.min(Math.max(dto.questionCount || 10, 1), 25);
        const randomSeed = Math.random().toString(36).substring(2, 9);
        const mcqCount = Math.ceil(count * 0.75);
        const tfCount = count - mcqCount;
        const materials = await this.getSelectedMaterials(userId, dto.subjectId, dto.fileIds);
        const subject = await this.subjectModel.findById(dto.subjectId);
        const documentText = await this.textExtractorService.extractTextFromMaterials(materials);
        const fileNames = materials.map((m) => m.name).join(', ');
        const systemPrompt = `You are an expert test creator and academic examiner. Generate exactly ${count} UNIQUE, VARIED quiz questions from the provided document.

STRICT RULES:
1. Base ALL questions ONLY on the provided document content — no outside knowledge.
2. Generate ${mcqCount} Multiple Choice Questions (MCQ) and ${tfCount} True/False questions.
3. For MCQ: provide exactly 4 options — 1 correct answer + 3 plausible-sounding but wrong distractors.
4. For True/False: options must be exactly ["True", "False"] and correct must be 0 (True) or 1 (False).
5. Vary difficulty: mix easy, medium, and challenging questions.
6. Vary topics: cover different sections of the document.
7. Use this random seed for uniqueness: ${randomSeed}_${Date.now()}
8. Source documents: ${fileNames}
9. Return ONLY a raw JSON array — no markdown, no code fences, no extra text.

JSON Format (EXACTLY this structure for ALL question types):
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "Specific question based on document content?",
    "options": ["Correct Answer", "Wrong Option B", "Wrong Option C", "Wrong Option D"],
    "correct": 0
  },
  {
    "id": "q2",
    "type": "tf",
    "question": "True or False: Statement from document content.",
    "options": ["True", "False"],
    "correct": 0
  }
]`;
        const userPrompt = `Generate a fresh, unique ${count}-question quiz (${mcqCount} MCQ + ${tfCount} True/False) from the following document:\n\n${documentText}`;
        const rawResponse = await this.openRouterService.chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 0.8, 4096);
        const quizData = await this.openRouterService.parseJsonResponse(rawResponse);
        await this.aiCacheModel.findOneAndUpdate({
            userId: new mongoose_2.Types.ObjectId(userId),
            subjectId: new mongoose_2.Types.ObjectId(dto.subjectId),
            type: 'quiz',
            fileIdsKey,
        }, { data: quizData }, { upsert: true, new: true });
        await this.activitiesService.logActivity(userId, 'quiz', `Generated ${count}-question quiz for ${subject?.name || 'subject'}`);
        return quizData;
    }
    async saveQuizScore(userId, dto) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subjectObjectId = new mongoose_2.Types.ObjectId(dto.subjectId);
        const attempt = new this.quizAttemptModel({
            userId: userObjectId,
            subjectId: subjectObjectId,
            score: dto.score,
            correctCount: dto.correctCount,
            totalQuestions: dto.totalQuestions,
        });
        const saved = await attempt.save();
        const subject = await this.subjectModel.findById(dto.subjectId);
        await this.activitiesService.logActivity(userId, 'quiz', `Completed quiz on ${subject?.name || 'subject'} — Score: ${dto.score}%`);
        return saved;
    }
    async getAverageQuizScore(userId) {
        const attempts = await this.quizAttemptModel.find({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!attempts || attempts.length === 0)
            return 0;
        const total = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
        return Math.round(total / attempts.length);
    }
    async createChatSession(userId, dto) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subjectObjectId = dto.subjectId ? new mongoose_2.Types.ObjectId(dto.subjectId) : undefined;
        const title = dto.title || (dto.initialMessage ? dto.initialMessage.slice(0, 32) + '...' : 'New Conversation');
        const session = new this.chatSessionModel({
            userId: userObjectId,
            subjectId: subjectObjectId,
            title,
            fileIds: dto.fileIds || [],
            messages: [],
        });
        const saved = await session.save();
        if (dto.initialMessage) {
            return await this.sendMessageToSession(userId, saved._id.toString(), { message: dto.initialMessage });
        }
        return saved;
    }
    async getChatSessions(userId, subjectId) {
        const filter = { userId: new mongoose_2.Types.ObjectId(userId) };
        if (subjectId) {
            filter.subjectId = new mongoose_2.Types.ObjectId(subjectId);
        }
        return this.chatSessionModel.find(filter).sort({ updatedAt: -1 }).exec();
    }
    async getChatSessionById(userId, sessionId) {
        const session = await this.chatSessionModel
            .findOne({ _id: new mongoose_2.Types.ObjectId(sessionId), userId: new mongoose_2.Types.ObjectId(userId) })
            .exec();
        if (!session) {
            throw new common_1.NotFoundException('Chat session not found');
        }
        return session;
    }
    async sendMessageToSession(userId, sessionId, dto) {
        const session = await this.getChatSessionById(userId, sessionId);
        const userMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            text: dto.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        session.messages.push(userMsg);
        if (session.title === 'New Conversation' && session.messages.length === 1) {
            session.title = dto.message.length > 36 ? `${dto.message.slice(0, 36)}...` : dto.message;
        }
        let documentContext = '';
        if (session.subjectId) {
            const materials = await this.getSelectedMaterials(userId, session.subjectId.toString(), session.fileIds);
            if (materials.length > 0) {
                documentContext = await this.textExtractorService.extractTextFromMaterials(materials);
            }
        }
        const systemPrompt = `You are AI Study Assistant, an expert tutor and interactive academic assistant.

RESPONSE FORMAT RULES:
1. Ground your answers in the provided study material when available.
2. Start with a clear executive summary or direct answer.
3. Structure your response using rich Markdown:
   - Use subheadings (### Key Takeaways, ### Concept Breakdown).
   - Use organized bullet points with **bold key terms**.
   - Use Markdown tables (\`| Concept | Description |\`) when comparing topics or listing structured attributes.
   - Use syntax-highlighted code blocks with language identifiers for any code snippets.
4. End your response with a section titled:
   ### 💡 Suggested Follow-up Questions:
   - Relevant follow-up question 1?
   - Relevant follow-up question 2?${documentContext ? `\n\nStudy Material Context:\n${documentContext.slice(0, 8000)}` : ''}`;
        const conversationHistory = [
            { role: 'system', content: systemPrompt },
            ...session.messages.slice(-6).map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text.length > 600 ? m.text.slice(0, 600) + '...' : m.text,
            })),
        ];
        const aiResponseText = await this.openRouterService.chatCompletion(conversationHistory, 0.7, 1500);
        const aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: aiResponseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        session.messages.push(aiMsg);
        session.markModified('messages');
        await session.save();
        await this.activitiesService.logActivity(userId, 'chat', `AI Chat: ${dto.message.slice(0, 30)}...`);
        return session;
    }
    async renameChatSession(userId, sessionId, dto) {
        const updated = await this.chatSessionModel
            .findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(sessionId), userId: new mongoose_2.Types.ObjectId(userId) }, { $set: { title: dto.title } }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Chat session not found');
        }
        return updated;
    }
    async deleteChatSession(userId, sessionId) {
        const res = await this.chatSessionModel
            .deleteOne({ _id: new mongoose_2.Types.ObjectId(sessionId), userId: new mongoose_2.Types.ObjectId(userId) })
            .exec();
        if (res.deletedCount === 0) {
            throw new common_1.NotFoundException('Chat session not found');
        }
        return { message: 'Chat session deleted successfully' };
    }
    async getGeneralChatSession(userId) {
        let session = await this.generalChatSessionModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .exec();
        if (!session) {
            session = await this.generalChatSessionModel.create({
                userId: new mongoose_2.Types.ObjectId(userId),
                title: 'StudyAI Assistant Chat',
                messages: [],
            });
        }
        return session;
    }
    async sendGeneralChatMessage(userId, dto) {
        const session = await this.getGeneralChatSession(userId);
        const userMsgId = `usr-${Date.now()}`;
        const nowIso = new Date().toISOString();
        const userMessage = {
            id: userMsgId,
            role: 'user',
            text: dto.message,
            timestamp: nowIso,
        };
        const conversationHistory = [
            {
                role: 'system',
                content: `You are StudyAI Assistant, a friendly, accurate, and highly intelligent general-purpose academic AI tutor. Answer any question asked by the user — including general knowledge, science, literature, history, coding, mathematics, writing, essay editing, and study productivity advice.

RESPONSE FORMAT RULES:
1. Start with a direct, clear executive summary or answer.
2. Structure your response using rich Markdown formatting:
   - Use clean subheadings (## Section Title or ### Sub-topic). Do NOT use 4+ hashes (like ####) or raw divider lines (like ---).
   - Use bullet points with **bold key terms** for maximum readability.
   - Use Markdown tables (\`| Concept | Explanation |\`) when comparing items or listing structured data.
   - Use syntax-highlighted code blocks with language identifiers for code.
3. Conclude every detailed response with a section titled:
   ### 💡 Suggested Follow-up Questions:
   - Follow-up question 1?
   - Follow-up question 2?
   - Follow-up question 3?`,
            },
        ];
        const pastMessages = session.messages.slice(-6);
        for (const msg of pastMessages) {
            conversationHistory.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text.length > 600 ? msg.text.slice(0, 600) + '...' : msg.text,
            });
        }
        conversationHistory.push({
            role: 'user',
            content: dto.message,
        });
        const aiReplyText = await this.openRouterService.chatCompletion(conversationHistory, 0.7, 1500);
        const aiMsgId = `ai-${Date.now()}`;
        const aiMessage = {
            id: aiMsgId,
            role: 'ai',
            text: aiReplyText,
            timestamp: new Date().toISOString(),
        };
        session.messages.push(userMessage, aiMessage);
        await session.save();
        await this.activitiesService.logActivity(userId, 'summary', `General AI Chat: ${dto.message.slice(0, 30)}...`);
        return {
            userMessage,
            aiMessage,
            messages: session.messages,
        };
    }
    async clearGeneralChatSession(userId) {
        const session = await this.getGeneralChatSession(userId);
        session.messages = [];
        await session.save();
        return { message: 'General chat history cleared successfully', messages: [] };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ai_cache_schema_1.AiCache.name)),
    __param(1, (0, mongoose_1.InjectModel)(quiz_attempt_schema_1.QuizAttempt.name)),
    __param(2, (0, mongoose_1.InjectModel)(chat_session_schema_1.ChatSession.name)),
    __param(3, (0, mongoose_1.InjectModel)(general_chat_session_schema_1.GeneralChatSession.name)),
    __param(4, (0, mongoose_1.InjectModel)(material_schema_1.Material.name)),
    __param(5, (0, mongoose_1.InjectModel)(subject_schema_1.Subject.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        text_extractor_service_1.TextExtractorService,
        openrouter_service_1.OpenRouterService,
        activities_service_1.ActivitiesService])
], AiService);
//# sourceMappingURL=ai.service.js.map