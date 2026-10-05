'use client';

import {
  Shield, Clock, CheckCircle2, XCircle, AlertTriangle,
  Eye, Loader2, Sparkles, MessageSquare, ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { verificationApi } from '@/lib/api';
import Link from 'next/link';

interface FoundItemClaim {
  id: string;
  foundItemId: string;
  status: string;
  confidenceScore?: number;
  submittedAt: string;
  attemptCount: number;
  finderResponse?: string;
  foundItem?: { itemName: string; category: string };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    pending: { icon: <Clock className="w-3 h-3" />, label: 'PENDING', cls: 'bg-amber-500/10 text-amber-400' },
    approved: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'APPROVED', cls: 'bg-green-500/10 text-green-400' },
    rejected: { icon: <XCircle className="w-3 h-3" />, label: 'REJECTED', cls: 'bg-red-500/10 text-red-400' },
    info_requested: { icon: <MessageSquare className="w-3 h-3" />, label: 'INFO NEEDED', cls: 'bg-purple-50 text-purple-600' },
  };
  const config = map[status] || { icon: null, label: status.toUpperCase(), cls: 'bg-white/[0.04] text-white/70' };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 w-max ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

function ConfidenceBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-amber-400' : 'text-red-500';
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Sparkles className="w-3 h-3" /> AI: {score}%
    </span>
  );
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<FoundItemClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificationApi.getMyClaims()
      .then(res => setClaims(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">My Claims</h1>
          <p className="text-sm text-white/60 mt-1">Track your ownership verification submissions</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />}
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-300">
          <p className="font-semibold">How it works</p>
          <p className="text-primary-400 mt-0.5">
            You submit answers to ownership questions → the finder reviews them → if approved,
            contact details are revealed and you can arrange a return.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {claims.map(claim => (
          <div key={claim.id} className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <StatusBadge status={claim.status} />
                  <ConfidenceBadge score={claim.confidenceScore} />
                </div>
                <h3 className="font-semibold text-white truncate">
                  {claim.foundItem?.itemName || 'Found Item Claim'}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-white/50">
                    Submitted {new Date(claim.submittedAt).toLocaleDateString()}
                  </span>
                  {claim.attemptCount > 1 && (
                    <span className="text-xs text-amber-500">Attempt {claim.attemptCount}/3</span>
                  )}
                </div>
                {claim.finderResponse && (
                  <p className="text-sm text-white/70 mt-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                    <span className="font-medium text-white/80">Finder: </span>{claim.finderResponse}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link href={`/dashboard/found/${claim.foundItemId}`}>
                  <button className="flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
                    <Eye className="w-4 h-4" /> View Item
                  </button>
                </Link>
                {claim.status === 'approved' && (
                  <Link href={`/dashboard/found/${claim.foundItemId}`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Contact
                    </button>
                  </Link>
                )}
                {claim.status === 'info_requested' && (
                  <Link href={`/dashboard/found/${claim.foundItemId}/claim`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" /> Update Answers
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {claims.length === 0 && !loading && (
          <div className="text-center py-16 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08]">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white">No Claims Yet</h3>
            <p className="text-white/60 mt-1 text-sm">
              Browse found items and click "I Think This Is Mine" to submit a claim.
            </p>
            <Link href="/dashboard/search">
              <button className="mt-4 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
                Search Found Items
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
