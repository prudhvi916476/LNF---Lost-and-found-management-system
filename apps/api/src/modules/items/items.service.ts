import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LostItem, FoundItem, ItemImage, Match, Claim, CustomVerificationQuestion } from '../../database/entities/all-entities';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(LostItem)
    private readonly lostItemRepo: Repository<LostItem>,
    @InjectRepository(FoundItem)
    private readonly foundItemRepo: Repository<FoundItem>,
    @InjectRepository(ItemImage)
    private readonly imageRepo: Repository<ItemImage>,
    @InjectRepository(CustomVerificationQuestion)
    private readonly customQuestionRepo: Repository<CustomVerificationQuestion>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Lost Items ─────────────────────────────────────────

  async createLostItem(userId: string, data: any): Promise<LostItem> {
    const { imageUrls, ...itemData } = data;
    const item = this.lostItemRepo.create({
      ...itemData,
      userId,
      status: 'active',
    });
    const savedItem = await this.lostItemRepo.save(item as any) as LostItem;

    if (imageUrls && imageUrls.length > 0) {
      await this.addItemImages(savedItem.id, 'lost', imageUrls);
    }

    return this.getLostItemById(savedItem.id);
  }

  async getLostItemById(id: string): Promise<LostItem> {
    const item = await this.lostItemRepo.findOne({
      where: { id },
      relations: ['images', 'user'],
    });
    if (!item) throw new NotFoundException('Lost item not found');
    return item;
  }

  async getUserLostItems(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ items: LostItem[]; total: number }> {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;

    const [items, total] = await this.lostItemRepo.findAndCount({
      where: { userId },
      relations: ['images'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total };
  }

  async getAllLostItems(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ items: LostItem[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;

    const p = Number(page) || 1;
    const l = Number(limit) || 20;

    const [items, total] = await this.lostItemRepo.findAndCount({
      where,
      relations: ['images', 'user'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total };
  }

  async updateLostItem(id: string, userId: string, data: Partial<LostItem>): Promise<LostItem> {
    const item = await this.getLostItemById(id);
    if (item.userId !== userId) throw new ForbiddenException('Not authorized');
    await this.lostItemRepo.update(id, data as any);
    return this.getLostItemById(id);
  }

  async updateLostItemStatus(id: string, status: string): Promise<void> {
    await this.lostItemRepo.update(id, { status });
  }

  async deleteLostItem(id: string, userId: string): Promise<void> {
    const item = await this.getLostItemById(id);
    if (item.userId !== userId) throw new ForbiddenException('Not authorized');
    
    // Manually delete related entities to avoid SQLite foreign key constraint issues
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Claim, { lostItemId: id });
      await manager.delete(Match, { lostItemId: id });
      await manager.delete(ItemImage, { lostItemId: id });
      await manager.delete(LostItem, { id });
    });
  }

  // ─── Found Items ────────────────────────────────────────

  async createFoundItem(userId: string, data: any): Promise<FoundItem> {
    const { imageUrls, customQuestions, ...itemData } = data;
    const item = this.foundItemRepo.create({
      ...itemData,
      userId,
      status: 'awaiting_match',
    });
    const savedItem = await this.foundItemRepo.save(item as any) as FoundItem;

    if (imageUrls && imageUrls.length > 0) {
      await this.addItemImages(savedItem.id, 'found', imageUrls);
    }

    // Save custom verification questions (0-5) set by the finder
    if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
      const questions = customQuestions.slice(0, 5).map((text: string, index: number) =>
        this.customQuestionRepo.create({
          foundItemId: savedItem.id,
          createdById: userId,
          questionText: text,
          sortOrder: index,
        }),
      );
      await this.customQuestionRepo.save(questions);
    }

    return this.getFoundItemById(savedItem.id);
  }

  async getFoundItemById(id: string): Promise<FoundItem> {
    const item = await this.foundItemRepo.findOne({
      where: { id },
      relations: ['images', 'user'],
    });
    if (!item) throw new NotFoundException('Found item not found');
    return item;
  }

  async getUserFoundItems(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ items: FoundItem[]; total: number }> {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;

    const [items, total] = await this.foundItemRepo.findAndCount({
      where: { userId },
      relations: ['images'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total };
  }

  async getAllFoundItems(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ items: FoundItem[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;

    const p = Number(page) || 1;
    const l = Number(limit) || 20;

    const [items, total] = await this.foundItemRepo.findAndCount({
      where,
      relations: ['images', 'user'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total };
  }

  async updateFoundItem(id: string, userId: string, data: Partial<FoundItem>): Promise<FoundItem> {
    const item = await this.getFoundItemById(id);
    if (item.userId !== userId) throw new ForbiddenException('Not authorized');
    await this.foundItemRepo.update(id, data as any);
    return this.getFoundItemById(id);
  }

  async updateFoundItemStatus(id: string, status: string): Promise<void> {
    await this.foundItemRepo.update(id, { status });
  }

  // ─── Images ─────────────────────────────────────────────

  async addItemImages(
    itemId: string,
    itemType: 'lost' | 'found',
    imageUrls: string[],
  ): Promise<ItemImage[]> {
    const images = imageUrls.map((url, index) =>
      this.imageRepo.create({
        url,
        sortOrder: index,
        ...(itemType === 'lost' ? { lostItemId: itemId } : { foundItemId: itemId }),
      }),
    );
    return this.imageRepo.save(images);
  }

  async removeItemImage(imageId: string): Promise<void> {
    await this.imageRepo.delete(imageId);
  }

  // ─── Stats ──────────────────────────────────────────────

  async getDashboardStats(userId: string) {
    const [activeLost, activeFound, recovered] = await Promise.all([
      this.lostItemRepo.count({ where: { userId, status: 'active' } }),
      this.foundItemRepo.count({ where: { userId, status: 'awaiting_match' } }),
      this.lostItemRepo.count({ where: { userId, status: 'recovered' } }),
    ]);

    return {
      activeLostItems: activeLost,
      activeFoundItems: activeFound,
      potentialMatches: 0,
      recoveredItems: recovered,
    };
  }

  async getGlobalStats() {
    const [totalLost, totalFound, activeItems, recovered] = await Promise.all([
      this.lostItemRepo.count(),
      this.foundItemRepo.count(),
      this.lostItemRepo.count({ where: { status: 'active' } }),
      this.lostItemRepo.count({ where: { status: 'recovered' } }),
    ]);

    return { totalLost, totalFound, activeItems, recovered };
  }
}
