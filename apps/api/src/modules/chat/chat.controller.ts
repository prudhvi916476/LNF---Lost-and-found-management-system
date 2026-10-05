import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  async getConversations(@Req() req: any) {
    const conversations = await this.chatService.getUserConversations(req.user.sub);
    return { success: true, data: conversations };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation' })
  async createConversation(@Req() req: any, @Body() body: { userId: string; matchId?: string }) {
    const conversation = await this.chatService.getOrCreateConversation(req.user.sub, body.userId, body.matchId);
    return { success: true, data: conversation };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  async getMessages(@Param('id') id: string, @Query('page') page?: number) {
    const result = await this.chatService.getMessages(id, page);
    return { success: true, data: result.messages, meta: { total: result.total } };
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.chatService.getUnreadCount(req.user.sub);
    return { success: true, data: { count } };
  }
}
