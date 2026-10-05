import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'phone' | 'avatarUrl' | 'preferences'>>,
  ): Promise<User> {
    await this.userRepository.update(id, data as any);
    return this.findById(id);
  }

  async getLeaderboard(limit = 20): Promise<User[]> {
    const l = Number(limit) || 20;
    return this.userRepository.find({
      order: { reputationPoints: 'DESC' },
      take: l,
      select: ['id', 'fullName', 'avatarUrl', 'reputationPoints'],
    });
  }

  async addReputationPoints(userId: string, points: number): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'reputationPoints', points);
  }

  async findAll(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const [users, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { users, total };
  }

  async deactivateUser(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }

  async activateUser(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
  }
}
