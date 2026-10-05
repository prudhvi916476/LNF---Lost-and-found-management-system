// ─── User Types ────────────────────────────────────────────

export enum UserRole {
  USER = 'user',
  ORG_ADMIN = 'org_admin',
  SUPER_ADMIN = 'super_admin',
}

export interface IUser {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId?: string;
  reputationPoints: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  language: string;
}
