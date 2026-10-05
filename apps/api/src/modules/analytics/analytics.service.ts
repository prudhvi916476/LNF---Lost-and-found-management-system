import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LostItem, FoundItem, User, Match, Claim } from '../../database/entities/all-entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LostItem) private readonly lostRepo: Repository<LostItem>,
    @InjectRepository(FoundItem) private readonly foundRepo: Repository<FoundItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Claim) private readonly claimRepo: Repository<Claim>,
  ) {}

  async getOverview() {
    const [totalLost, totalFound, totalUsers, totalMatches, totalClaims, recovered, activeUsers] =
      await Promise.all([
        this.lostRepo.count(),
        this.foundRepo.count(),
        this.userRepo.count(),
        this.matchRepo.count(),
        this.claimRepo.count(),
        this.lostRepo.count({ where: { status: 'recovered' } }),
        this.userRepo.count({ where: { isActive: true } }),
      ]);

    const recoveryRate = totalLost > 0 ? ((recovered / totalLost) * 100).toFixed(1) : '0';

    return {
      totalLostItems: totalLost,
      totalFoundItems: totalFound,
      totalUsers,
      activeUsers,
      totalMatches,
      totalClaims,
      recoveredItems: recovered,
      recoveryRate: parseFloat(recoveryRate),
      activeCases: totalLost - recovered,
    };
  }

  async getCategoryBreakdown() {
    const result = await this.lostRepo
      .createQueryBuilder('item')
      .select('item.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('item.category')
      .orderBy('count', 'DESC')
      .getRawMany();
    return result;
  }

  async getTimeSeriesData(days = 30) {
    const d = Number(days) || 30;
    const result = await this.lostRepo
      .createQueryBuilder('item')
      .select("DATE(item.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where("item.createdAt >= datetime('now', '-' || :days || ' days')", { days: d })
      .groupBy("DATE(item.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();
    return result;
  }

  async getLocationHeatmap() {
    const lostLocations = await this.lostRepo
      .createQueryBuilder('item')
      .select(['item.locationLat', 'item.locationLng', 'item.city'])
      .where('item.locationLat IS NOT NULL')
      .getMany();

    return lostLocations.map((item) => ({
      lat: item.locationLat,
      lng: item.locationLng,
      city: item.city,
      weight: 1,
    }));
  }

  async getTopContributors(limit = 10) {
    const l = Number(limit) || 10;
    return this.userRepo.find({
      select: ['id', 'fullName', 'avatarUrl', 'reputationPoints'],
      order: { reputationPoints: 'DESC' },
      take: l,
    });
  }
}
