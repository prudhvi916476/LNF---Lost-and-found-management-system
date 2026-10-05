import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FoundItemClaim,
  CustomVerificationQuestion,
  FoundItem,
  User,
  Notification,
} from '../../database/entities/all-entities';

/** Fixed mandatory question definitions (label shown to users) */
export const MANDATORY_QUESTIONS: { id: string; label: string; hint: string }[] = [
  {
    id: 'location',
    label: 'Where exactly did you lose this item?',
    hint: 'Building name, bus stop, classroom, office, park…',
  },
  {
    id: 'time',
    label: 'Approximately when did you lose it?',
    hint: 'Date, time of day, morning, evening…',
  },
  {
    id: 'description',
    label: 'Describe the item in detail.',
    hint: 'Color, material, brand, size, shape, condition…',
  },
  {
    id: 'features',
    label: 'What distinguishing features does your item have?',
    hint: 'Scratch, sticker, dent, engraving, keychain, broken corner…',
  },
  {
    id: 'contents',
    label: 'If applicable, what was inside the item?',
    hint: 'Cards, cash, documents, charger, books, USB…',
  },
  {
    id: 'ownership_proof',
    label: 'Explain why you believe this item belongs to you.',
    hint: 'How did you acquire it? Any proof of purchase?',
  },
  {
    id: 'last_usage',
    label: 'When was the last time you used this item?',
    hint: 'Date and context of last use…',
  },
  {
    id: 'additional_details',
    label: 'Mention anything only the true owner would know.',
    hint: 'Specific markings, passwords, content, sentimental details…',
  },
];

const MAX_ATTEMPTS = 3;
const MAX_CUSTOM_QUESTIONS = 5;

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(FoundItemClaim)
    private readonly claimRepo: Repository<FoundItemClaim>,

    @InjectRepository(CustomVerificationQuestion)
    private readonly questionRepo: Repository<CustomVerificationQuestion>,

    @InjectRepository(FoundItem)
    private readonly foundItemRepo: Repository<FoundItem>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  // ─── Questions ───────────────────────────────────────────────

  getMandatoryQuestions() {
    return MANDATORY_QUESTIONS;
  }

  async getCustomQuestions(foundItemId: string): Promise<CustomVerificationQuestion[]> {
    return this.questionRepo.find({
      where: { foundItemId },
      order: { sortOrder: 'ASC' },
    });
  }

  async getAllQuestions(foundItemId: string) {
    const custom = await this.getCustomQuestions(foundItemId);
    return {
      mandatory: MANDATORY_QUESTIONS,
      custom,
    };
  }

  async addCustomQuestion(
    foundItemId: string,
    createdById: string,
    questionText: string,
  ): Promise<CustomVerificationQuestion> {
    // Verify the found item belongs to this user
    const item = await this.foundItemRepo.findOne({ where: { id: foundItemId } });
    if (!item) throw new NotFoundException('Found item not found');
    if (item.userId !== createdById) throw new ForbiddenException('Only the finder can add questions');

    const existing = await this.questionRepo.count({ where: { foundItemId } });
    if (existing >= MAX_CUSTOM_QUESTIONS) {
      throw new BadRequestException(`Maximum ${MAX_CUSTOM_QUESTIONS} custom questions allowed`);
    }

    const q = this.questionRepo.create({
      foundItemId,
      createdById,
      questionText,
      sortOrder: existing,
    });
    return this.questionRepo.save(q);
  }

  async deleteCustomQuestion(questionId: string, userId: string): Promise<void> {
    const q = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question not found');
    if (q.createdById !== userId) throw new ForbiddenException('Not authorized');
    await this.questionRepo.delete(questionId);
  }

  // ─── Claims ──────────────────────────────────────────────────

  async submitClaim(
    foundItemId: string,
    claimantId: string,
    verificationAnswers: Record<string, string>,
    ipAddress: string,
    userAgent: string,
  ): Promise<FoundItemClaim> {
    const item = await this.foundItemRepo.findOne({ where: { id: foundItemId } });
    if (!item) throw new NotFoundException('Found item not found');
    if (item.userId === claimantId) {
      throw new ForbiddenException('You cannot claim your own found report');
    }
    if (item.status === 'returned') {
      throw new ConflictException('This item has already been returned to its owner');
    }

    // Check attempt count
    const existing = await this.claimRepo.findOne({
      where: { foundItemId, claimantId },
    });

    if (existing) {
      if (existing.attemptCount >= MAX_ATTEMPTS) {
        throw new ConflictException(
          `Maximum ${MAX_ATTEMPTS} claim attempts reached for this item. Please contact support.`,
        );
      }
      // Update existing claim with new answers and increment count
      existing.verificationAnswers = verificationAnswers;
      existing.attemptCount += 1;
      existing.ipAddress = ipAddress;
      existing.userAgent = userAgent;
      existing.status = 'pending';
      existing.confidenceScore = this.computeConfidenceScore(verificationAnswers, item);
      const updated = await this.claimRepo.save(existing);
      await this.notifyFinder(item, updated);
      return updated;
    }

    // Validate mandatory questions are answered
    const mandatoryIds = MANDATORY_QUESTIONS.map((q) => q.id);
    for (const qId of mandatoryIds) {
      const answer = verificationAnswers[qId];
      if (!answer || answer.trim().length < 5) {
        throw new BadRequestException(`Question "${qId}" requires a meaningful answer (min 5 characters)`);
      }
    }

    const confidenceScore = this.computeConfidenceScore(verificationAnswers, item);

    const claim = this.claimRepo.create({
      foundItemId,
      claimantId,
      finderId: item.userId,
      verificationAnswers,
      confidenceScore,
      attemptCount: 1,
      ipAddress,
      userAgent,
      status: 'pending',
    });

    const saved = await this.claimRepo.save(claim);
    await this.notifyFinder(item, saved);
    return saved;
  }

  async getClaimsForFoundItem(foundItemId: string, requesterId: string): Promise<FoundItemClaim[]> {
    const item = await this.foundItemRepo.findOne({ where: { id: foundItemId } });
    if (!item) throw new NotFoundException('Found item not found');
    if (item.userId !== requesterId) throw new ForbiddenException('Only the finder can view claims');

    return this.claimRepo.find({
      where: { foundItemId },
      relations: ['claimant'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getMyClaims(claimantId: string): Promise<FoundItemClaim[]> {
    return this.claimRepo.find({
      where: { claimantId },
      relations: ['foundItem'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getClaimById(id: string): Promise<FoundItemClaim> {
    const claim = await this.claimRepo.findOne({
      where: { id },
      relations: ['claimant', 'finder', 'foundItem'],
    });
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }

  async reviewClaim(
    claimId: string,
    reviewerId: string,
    status: string,
    finderResponse?: string,
  ): Promise<FoundItemClaim> {
    const claim = await this.getClaimById(claimId);

    if (claim.finderId !== reviewerId) {
      throw new ForbiddenException('Only the finder can review this claim');
    }

    claim.status = status;
    claim.finderResponse = finderResponse || claim.finderResponse;
    claim.reviewedBy = reviewerId;
    claim.reviewedAt = new Date();

    const saved = await this.claimRepo.save(claim);

    if (status === 'approved') {
      await this.notifyClaimant(saved, 'approved');
      // Mark found item as matched
      await this.foundItemRepo.update(claim.foundItemId, { status: 'matched' });
    } else if (status === 'rejected') {
      await this.notifyClaimant(saved, 'rejected');
    } else if (status === 'info_requested') {
      await this.notifyClaimant(saved, 'info_requested');
    }

    return saved;
  }

  /**
   * Get contact info of the claimant — only revealed after approval.
   */
  async getRevealedContact(claimId: string, requesterId: string) {
    const claim = await this.getClaimById(claimId);

    const isParty = claim.claimantId === requesterId || claim.finderId === requesterId;
    if (!isParty) throw new ForbiddenException('Access denied');
    if (claim.status !== 'approved') {
      throw new ForbiddenException('Contact info is only revealed after approval');
    }

    const claimant = await this.userRepo.findOne({ where: { id: claim.claimantId } });
    const finder = await this.userRepo.findOne({ where: { id: claim.finderId } });

    return {
      claimant: {
        fullName: claimant?.fullName,
        email: claimant?.email,
        phone: (claimant as any)?.phone,
      },
      finder: {
        fullName: finder?.fullName,
        email: finder?.email,
        phone: (finder as any)?.phone,
      },
    };
  }

  // ─── AI Scoring ──────────────────────────────────────────────

  /**
   * Compute a keyword-overlap confidence score (0-100).
   * Advisory only — never auto-approves or auto-rejects.
   */
  private computeConfidenceScore(
    answers: Record<string, string>,
    item: FoundItem,
  ): number {
    const itemText = [item.itemName, item.description, item.color, item.brand]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const answerText = Object.values(answers).join(' ').toLowerCase();

    // Extract meaningful words (ignore stopwords)
    const stopwords = new Set([
      'i', 'me', 'my', 'the', 'a', 'an', 'and', 'or', 'but', 'it', 'its',
      'was', 'is', 'are', 'be', 'been', 'have', 'has', 'do', 'did', 'this',
      'that', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by',
    ]);

    const itemWords = itemText
      .split(/\W+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    if (itemWords.length === 0) return 50; // neutral when no item data

    const matchCount = itemWords.filter((w) => answerText.includes(w)).length;
    const rawScore = matchCount / itemWords.length;

    // Scale to 0-100 with a boost for having all mandatory answers
    const mandatoryIds = MANDATORY_QUESTIONS.map((q) => q.id);
    const answeredMandatory = mandatoryIds.filter(
      (id) => answers[id] && answers[id].trim().length >= 5,
    ).length;
    const completenessBonus = (answeredMandatory / mandatoryIds.length) * 20;

    return Math.min(100, Math.round(rawScore * 80 + completenessBonus));
  }

  // ─── Notifications ───────────────────────────────────────────

  private async notifyFinder(item: FoundItem, claim: FoundItemClaim): Promise<void> {
    const notif = this.notifRepo.create({
      userId: item.userId,
      title: 'New Ownership Claim',
      body: `Someone has submitted an ownership claim for your found item: "${item.itemName}". Review their answers in the dashboard.`,
      type: 'claim_submitted',
      actionUrl: `/dashboard/found/${item.id}`,
      metadata: { claimId: claim.id, foundItemId: item.id },
    });
    await this.notifRepo.save(notif);
  }

  private async notifyClaimant(claim: FoundItemClaim, action: string): Promise<void> {
    const messages: Record<string, { title: string; body: string }> = {
      approved: {
        title: '🎉 Claim Approved!',
        body: 'Your ownership claim has been approved. You can now view the finder\'s contact information.',
      },
      rejected: {
        title: 'Claim Not Verified',
        body: 'Unfortunately, your claim could not be verified. You may re-submit with additional details.',
      },
      info_requested: {
        title: 'More Information Requested',
        body: 'The finder has requested additional information about your claim. Please review and update your answers.',
      },
    };

    const msg = messages[action];
    if (!msg) return;

    const notif = this.notifRepo.create({
      userId: claim.claimantId,
      title: msg.title,
      body: msg.body,
      type: `claim_${action}`,
      actionUrl: `/dashboard/claims`,
      metadata: { claimId: claim.id, foundItemId: claim.foundItemId },
    });
    await this.notifRepo.save(notif);
  }
}
