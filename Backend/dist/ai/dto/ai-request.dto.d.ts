export declare class GenerateAiContentDto {
    subjectId: string;
    fileIds?: string[];
    forceRefresh?: boolean;
    questionCount?: number;
}
export declare class ChatAiDto {
    subjectId: string;
    fileIds?: string[];
    message: string;
    history?: Array<{
        role: string;
        text: string;
    }>;
}
export declare class SubmitQuizScoreDto {
    subjectId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
}
