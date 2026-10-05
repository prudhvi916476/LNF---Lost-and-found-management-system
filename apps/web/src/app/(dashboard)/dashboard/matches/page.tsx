'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, ChevronDown, Eye, MapPin, Clock, Tag, Loader2 } from 'lucide-react';
import { matchApi } from '@/lib/api';

export default function MatchesPage() {
  const router = useRouter();
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await matchApi.getMatches();
      setMatches(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleConfirm = async (id: string, foundItemId: string, e: any) => {
    e.stopPropagation();
    try {
      await matchApi.confirmMatch(id);
      router.push(`/dashboard/found/${foundItemId}/claim`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismiss = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      await matchApi.dismissMatch(id);
      fetchMatches();
    } catch (e) {
      console.error(e);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-accent-500 text-white';
      case 'medium': return 'bg-warning-500 text-white';
      case 'low': return 'bg-surface-400 text-white';
      default: return 'bg-white/[0.08] text-white/70';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent-500';
    if (score >= 50) return 'text-warning-500';
    return 'text-danger-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
            AI Matches
          </h1>
          <p className="text-white/60 mt-1">Items matched by our AI engine based on description, location, and time</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">{matches.length} matches</span>
          {loading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
        </div>
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((match, i) => (
          <div
            key={match.id}
            className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Match Header */}
            <div className="p-5 flex items-center gap-4">
              {/* Score Circle */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke={match.matchScore >= 80 ? '#10b981' : match.matchScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="4" strokeDasharray={`${(match.matchScore / 100) * 176} 176`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getScoreColor(match.matchScore)}`}>{match.matchScore}%</span>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getConfidenceColor(match.confidence)}`}>
                    {match.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white">{match.lostItem.itemName}</span>
                  <ArrowRight className="w-3 h-3 text-white/40" />
                  <span className="font-medium text-white">{match.foundItem.itemName}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{match.lostItem.category}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.lostItem.city}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e) => handleConfirm(match.id, match.foundItemId, e)} className="p-2.5 rounded-xl bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 transition-all" title="Confirm match">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <button onClick={(e) => handleDismiss(match.id, e)} className="p-2.5 rounded-xl bg-white/[0.02] text-white/50 hover:bg-danger-500/10 hover:text-danger-500 transition-all" title="Dismiss match">
                  <XCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                  className="p-2.5 rounded-xl bg-white/[0.02] text-white/60 hover:bg-white/[0.04] transition-all"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedMatch === match.id ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedMatch === match.id && (
              <div className="px-5 pb-5 border-t border-white/[0.08] pt-4 animate-slide-down">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Lost Item */}
                  <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/20">
                    <h4 className="text-xs font-semibold text-danger-400 uppercase tracking-wider mb-3">Lost Item</h4>
                    <h3 className="font-semibold text-white">{match.lostItem.itemName}</h3>
                    <div className="mt-2 space-y-1 text-sm text-white/70">
                      <p>Category: {match.lostItem.category}</p>
                      <p>Color: {match.lostItem.color}</p>
                      <p>Brand: {match.lostItem.brand || 'N/A'}</p>
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.lostItem.city}</p>
                      <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {match.lostItem.lostDate}</p>
                    </div>
                  </div>

                  {/* Found Item */}
                  <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20">
                    <h4 className="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-3">Found Item</h4>
                    <h3 className="font-semibold text-white">{match.foundItem.itemName}</h3>
                    <div className="mt-2 space-y-1 text-sm text-white/70">
                      <p>Category: {match.foundItem.category}</p>
                      <p>Color: {match.foundItem.color}</p>
                      <p>Brand: {match.foundItem.brand || 'N/A'}</p>
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.foundItem.city}</p>
                      <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {match.foundItem.foundDate}</p>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Match Score Breakdown</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Text', score: match.scoreBreakdown.textScore },
                      { label: 'Location', score: match.scoreBreakdown.locationScore },
                      { label: 'Time', score: match.scoreBreakdown.timeScore },
                      { label: 'Image', score: match.scoreBreakdown.imageScore },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-sm font-bold text-white/80">{item.score}%</div>
                        <div className="w-full bg-white/[0.04] rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${item.score >= 80 ? 'bg-accent-500' : item.score >= 50 ? 'bg-warning-500' : 'bg-surface-300'}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <div className="text-xs text-white/50 mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  <button onClick={(e) => handleConfirm(match.id, match.foundItemId, e)} className="w-full sm:flex-1 py-3 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Claim
                  </button>
                  <Link href={`/dashboard/lost/${match.lostItemId}`} className="w-full sm:flex-1">
                    <button className="w-full py-3 rounded-xl bg-white/[0.04] text-white/80 font-medium hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
