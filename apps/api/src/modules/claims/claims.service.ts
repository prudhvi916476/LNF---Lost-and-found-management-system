import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim, ClaimEvidence } from '../../database/entities/all-entities';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepo: Repository<Claim>,
    @InjectRepository(ClaimEvidence)
    private readonly evidenceRepo: Repository<ClaimEvidence>,
  ) {}

  async createClaim(data: Partial<Claim>): Promise<Claim> {
    const claim = this.claimRepo.create(data);
    return this.claimRepo.save(claim);
  }

  async getClaimById(id: string): Promise<Claim> {
    const claim = await this.claimRepo.findOne({
      where: { id },
      relations: ['evidence', 'lostItem', 'claimant'],
    });
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }

  async getUserClaims(userId: string, page = 1, limit = 20) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const [claims, total] = await this.claimRepo.findAndCount({
      where: { claimantId: userId },
      relations: ['lostItem', 'evidence'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { claims, total };
  }

  async updateClaimStatus(id: string, status: string, reviewedBy?: string, reviewNotes?: string) {
    await this.claimRepo.update(id, { status, reviewedBy, reviewNotes });
    return this.getClaimById(id);
  }

  async addEvidence(claimId: string, type: string, fileUrl: string, description?: string) {
    const evidence = this.evidenceRepo.create({ claimId, type, fileUrl, description });
    return this.evidenceRepo.save(evidence);
  }
}
