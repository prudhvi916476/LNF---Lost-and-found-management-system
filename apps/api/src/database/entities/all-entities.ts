import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export { User };

@Entity('lost_items')
export class LostItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  organizationId: string;

  @Column()
  itemName: string;

  @Column()
  @Index()
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  size: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ type: 'simple-json', nullable: true })
  uniqueIdentifiers: Record<string, string>;

  @Column({ type: 'float', nullable: true })
  locationLat: number;

  @Column({ type: 'float', nullable: true })
  locationLng: number;

  @Column({ nullable: true })
  locationAddress: string;

  @Column({ nullable: true })
  landmark: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'timestamp', nullable: true })
  lostDate: Date;

  @Column({ nullable: true })
  lostTimeApprox: string;

  @Column({ type: 'varchar', default: 'in_app' })
  contactPreference: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rewardAmount: number;

  @Column({
    type: 'varchar',
    default: 'active',
  })
  @Index()
  status: string;

  @OneToMany(() => ItemImage, (image) => image.lostItem, { cascade: true })
  images: ItemImage[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('found_items')
export class FoundItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  organizationId: string;

  @Column()
  itemName: string;

  @Column()
  @Index()
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'float', nullable: true })
  locationLat: number;

  @Column({ type: 'float', nullable: true })
  locationLng: number;

  @Column({ nullable: true })
  locationAddress: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'timestamp', nullable: true })
  foundDate: Date;

  @Column({
    type: 'varchar',
    default: 'personal',
  })
  storage: string;

  @Column({ nullable: true })
  storageDetails: string;

  @Column({
    type: 'varchar',
    default: 'awaiting_match',
  })
  @Index()
  status: string;

  @OneToMany(() => ItemImage, (image) => image.foundItem, { cascade: true })
  images: ItemImage[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('item_images')
export class ItemImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  lostItemId: string;

  @ManyToOne(() => LostItem, (item) => item.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lostItemId' })
  lostItem: LostItem;

  @Column({ nullable: true })
  foundItemId: string;

  @ManyToOne(() => FoundItem, (item) => item.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'foundItemId' })
  foundItem: FoundItem;

  @Column()
  url: string;

  /** Processed grayscale-negative-blur preview — shown publicly */
  @Column({ nullable: true })
  previewUrl: string;

  /** If true, original url is private (only accessible after claim approval) */
  @Column({ default: false })
  isPrivate: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Found Item Claim Verification ──────────────────────────

@Entity('found_item_claims')
export class FoundItemClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  foundItemId: string;

  @ManyToOne(() => FoundItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'foundItemId' })
  foundItem: FoundItem;

  @Column()
  @Index()
  claimantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'claimantId' })
  claimant: User;

  @Column()
  finderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'finderId' })
  finder: User;

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  @Index()
  status: string; // pending | approved | rejected | info_requested

  /** JSON map of questionId -> answer */
  @Column({ type: 'simple-json', nullable: true })
  verificationAnswers: Record<string, string>;

  /** AI keyword-overlap advisory score 0–100 */
  @Column({ type: 'float', nullable: true })
  confidenceScore: number;

  /** Number of claim attempts by this user for this item */
  @Column({ default: 1 })
  attemptCount: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  finderResponse: string;

  @Column({ type: 'text', nullable: true })
  adminOverride: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('custom_verification_questions')
export class CustomVerificationQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  foundItemId: string;

  @ManyToOne(() => FoundItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'foundItemId' })
  foundItem: FoundItem;

  @Column({ type: 'text' })
  questionText: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  lostItemId: string;

  @ManyToOne(() => LostItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lostItemId' })
  lostItem: LostItem;

  @Column()
  @Index()
  foundItemId: string;

  @ManyToOne(() => FoundItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'foundItemId' })
  foundItem: FoundItem;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  matchScore: number;

  @Column({ type: 'varchar' })
  confidence: string;

  @Column({ type: 'simple-json', nullable: true })
  scoreBreakdown: Record<string, number>;

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ default: false })
  isDismissed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lostItemId: string;

  @ManyToOne(() => LostItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lostItemId' })
  lostItem: LostItem;

  @Column({ nullable: true })
  matchId: string;

  @ManyToOne(() => Match, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  claimantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'claimantId' })
  claimant: User;

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({ type: 'text', nullable: true })
  claimDescription: string;

  @Column({ type: 'simple-json', nullable: true })
  verificationAnswers: Record<string, string>;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @OneToMany(() => ClaimEvidence, (evidence) => evidence.claim, { cascade: true })
  evidence: ClaimEvidence[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('claim_evidence')
export class ClaimEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  claimId: string;

  @ManyToOne(() => Claim, (claim) => claim.evidence, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'claimId' })
  claim: Claim;

  @Column({ type: 'varchar' })
  type: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  participant1Id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant1Id' })
  participant1: User;

  @Column()
  participant2Id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant2Id' })
  participant2: User;

  @Column({ nullable: true })
  relatedMatchId: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  conversationId: string;

  @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', default: 'text' })
  type: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ default: false })
  @Index()
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({
    type: 'varchar',
  })
  type: string;

  @Column({ type: 'simple-json', nullable: true })
  theme: Record<string, string>;

  @Column({ type: 'simple-json', nullable: true })
  settings: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('qr_tags')
export class QrTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  @Index()
  code: string;

  @Column()
  itemName: string;

  @Column({ type: 'text', nullable: true })
  itemDescription: string;

  @Column({ nullable: true })
  qrImageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastScanned: Date;

  @Column({ type: 'float', nullable: true })
  lastScanLat: number;

  @Column({ type: 'float', nullable: true })
  lastScanLng: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  badgeName: string;

  @Column()
  badgeIcon: string;

  @CreateDateColumn()
  earnedAt: Date;
}

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'simple-json', nullable: true })
  oldValues: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  newValues: Record<string, unknown>;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
