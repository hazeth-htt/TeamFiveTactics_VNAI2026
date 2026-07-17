import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  async handleMessage(sessionId: string, message: string): Promise<{ reply: string }> {
    return {
      reply: `Mock response for message "${message}" in session ${sessionId}`,
    };
  }
}
