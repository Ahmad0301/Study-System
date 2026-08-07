import { apiFetch } from "./subjectService";

export interface GenerateAiContentParams {
  subjectId: string;
  fileIds?: string[];
  forceRefresh?: boolean;
  questionCount?: number;
}

export interface ChatAiParams {
  subjectId: string;
  fileIds?: string[];
  message: string;
  history?: Array<{ role: string; text: string }>;
}

export interface SubmitQuizScoreParams {
  subjectId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export interface CreateChatSessionParams {
  subjectId?: string;
  fileIds?: string[];
  title?: string;
  initialMessage?: string;
}

export const aiService = {
  async generateSummary(params: GenerateAiContentParams) {
    const { subjectId, fileIds = [], forceRefresh = false } = params;
    return apiFetch("/ai/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, fileIds, forceRefresh }),
    });
  },

  async chat(params: ChatAiParams) {
    const { subjectId, fileIds = [], message, history = [] } = params;
    return apiFetch("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, fileIds, message, history }),
    });
  },

  async generateFlashcards(params: GenerateAiContentParams) {
    const { subjectId, fileIds = [], forceRefresh = false } = params;
    return apiFetch("/ai/generate-flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, fileIds, forceRefresh }),
    });
  },

  async generateQuiz(params: GenerateAiContentParams) {
    const { subjectId, fileIds = [], forceRefresh = false, questionCount } = params;
    return apiFetch("/ai/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, fileIds, forceRefresh, questionCount }),
    });
  },

  async submitQuizScore(params: SubmitQuizScoreParams) {
    return apiFetch("/ai/quiz-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  // --- Multi-Session Chat Session Endpoints ---

  async createChatSession(params: CreateChatSessionParams) {
    return apiFetch("/ai/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  async getChatSessions(subjectId?: string) {
    const param = subjectId ? `?subjectId=${subjectId}` : "";
    return apiFetch(`/ai/chat-sessions${param}`);
  },

  async getChatSession(sessionId: string) {
    return apiFetch(`/ai/chat-sessions/${sessionId}`);
  },

  async sendSessionMessage(sessionId: string, message: string) {
    return apiFetch(`/ai/chat-sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  },

  async renameChatSession(sessionId: string, title: string) {
    return apiFetch(`/ai/chat-sessions/${sessionId}/title`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  },

  async deleteChatSession(sessionId: string) {
    return apiFetch(`/ai/chat-sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async getCache(params: { subjectId: string; type: string; fileIds?: string[] }) {
    const { subjectId, type, fileIds = [] } = params;
    try {
      const fileIdsParam = fileIds.length > 0 ? `?fileIds=${fileIds.join(",")}` : "";
      return await apiFetch(`/ai/cache/${subjectId}/${type}${fileIdsParam}`);
    } catch (_) {
      return null;
    }
  },
};
