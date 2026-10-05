import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../database/entities/all-entities';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async create(data: Partial<Organization>): Promise<Organization> {
    const existing = await this.orgRepo.findOne({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Organization slug already exists');
    const org = this.orgRepo.create(data);
    return this.orgRepo.save(org);
  }

  async findAll(page = 1, limit = 20) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const [orgs, total] = await this.orgRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { organizations: orgs, total };
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    await this.orgRepo.update(id, data as any);
    return this.findById(id);
  }
}
