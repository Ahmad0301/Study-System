export declare class CreateChatSessionDto {
    subjectId?: string;
    fileIds?: string[];
    title?: string;
    initialMessage?: string;
}
export declare class SendSessionMessageDto {
    message: string;
}
export declare class RenameChatSessionDto {
    title: string;
}
