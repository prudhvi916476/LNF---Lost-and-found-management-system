import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Match, LostItem, FoundItem } from '../../database/entities/all-entities';
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

    return { matches, total };
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
