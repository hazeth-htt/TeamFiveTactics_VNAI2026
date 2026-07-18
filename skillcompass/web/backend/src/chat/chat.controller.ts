import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body() body: { session_id: string; message: string },
  ) {
    return this.chatService.handleMessage(body.session_id, body.message);
  }
}
