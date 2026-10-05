// ─── Item Types ────────────────────────────────────────────

export enum ItemStatus {
  ACTIVE = 'active',
  MATCHED = 'matched',
  RECOVERED = 'recovered',
  CLOSED = 'closed',
}

export enum FoundItemStatus {
  AWAITING_MATCH = 'awaiting_match',
  MATCHED = 'matched',
  RETURNED = 'returned',
}

export enum StorageType {
  PERSONAL = 'personal',
  AUTHORITY = 'authority',
  ORG_DESK = 'org_desk',
}

export enum ContactPreference {
  EMAIL = 'email',
  PHONE = 'phone',
  IN_APP = 'in_app',
}

export const ITEM_CATEGORIES = [
  'Electronics',
  'Phone',
  'Laptop',
  'Tablet',
  'Wallet',
  'Keys',
  'Bag',
  'Backpack',
  'Clothing',
  'Jewelry',
  'Watch',
  'Glasses',
  'Sunglasses',
  'Headphones',
  'Charger',
  'Documents',
  'ID Card',
  'Passport',
  'Book',
  'Umbrella',
  'Water Bottle',
  'Sports Equipment',
  'Musical Instrument',
  'Bicycle',
  'Pet',
  'Other',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export interface ILostItem {
  id: string;
  userId: string;
  organizationId?: string;
  itemName: string;
  category: ItemCategory;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  description: string;
  serialNumber?: string;
  uniqueIdentifiers?: Record<string, string>;
  images: IItemImage[];
  lostLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  lostDate: Date;
  lostTimeApprox?: string;
  contactPreference: ContactPreference;
  rewardAmount?: number;
  status: ItemStatus;
  matchCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFoundItem {
  id: string;
  userId: string;
  organizationId?: string;
  itemName: string;
  category: ItemCategory;
  description: string;
  color?: string;
  images: IItemImage[];
  foundLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  city?: string;
  state?: string;
  country?: string;
  foundDate: Date;
  storage: StorageType;
  storageDetails?: string;
  status: FoundItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItemImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface IMatch {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostItem?: ILostItem;
  foundItem?: IFoundItem;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  scoreBreakdown: {
    textScore: number;
    locationScore: number;
    timeScore: number;
    imageScore: number;
  };
  isConfirmed: boolean;
  isDismissed: boolean;
  createdAt: Date;
}

export interface ISearchFilters {
  query?: string;
  category?: ItemCategory;
  dateFrom?: Date;
  dateTo?: Date;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  color?: string;
  brand?: string;
  status?: ItemStatus | FoundItemStatus;
  type?: 'lost' | 'found';
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'distance' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
