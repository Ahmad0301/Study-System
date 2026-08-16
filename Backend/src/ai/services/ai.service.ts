import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiCache, AiCacheDocument } from '../schemas/ai-cache.schema';
import { QuizAttempt, QuizAttemptDocument } from '../schemas/quiz-attempt.schema';
import { ChatSession, ChatSessionDocument } from '../schemas/chat-session.schema';
import { GeneralChatSession, GeneralChatSessionDocument } from '../schemas/general-chat-session.schema';
import { Material, MaterialDocument } from '../../materials/schemas/material.schema';
import { Subject, SubjectDocument } from '../../subjects/schemas/subject.schema';
import { TextExtractorService } from './text-extractor.service';
import { OpenRouterService } from './openrouter.service';
import { ActivitiesService } from '../../activities/activities.service';
import { GenerateAiContentDto, ChatAiDto, SubmitQuizScoreDto } from '../dto/ai-request.dto';
import { CreateChatSessionDto, SendSessionMessageDto, RenameChatSessionDto } from '../dto/chat-session.dto';
import { SendGeneralChatMessageDto } from '../dto/general-chat.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectModel(AiCache.name) private aiCacheModel: Model<AiCacheDocument>,
    @InjectModel(QuizAttempt.name) private quizAttemptModel: Model<QuizAttemptDocument>,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(GeneralChatSession.name) private generalChatSessionModel: Model<GeneralChatSessionDocument>,
    @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    private textExtractorService: TextExtractorService,
    private openRouterService: OpenRouterService,
    private activitiesService: ActivitiesService,
  ) {}

  private getFileIdsKey(fileIds?: string[]): string[] {
    if (!fileIds || fileIds.length === 0) return ['ALL'];
    return [...fileIds].sort();
  }

  private async getSelectedMaterials(
    userId: string,
    subjectId: string,
    fileIds?: string[],
  ): Promise<MaterialDocument[]> {
    const subject = await this.subjectModel.findOne({
      _id: new Types.ObjectId(subjectId),
      userId: new Types.ObjectId(userId),
    });

    if (!subject) {
      throw new NotFoundException('Subject not found or access denied');
    }

    const query: any = {
      subjectId: new Types.ObjectId(subjectId),
      userId: new Types.ObjectId(userId),
    };

    if (fileIds && fileIds.length > 0) {
      query._id = { $in: fileIds.map((id) => new Types.ObjectId(id)) };
    }

    const materials = await this.materialModel.find(query).exec();
    if (!materials || materials.length === 0) {
      throw new BadRequestException('No materials found for the selected subject and files');
    }

    return materials;
  }

  async getCachedContent(userId: string, subjectId: string, type: string, fileIds?: string[]) {
    const fileIdsKey = this.getFileIdsKey(fileIds);
    return this.aiCacheModel.findOne({
      userId: new Types.ObjectId(userId),
      subjectId: new Types.ObjectId(subjectId),
      type,
      fileIdsKey,
    }).exec();
  }

  async generateSummary(userId: string, dto: GenerateAiContentDto) {
    const fileIdsKey = this.getFileIdsKey(dto.fileIds);

    if (!dto.forceRefresh) {
      const cached = await this.getCachedContent(userId, dto.subjectId, 'summary', dto.fileIds);
      // Only use cache if it has valid non-empty data
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

    const rawResponse = await this.openRouterService.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.3,
      3000,
    );

    const summaryData = await this.openRouterService.parseJsonResponse<any>(rawResponse);

    await this.aiCacheModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(dto.subjectId),
        type: 'summary',
        fileIdsKey,
      },
      { data: summaryData },
      { upsert: true, new: true },
    );

    await this.activitiesService.logActivity(userId, 'summary', `Generated AI summary for ${subject?.name || 'subject'}`);

    return summaryData;
  }

  async chat(userId: string, dto: ChatAiDto) {
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

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
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

  async generateFlashcards(userId: string, dto: GenerateAiContentDto) {
    const fileIdsKey = this.getFileIdsKey(dto.fileIds);

    if (!dto.forceRefresh) {
      const cached = await this.getCachedContent(userId, dto.subjectId, 'flashcards', dto.fileIds);
      // Only use cache if it has valid non-empty array data
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return cached.data;
      }
    }

    const materials = await this.getSelectedMaterials(userId, dto.subjectId, dto.fileIds);
    const subject = await this.subjectModel.findById(dto.subjectId);
    const documentText = await this.textExtractorService.extractTextFromMaterials(materials);
    const fileNames = materials.map((m) => m.name).join(', ');

    // Dynamically scale flashcard count based on document length
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

    const rawResponse = await this.openRouterService.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.5,
      4096,
    );

    const flashcardsData = await this.openRouterService.parseJsonResponse<any[]>(rawResponse);

    await this.aiCacheModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(dto.subjectId),
        type: 'flashcards',
        fileIdsKey,
      },
      { data: flashcardsData },
      { upsert: true, new: true },
    );

    await this.activitiesService.logActivity(userId, 'flashcard', `Generated ${cardCount} flashcards for ${subject?.name || 'subject'}`);

    return flashcardsData;
  }

  async generateQuiz(userId: string, dto: GenerateAiContentDto) {
    const fileIdsKey = this.getFileIdsKey(dto.fileIds);
    const count = Math.min(Math.max(dto.questionCount || 10, 1), 25);
    const randomSeed = Math.random().toString(36).substring(2, 9);
    // Always force fresh generation (no quiz caching) to ensure randomness
    const mcqCount = Math.ceil(count * 0.75);  // 75% MCQ
    const tfCount = count - mcqCount;           // 25% True/False

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

    const rawResponse = await this.openRouterService.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.8,
      4096,
    );

    const quizData = await this.openRouterService.parseJsonResponse<any[]>(rawResponse);

    // Save latest attempt to cache (but quiz always regenerates fresh)
    await this.aiCacheModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(dto.subjectId),
        type: 'quiz',
        fileIdsKey,
      },
      { data: quizData },
      { upsert: true, new: true },
    );

    await this.activitiesService.logActivity(userId, 'quiz', `Generated ${count}-question quiz for ${subject?.name || 'subject'}`);

    return quizData;
  }

  async saveQuizScore(userId: string, dto: SubmitQuizScoreDto) {
    const userObjectId = new Types.ObjectId(userId);
    const subjectObjectId = new Types.ObjectId(dto.subjectId);

    const attempt = new this.quizAttemptModel({
      userId: userObjectId,
      subjectId: subjectObjectId,
      score: dto.score,
      correctCount: dto.correctCount,
      totalQuestions: dto.totalQuestions,
    });

    const saved = await attempt.save();

    const subject = await this.subjectModel.findById(dto.subjectId);
    await this.activitiesService.logActivity(
      userId,
      'quiz',
      `Completed quiz on ${subject?.name || 'subject'} — Score: ${dto.score}%`,
    );

    return saved;
  }

  async getAverageQuizScore(userId: string): Promise<number> {
    const attempts = await this.quizAttemptModel.find({ userId: new Types.ObjectId(userId) }).exec();
    if (!attempts || attempts.length === 0) return 0;
    const total = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round(total / attempts.length);
  }

  // --- Multi-Session ChatGPT Chat Methods ---

  async createChatSession(userId: string, dto: CreateChatSessionDto) {
    const userObjectId = new Types.ObjectId(userId);
    const subjectObjectId = dto.subjectId ? new Types.ObjectId(dto.subjectId) : undefined;
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

  async getChatSessions(userId: string, subjectId?: string) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (subjectId) {
      filter.subjectId = new Types.ObjectId(subjectId);
    }
    return this.chatSessionModel.find(filter).sort({ updatedAt: -1 }).exec();
  }

  async getChatSessionById(userId: string, sessionId: string) {
    const session = await this.chatSessionModel
      .findOne({ _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) })
      .exec();
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  async sendMessageToSession(userId: string, sessionId: string, dto: SendSessionMessageDto) {
    const session = await this.getChatSessionById(userId, sessionId);

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: dto.message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    session.messages.push(userMsg);

    // Auto-update session title if default
    if (session.title === 'New Conversation' && session.messages.length === 1) {
      session.title = dto.message.length > 36 ? `${dto.message.slice(0, 36)}...` : dto.message;
    }

    // Build grounding document text from selected materials
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
   - Relevant follow-up question 2?${
      documentContext ? `\n\nStudy Material Context:\n${documentContext.slice(0, 8000)}` : ''
    }`;

    const conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...session.messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
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

  async renameChatSession(userId: string, sessionId: string, dto: RenameChatSessionDto) {
    const updated = await this.chatSessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) },
        { $set: { title: dto.title } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Chat session not found');
    }
    return updated;
  }

  async deleteChatSession(userId: string, sessionId: string) {
    const res = await this.chatSessionModel
      .deleteOne({ _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) })
      .exec();

    if (res.deletedCount === 0) {
      throw new NotFoundException('Chat session not found');
    }

    return { message: 'Chat session deleted successfully' };
  }

  // --- General Chatbot Session Methods ---

  async getGeneralChatSession(userId: string) {
    let session = await this.generalChatSessionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!session) {
      session = await this.generalChatSessionModel.create({
        userId: new Types.ObjectId(userId),
        title: 'StudyAI Assistant Chat',
        messages: [],
      });
    }

    return session;
  }

  async sendGeneralChatMessage(userId: string, dto: SendGeneralChatMessageDto) {
    const session = await this.getGeneralChatSession(userId);

    const userMsgId = `usr-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const userMessage = {
      id: userMsgId,
      role: 'user',
      text: dto.message,
      timestamp: nowIso,
    };

    // Construct conversation history context
    const conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
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

    // Take last 6 messages from history and trim long turns for low latency
    const pastMessages = session.messages.slice(-6);
    for (const msg of pastMessages) {
      conversationHistory.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text.length > 600 ? msg.text.slice(0, 600) + '...' : msg.text,
      });
    }

    // Add current user prompt
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

  async clearGeneralChatSession(userId: string) {
    const session = await this.getGeneralChatSession(userId);
    session.messages = [];
    await session.save();
    return { message: 'General chat history cleared successfully', messages: [] };
  }
}
