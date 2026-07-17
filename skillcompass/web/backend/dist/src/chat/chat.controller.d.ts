import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(body: {
        session_id: string;
        message: string;
    }): Promise<{
        reply: string;
    }>;
}
