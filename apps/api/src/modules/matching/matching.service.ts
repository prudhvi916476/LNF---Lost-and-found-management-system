import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Match, LostItem, FoundItem, ItemImage } from '../../database/entities/all-entities';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(LostItem)
    private readonly lostItemRepo: Repository<LostItem>,
    @InjectRepository(FoundItem)
    private readonly foundItemRepo: Repository<FoundItem>,
    @InjectRepository(ItemImage)
    private readonly imageRepo: Repository<ItemImage>,
    private readonly configService: ConfigService,
  ) {}

  async findMatchesForLostItem(lostItemId: string): Promise<Match[]> {
    const lostItem = await this.lostItemRepo.findOne({ where: { id: lostItemId } });
    if (!lostItem) return [];

    const foundItems = await this.foundItemRepo.find({
      where: { status: 'awaiting_match' },
    });

    const matches: Match[] = [];

    for (const foundItem of foundItems) {
      const score = this.calculateMatchScore(lostItem, foundItem);
      if (score >= 30) {
        const existing = await this.matchRepo.findOne({
          where: { lostItemId: lostItem.id, foundItemId: foundItem.id },
        });
        if (!existing) {
          const match = this.matchRepo.create({
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
            matchScore: score,
            confidence: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
            scoreBreakdown: this.getScoreBreakdown(lostItem, foundItem),
          });
          matches.push(await this.matchRepo.save(match));
        }
      }
    }

    return matches;
  }

  async findMatchesForFoundItem(foundItemId: string): Promise<Match[]> {
    const foundItem = await this.foundItemRepo.findOne({ where: { id: foundItemId } });
    if (!foundItem) return [];

    const lostItems = await this.lostItemRepo.find({
      where: { status: 'active' },
    });

    const matches: Match[] = [];

    for (const lostItem of lostItems) {
      const score = this.calculateMatchScore(lostItem, foundItem);
      if (score >= 30) {
        const existing = await this.matchRepo.findOne({
          where: { lostItemId: lostItem.id, foundItemId: foundItem.id },
        });
        if (!existing) {
          const match = this.matchRepo.create({
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
            matchScore: score,
            confidence: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
            scoreBreakdown: this.getScoreBreakdown(lostItem, foundItem),
          });
          matches.push(await this.matchRepo.save(match));
        }
      }
    }

    return matches;
  }

  async runScanForUser(userId: string): Promise<{ matches: Match[]; total: number }> {
    const userLost = await this.lostItemRepo.find({ where: { userId, status: 'active' } });
    for (const item of userLost) {
      await this.findMatchesForLostItem(item.id);
    }
    const userFound = await this.foundItemRepo.find({ where: { userId, status: 'awaiting_match' } });
    for (const item of userFound) {
      await this.findMatchesForFoundItem(item.id);
    }
    return this.getMatchesForUser(userId);
  }

  async createDemoMatchForUser(userId: string): Promise<Match> {
    // 1. Get user's most recent lost item, or create one if user has none
    let lostItem = await this.lostItemRepo.findOne({
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    });

    if (!lostItem) {
      lostItem = this.lostItemRepo.create({
        userId,
        itemName: 'Apple iPhone 13',
        category: 'Phone',
        brand: 'Apple',
        color: 'Black',
        description: 'Black Apple iPhone 13 with protective bumper case.',
        city: 'Campus Library',
        status: 'active',
      });
      lostItem = await this.lostItemRepo.save(lostItem);
    }

    // 2. Create matching found item
    const endpoint = this.configService.get('API_URL', 'http://localhost:3001');
    const demoFound = this.foundItemRepo.create({
      userId: '00000000-0000-0000-0000-000000000000',
      itemName: `${lostItem.brand || 'Apple'} ${lostItem.itemName}`,
      category: lostItem.category || 'Phone',
      brand: lostItem.brand || 'Apple',
      color: lostItem.color || 'Black',
      description: `Turned in a ${lostItem.color || 'black'} ${lostItem.itemName} left on a library study table. Turned over to security staff.`,
      city: lostItem.city || 'Campus Library',
      status: 'awaiting_match',
      storage: 'org_desk',
      storageDetails: 'Library front reception desk',
    });
    const savedFound = await this.foundItemRepo.save(demoFound);

    // 3. Attach negative preview image
    const previewFilename = '2aae3927-7e22-4617-98bc-7d318f24bc77_Screenshot 2026-09-07 211326_preview.jpg';
    const previewUrl = `${endpoint}/api/uploads/previews/${previewFilename}`;
    const image = this.imageRepo.create({
      foundItemId: savedFound.id,
      url: previewUrl,
      previewUrl: previewUrl,
      isPrivate: true,
      sortOrder: 0,
    });
    await this.imageRepo.save(image);

    // 4. Save and return high-confidence match
    const match = this.matchRepo.create({
      lostItemId: lostItem.id,
      foundItemId: savedFound.id,
      matchScore: 92,
      confidence: 'high',
      scoreBreakdown: {
        textScore: 95,
        locationScore: 90,
        timeScore: 92,
        imageScore: 88,
      },
    });
    return this.matchRepo.save(match);
  }

  async getMatchesForUser(userId: string, page = 1, limit = 20) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const [matches, total] = await this.matchRepo
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.lostItem', 'lostItem')
      .leftJoinAndSelect('lostItem.images', 'lostImages')
      .leftJoinAndSelect('match.foundItem', 'foundItem')
      .leftJoinAndSelect('foundItem.images', 'foundImages')
      .where('lostItem.userId = :userId OR foundItem.userId = :userId', { userId })
      .andWhere('match.isDismissed = false')
      .andWhere('match.isConfirmed = false')
      .orderBy('match.matchScore', 'DESC')
      .skip((p - 1) * l)
      .take(l)
      .getManyAndCount();

    const parsedMatches = matches.map((m) => {
      let breakdown = m.scoreBreakdown;
      if (typeof breakdown === 'string') {
        try {
          breakdown = JSON.parse(breakdown);
        } catch {
          breakdown = {};
        }
      }
      const scoreNum = Math.round(Number(m.matchScore) || 0);
      return {
        ...m,
        matchScore: scoreNum,
        scoreBreakdown: {
          textScore: breakdown?.textScore ?? Math.min(100, Math.round(scoreNum * 0.95)),
          locationScore: breakdown?.locationScore ?? Math.min(100, Math.round(scoreNum * 0.9)),
          timeScore: breakdown?.timeScore ?? 80,
          imageScore: breakdown?.imageScore ?? 85,
        },
      };
    });

    return { matches: parsedMatches, total };
  }

  async dismissMatch(matchId: string): Promise<void> {
    await this.matchRepo.update(matchId, { isDismissed: true });
  }

  async confirmMatch(matchId: string): Promise<void> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (match) {
      await this.matchRepo.update(matchId, { isConfirmed: true });
      await this.lostItemRepo.update(match.lostItemId, { status: 'matched' });
      await this.foundItemRepo.update(match.foundItemId, { status: 'matched' });
    }
  }

  private calculateMatchScore(lost: LostItem, found: FoundItem): number {
    let score = 0;
    let weights = 0;

    // Category match (30% weight)
    if (lost.category && found.category) {
      if (lost.category.toLowerCase() === found.category.toLowerCase()) {
        score += 30;
      }
      weights += 30;
    }

    // Text similarity (25% weight)
    const textScore = this.textSimilarity(
      `${lost.itemName} ${lost.description} ${lost.brand || ''}`,
      `${found.itemName} ${found.description} ${found.brand || ''}`,
    );
    score += textScore * 25;
    weights += 25;

    // Color match (15% weight)
    if (lost.color && found.color) {
      if (lost.color.toLowerCase() === found.color.toLowerCase()) {
        score += 15;
      }
      weights += 15;
    }

    // Brand match (15% weight)
    if (lost.brand && found.brand) {
      if (lost.brand.toLowerCase() === found.brand.toLowerCase()) {
        score += 15;
      } else if (
        lost.brand.toLowerCase().includes(found.brand.toLowerCase()) ||
        found.brand.toLowerCase().includes(lost.brand.toLowerCase())
      ) {
        score += 10;
      }
      weights += 15;
    }

    // Location proximity (15% weight)
    if (lost.locationLat && lost.locationLng && found.locationLat && found.locationLng) {
      const distance = this.haversineDistance(
        lost.locationLat, lost.locationLng,
        found.locationLat, found.locationLng,
      );
      if (distance < 1) score += 15;
      else if (distance < 5) score += 10;
      else if (distance < 10) score += 5;
      weights += 15;
    }

    return weights > 0 ? Math.round((score / weights) * 100) : 0;
  }

  private getScoreBreakdown(lost: LostItem, found: FoundItem) {
    return {
      textScore: Math.round(
        this.textSimilarity(
          `${lost.itemName} ${lost.description}`,
          `${found.itemName} ${found.description}`,
        ) * 100,
      ),
      locationScore: lost.locationLat && found.locationLat
        ? Math.round(Math.max(0, 100 - this.haversineDistance(
            lost.locationLat, lost.locationLng,
            found.locationLat, found.locationLng,
          ) * 10))
        : 0,
      timeScore: 0,
      imageScore: 0,
    };
  }

  private textSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(Boolean);
    const words2 = text2.toLowerCase().split(/\s+/).filter(Boolean);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter((w) => set2.has(w)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async runBatchMatching() {
    this.logger.log('Running batch matching...');
    const recentLost = await this.lostItemRepo.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    for (const item of recentLost) {
      await this.findMatchesForLostItem(item.id);
    }
    this.logger.log(`Batch matching complete. Processed ${recentLost.length} items.`);
  }
}
