import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBadge, User } from '../../database/entities/all-entities';

export const REPUTATION_POINTS = {
  REPORT_FOUND: 10,
  SUCCESSFUL_RETURN: 50,
  VERIFIED_RECOVERY: 100,
  FIRST_REPORT: 5,
};

export const BADGES = [
  { name: 'Trusted Finder', icon: '🏅', requiredPoints: 100 },
  { name: 'Recovery Champion', icon: '🏆', requiredPoints: 500 },
  { name: 'Community Hero', icon: '🦸', requiredPoints: 1000 },
  { name: 'Verified Member', icon: '✅', requiredPoints: 0 },
  { name: 'First Find', icon: '🔍', requiredPoints: 0 },
];

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(UserBadge)
    private readonly badgeRepo: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async awardPoints(userId: string, action: keyof typeof REPUTATION_POINTS): Promise<number> {
    const points = REPUTATION_POINTS[action];
    await this.userRepo.increment({ id: userId }, 'reputationPoints', points);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    await this.checkAndAwardBadges(userId, user?.reputationPoints || 0);
    return points;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.badgeRepo.find({ where: { userId }, order: { earnedAt: 'DESC' } });
  }

  async getLeaderboard(limit = 20, organizationId?: string) {
    const l = Number(limit) || 20;
    const qb = this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.fullName', 'user.avatarUrl', 'user.reputationPoints'])
      .orderBy('user.reputationPoints', 'DESC')
      .take(l);

    if (organizationId) {
      qb.where('user.organizationId = :orgId', { orgId: organizationId });
    }

    const users = await qb.getMany();
    return users.map((u, i) => ({ ...u, rank: i + 1 }));
  }

  private async checkAndAwardBadges(userId: string, totalPoints: number): Promise<void> {
    const existingBadges = await this.badgeRepo.find({ where: { userId } });
    const existingNames = new Set(existingBadges.map((b) => b.badgeName));

    for (const badge of BADGES) {
      if (badge.requiredPoints > 0 && totalPoints >= badge.requiredPoints && !existingNames.has(badge.name)) {
        await this.badgeRepo.save(
          this.badgeRepo.create({ userId, badgeName: badge.name, badgeIcon: badge.icon }),
        );
      }
    }
  }
}
