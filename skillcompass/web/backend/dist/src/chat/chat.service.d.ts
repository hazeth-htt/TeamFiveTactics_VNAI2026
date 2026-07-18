export declare class ChatService {
    handleMessage(sessionId: string, message: string): Promise<{
        reply: string;
    }>;
}
