'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, ShieldCheck, Eye, EyeOff, MapPin, Calendar,
  CheckCircle2, XCircle, MessageSquare, Loader2, AlertTriangle,
  ChevronDown, ChevronUp, User, Phone, Mail, Clock,
  ThumbsUp, ThumbsDown, HelpCircle, Sparkles,
} from 'lucide-react';
import { itemsApi, verificationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

interface FoundItem {
  id: string;
  itemName: string;
  category: string;
  description: string;
  color?: string;
  locationAddress?: string;
  city?: string;
  foundDate?: string;
  status: string;
  userId: string;
  user: { fullName: string };
  images: Array<{ id: string; url: string; previewUrl?: string; isPrivate?: boolean }>;
}

interface Claim {
  id: string;
  claimantId: string;
  claimant: { fullName: string; email: string };
  status: string;
  verificationAnswers: Record<string, string>;
  confidenceScore?: number;
  submittedAt: string;
  attemptCount: number;
  finderResponse?: string;
}

const STATUS_COLORS: Record<string, string> = {
  awaiting_match: 'bg-amber-500/20 text-amber-300',
  matched: 'bg-blue-500/20 text-blue-300',
  returned: 'bg-green-500/20 text-green-300',
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
  info_requested: 'bg-purple-100 text-purple-700',
};

const MANDATORY_LABELS: Record<string, string> = {
  location: 'Where they lost it',
  time: 'When they lost it',
  description: 'Item description',
  features: 'Distinguishing features',
  contents: 'Contents',
  ownership_proof: 'Ownership proof',
  last_usage: 'Last used',
  additional_details: 'Additional details',
};

function ConfidenceBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 70 ? 'text-green-400 bg-green-500/10 border-green-500/20'
    : score >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20';
  const label = score >= 70 ? 'Likely Genuine' : score >= 40 ? 'Moderate Match' : 'Low Confidence';
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${color}`}>
      <Sparkles className="w-3.5 h-3.5" />
      AI Score: {score}% — {label}
    </div>
  );
}

export default function FoundItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;
  const { user } = useAuthStore();

  const [item, setItem] = useState<FoundItem | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [error, setError] = useState('');

  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [finderNote, setFinderNote] = useState('');

  const [revealedContact, setRevealedContact] = useState<Record<string, any>>({});

  const isFinder = item?.userId === user?.id;

  useEffect(() => {
    if (!itemId) return;
    (async () => {
      try {
        const res = await itemsApi.getFoundItem(itemId);
        setItem(res.data.data);
        if (res.data.data.userId === user?.id) {
          setLoadingClaims(true);
          try {
            const claimsRes = await verificationApi.getFoundItemClaims(itemId);
            setClaims(claimsRes.data.data);
          } catch { /* not finder */ } finally { setLoadingClaims(false); }
        }
      } catch (e) {
        setError('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId, user?.id]);

  const handleReview = async (claimId: string, status: string) => {
    setReviewLoading(claimId);
    try {
      await verificationApi.reviewClaim(claimId, status, finderNote || undefined);
      const updated = await verificationApi.getFoundItemClaims(itemId);
      setClaims(updated.data.data);
      setFinderNote('');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to review claim.');
    } finally {
      setReviewLoading(null);
    }
  };

  const handleRevealContact = async (claimId: string) => {
    try {
      const res = await verificationApi.getRevealedContact(claimId);
      setRevealedContact(prev => ({ ...prev, [claimId]: res.data.data }));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Cannot reveal contact yet.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white/70">{error || 'Item not found.'}</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-xl bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition-all text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const primaryImage = item.images?.[0];
  const displayImageUrl = primaryImage?.previewUrl || primaryImage?.url;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/[0.04] text-white/60">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{item.itemName}</h1>
          <p className="text-white/60 text-sm">{item.category}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || 'bg-white/[0.04] text-white/70'}`}>
          {item.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Image & Details */}
        <div className="space-y-4">
          {/* Image */}
          {displayImageUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]">
              <img
                src={displayImageUrl}
                alt={item.itemName}
                className="w-full object-cover aspect-video"
              />
              {primaryImage?.isPrivate && (
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                  <div className="bg-black/70 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Image intentionally obscured for ownership protection
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <EyeOff className="w-3 h-3" />
                Anonymised Preview
              </div>
            </div>
          )}
          {!displayImageUrl && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] aspect-video flex flex-col items-center justify-center text-white/40">
              <EyeOff className="w-10 h-10 mb-2" />
              <p className="text-sm">No image provided</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Image intentionally obscured for ownership protection. The original is only visible after a successful verification.
            </p>
          </div>

          {/* Item details */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-5 space-y-3">
            <h3 className="font-semibold text-white">Item Details</h3>
            {[
              { label: 'Description', value: item.description },
              { label: 'Color', value: item.color },
              { label: 'Location Found', value: item.locationAddress || item.city },
              { label: 'Date Found', value: item.foundDate ? new Date(item.foundDate).toLocaleDateString() : undefined },
              { label: 'Reported by', value: item.user?.fullName ? `${item.user.fullName.split(' ')[0]} (finder)` : undefined },
            ].filter(i => i.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 py-1.5 border-b border-white/[0.02] last:border-0">
                <span className="text-sm text-white/60 shrink-0">{label}</span>
                <span className="text-sm font-medium text-white text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Claim button (non-finder) */}
          {!isFinder && item.status !== 'returned' && (
            <Link href={`/dashboard/found/${itemId}/claim`}>
              <div className="w-full p-5 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white text-center cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5 group">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-bold text-lg">I Think This Is Mine</span>
                </div>
                <p className="text-sm text-white/80">Answer 8 verification questions to prove ownership</p>
              </div>
            </Link>
          )}
          {item.status === 'returned' && !isFinder && (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-300">This item has been returned to its owner.</p>
            </div>
          )}
        </div>

        {/* Right: Finder review panel */}
        {isFinder && (
          <div className="space-y-4">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-500" />
                Pending Claims
                {claims.length > 0 && (
                  <span className="ml-auto bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{claims.length}</span>
                )}
              </h3>

              {loadingClaims ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                </div>
              ) : claims.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No ownership claims yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {claims.map(claim => {
                    const firstName = claim.claimant?.fullName?.split(' ')[0] || 'Anonymous';
                    const isExpanded = expandedClaim === claim.id;
                    const contact = revealedContact[claim.id];

                    return (
                      <div key={claim.id} className="border border-white/[0.08] rounded-2xl overflow-hidden">
                        {/* Claim summary */}
                        <div className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold shrink-0">
                            {firstName[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{firstName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[claim.status] || ''}`}>
                                {claim.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-white/50 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(claim.submittedAt).toLocaleDateString()}
                              </span>
                              <ConfidenceBadge score={claim.confidenceScore} />
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                            className="p-2 rounded-xl hover:bg-white/[0.02] text-white/50 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded Q&A */}
                        {isExpanded && (
                          <div className="border-t border-white/[0.02] p-4 space-y-4 bg-white/[0.02]/50">
                            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">Verification Answers</h4>
                            <div className="space-y-3">
                              {Object.entries(claim.verificationAnswers || {}).map(([qId, answer]) => (
                                <div key={qId} className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 border border-white/[0.08]">
                                  <p className="text-xs font-semibold text-primary-400 mb-1">
                                    {MANDATORY_LABELS[qId] || qId}
                                  </p>
                                  <p className="text-sm text-white/80">{answer}</p>
                                </div>
                              ))}
                            </div>

                            {/* Revealed contact (approved) */}
                            {claim.status === 'approved' && (
                              <div>
                                {contact ? (
                                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 space-y-1">
                                    <p className="text-xs font-semibold text-green-300">Contact Information</p>
                                    <p className="text-sm text-green-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {contact.claimant?.fullName}</p>
                                    <p className="text-sm text-green-800 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {contact.claimant?.email}</p>
                                    {contact.claimant?.phone && <p className="text-sm text-green-800 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {contact.claimant.phone}</p>}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleRevealContact(claim.id)}
                                    className="w-full p-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" /> Reveal Contact Info
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Review actions */}
                            {claim.status === 'pending' && (
                              <div className="space-y-3 pt-2">
                                <textarea
                                  value={finderNote}
                                  onChange={e => setFinderNote(e.target.value)}
                                  placeholder="Optional: add a note to the claimant..."
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReview(claim.id, 'approved')}
                                    disabled={reviewLoading === claim.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                                  >
                                    {reviewLoading === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReview(claim.id, 'info_requested')}
                                    disabled={reviewLoading === claim.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                                  >
                                    <MessageSquare className="w-4 h-4" /> Request Info
                                  </button>
                                  <button
                                    onClick={() => handleReview(claim.id, 'rejected')}
                                    disabled={reviewLoading === claim.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                  >
                                    <ThumbsDown className="w-4 h-4" /> Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            {claim.finderResponse && (
                              <div className="p-3 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.08]">
                                <p className="text-xs font-semibold text-white/60 mb-1">Your response</p>
                                <p className="text-sm text-white/80">{claim.finderResponse}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
