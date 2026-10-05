import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message } from '../../database/entities/all-entities';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async getOrCreateConversation(userId1: string, userId2: string, matchId?: string): Promise<Conversation> {
    let conversation = await this.conversationRepo
      .createQueryBuilder('c')
      .where('(c.participant1Id = :u1 AND c.participant2Id = :u2) OR (c.participant1Id = :u2 AND c.participant2Id = :u1)', { u1: userId1, u2: userId2 })
      .getOne();

    if (!conversation) {
      conversation = this.conversationRepo.create({
        participant1Id: userId1,
        participant2Id: userId2,
        relatedMatchId: matchId,
      });
      conversation = await this.conversationRepo.save(conversation);
    }
    return conversation;
  }

  async getUserConversations(userId: string) {
    return this.conversationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participant1', 'p1')
      .leftJoinAndSelect('c.participant2', 'p2')
      .where('c.participant1Id = :userId OR c.participant2Id = :userId', { userId })
      .andWhere('c.isActive = true')
      .orderBy('c.updatedAt', 'DESC')
      .getMany();
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const p = Number(page) || 1;
    const l = Number(limit) || 50;
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { messages: messages.reverse(), total };
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type = 'text', fileUrl?: string): Promise<Message> {
    const message = this.messageRepo.create({ conversationId, senderId, content, type, fileUrl });
    const saved = await this.messageRepo.save(message);
    await this.conversationRepo.update(conversationId, { updatedAt: new Date() });
    return saved;
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :conversationId AND senderId != :userId AND isRead = false', { conversationId, userId })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .where('(c.participant1Id = :userId OR c.participant2Id = :userId)', { userId })
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.isRead = false')
      .getCount();
  }
}
