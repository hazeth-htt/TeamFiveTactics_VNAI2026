export declare class ChatService {
    private readonly logger;
    private readonly prisma;
    private readonly counselorUrl;
    constructor();
    handleMessage(sessionId: string, message: string): Promise<{
        reply: string;
        is_ready: boolean;
    }>;
}
