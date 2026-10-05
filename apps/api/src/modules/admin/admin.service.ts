import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, LostItem, FoundItem, Organization } from '../../database/entities/all-entities';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(LostItem) private readonly lostRepo: Repository<LostItem>,
    @InjectRepository(FoundItem) private readonly foundRepo: Repository<FoundItem>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
  ) {}

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const qb = this.userRepo.createQueryBuilder('user').orderBy('user.createdAt', 'DESC');
    if (search) {
      qb.where('LOWER(user.fullName) LIKE LOWER(:s) OR LOWER(user.email) LIKE LOWER(:s)', { s: `%${search}%` });
    }
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const [users, total] = await qb.skip((p - 1) * l).take(l).getManyAndCount();
    return { users, total };
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    await this.userRepo.update(userId, { isActive });
  }

  async updateUserRole(userId: string, role: string) {
    await this.userRepo.update(userId, { role });
  }

  async deleteUser(userId: string) {
    await this.userRepo.delete(userId);
  }

  async getPlatformStats() {
    const [users, lost, found, orgs] = await Promise.all([
      this.userRepo.count(),
      this.lostRepo.count(),
      this.foundRepo.count(),
      this.orgRepo.count(),
    ]);
    return { totalUsers: users, totalLostItems: lost, totalFoundItems: found, totalOrganizations: orgs };
  }
}
