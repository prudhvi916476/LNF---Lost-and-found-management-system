// ─── Message Types ─────────────────────────────────────────

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export interface IConversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  relatedMatchId?: string;
  isActive: boolean;
  lastMessage?: IMessage;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  type: MessageType;
  isRead: boolean;
  createdAt: Date;
}

// ─── Notification Types ────────────────────────────────────

export enum NotificationType {
  MATCH_FOUND = 'match',
  CLAIM_SUBMITTED = 'claim',
  CLAIM_APPROVED = 'claim_approved',
  CLAIM_REJECTED = 'claim_rejected',
  NEW_MESSAGE = 'message',
  QR_SCANNED = 'qr_scan',
  SYSTEM = 'system',
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ─── Organization Types ────────────────────────────────────

export enum OrganizationType {
  UNIVERSITY = 'university',
  CORPORATE = 'corporate',
  AIRPORT = 'airport',
  RAILWAY = 'railway',
  MALL = 'mall',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  type: OrganizationType;
  theme?: Record<string, string>;
  settings?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
}

// ─── QR Tag Types ──────────────────────────────────────────

export interface IQrTag {
  id: string;
  userId: string;
  code: string;
  itemName: string;
  itemDescription?: string;
  qrImageUrl?: string;
  isActive: boolean;
  lastScanned?: Date;
  lastScanLocation?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
}

// ─── Reputation Types ──────────────────────────────────────

export interface IUserBadge {
  id: string;
  userId: string;
  badgeName: string;
  badgeIcon: string;
  earnedAt: Date;
}

export interface ILeaderboardEntry {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  reputationPoints: number;
  recoveryCount: number;
  rank: number;
}

// ─── API Response Types ────────────────────────────────────

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ─── Dashboard Types ───────────────────────────────────────

export interface IDashboardStats {
  activeLostItems: number;
  activeFoundItems: number;
  potentialMatches: number;
  recoveredItems: number;
  unreadNotifications: number;
}

export interface IActivityFeedItem {
  id: string;
  type: 'match' | 'message' | 'claim' | 'recovery' | 'report';
  title: string;
  description: string;
  timestamp: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}
