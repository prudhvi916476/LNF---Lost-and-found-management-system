// ─── Claim Types ───────────────────────────────────────────

export enum ClaimStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export interface IClaim {
  id: string;
  lostItemId: string;
  matchId?: string;
  claimantId: string;
  status: ClaimStatus;
  claimDescription: string;
  verificationAnswers?: Record<string, string>;
  evidence: IClaimEvidence[];
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClaimEvidence {
  id: string;
  claimId: string;
  type: 'invoice' | 'warranty' | 'photo' | 'other';
  fileUrl: string;
  description?: string;
  createdAt: Date;
}

export interface IVerificationQuestion {
  id: string;
  claimId: string;
  question: string;
  expectedAnswer?: string;
  providedAnswer?: string;
  isCorrect?: boolean;
}
