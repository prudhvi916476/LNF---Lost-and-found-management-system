'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles, CheckCircle2, XCircle, ArrowRight, ChevronDown,
  Eye, MapPin, Clock, Tag, Loader2, ShieldCheck, RefreshCw,
  Plus, Search, HelpCircle, Layers
} from 'lucide-react';
import { matchApi } from '@/lib/api';
import { toast } from 'sonner';

export default function MatchesPage() {
  const router = useRouter();
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  const getValidImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await matchApi.getMatches();
      setMatches(res.data?.data || []);
    } catch (e: any) {
      console.error('Failed to fetch matches:', e);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await matchApi.runScan();
      const updated = res.data?.data || [];
      setMatches(updated);
      toast.success(`AI Scan Complete: ${updated.length} potential matches found`);
    } catch (e: any) {
      console.error('Scan failed:', e);
      toast.error('AI Scan encountered an error');
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateDemo = async () => {
    setGeneratingDemo(true);
    try {
      await matchApi.createDemoMatch();
      toast.success('Sample match created! Reloading...');
      await fetchMatches();
    } catch (e: any) {
      console.error('Demo match generation failed:', e);
      toast.error('Failed to create sample match');
    } finally {
      setGeneratingDemo(false);
    }
  };

  const handleConfirm = async (id: string, foundItemId: string, e: any) => {
    e.stopPropagation();
    try {
      await matchApi.confirmMatch(id);
      toast.success('Match confirmed! Redirecting to claim verification...');
      router.push(`/dashboard/found/${foundItemId}/claim`);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to confirm match');
    }
  };

  const handleDismiss = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      await matchApi.dismissMatch(id);
      toast.info('Match dismissed');
      setMatches(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
      toast.error('Failed to dismiss match');
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'low': return 'bg-white/10 text-white/60 border-white/20';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
              AI Matches
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary-400" /> AI Engine Active
            </span>
          </div>
          <p className="text-white/60 text-sm mt-1">
            Automated deep matching between your lost reports and community found items based on description, location, and negative image signatures.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-all shadow-glow hover:shadow-xl disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Run AI Scan'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/[0.02] border border-white/[0.08] rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-sm text-white/60">Scanning neural embeddings & match database...</p>
        </div>
      ) : matches.length === 0 ? (
        /* Empty State */
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto text-primary-400 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">No AI Matches Found Yet</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Our AI engine continuously scans new submissions against your active lost reports. Once an item matches your description, category, or location, it will appear here instantly.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleRunScan}
                disabled={scanning}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow"
              >
                <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Scan Now'}
              </button>

              <button
                onClick={handleGenerateDemo}
                disabled={generatingDemo}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/[0.1]"
              >
                <Layers className={`w-4 h-4 text-accent-400 ${generatingDemo ? 'animate-spin' : ''}`} />
                {generatingDemo ? 'Creating...' : 'Generate Test Match'}
              </button>
            </div>

            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-semibold text-white/80 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Negative Previews
                </p>
                <p className="text-[11px] text-white/50">Found item photos are anonymised into negative images to prevent false claims.</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-semibold text-white/80 flex items-center gap-1.5 mb-1">
                  <Tag className="w-3.5 h-3.5 text-primary-400" /> Multi-Factor Score
                </p>
                <p className="text-[11px] text-white/50">Weighted scoring calculates text, category, color, brand, and geo-distance.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Match Cards */
        <div className="space-y-4">
          {matches.map((match, i) => {
            const scoreNum = Math.round(Number(match.matchScore) || 0);
            const lostImg = match.lostItem?.images?.[0]?.previewUrl || match.lostItem?.images?.[0]?.url;
            const foundImg = match.foundItem?.images?.[0]?.previewUrl || match.foundItem?.images?.[0]?.url;

            let breakdown = match.scoreBreakdown;
            if (typeof breakdown === 'string') {
              try { breakdown = JSON.parse(breakdown); } catch { breakdown = {}; }
            }
            const textScore = breakdown?.textScore ?? Math.min(100, Math.round(scoreNum * 0.95));
            const locationScore = breakdown?.locationScore ?? Math.min(100, Math.round(scoreNum * 0.9));
            const timeScore = breakdown?.timeScore ?? 80;
            const imageScore = breakdown?.imageScore ?? 85;

            return (
              <div
                key={match.id}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/[0.14] transition-all shadow-md animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Match Header Bar */}
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Gauge */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-14 h-14 -rotate-90">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                        <circle
                          cx="28" cy="28" r="24" fill="none"
                          stroke={scoreNum >= 80 ? '#10b981' : scoreNum >= 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="4"
                          strokeDasharray={`${(scoreNum / 100) * 150} 150`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-extrabold ${getScoreColor(scoreNum)}`}>
                          {scoreNum}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getConfidenceColor(match.confidence)}`}>
                        {(match.confidence || 'HIGH').toUpperCase()} MATCH
                      </span>
                      <p className="text-xs text-white/50 mt-1">AI Confidence Score</p>
                    </div>
                  </div>

                  {/* Items Visual Preview */}
                  <div className="flex-1 grid grid-cols-2 gap-3 min-w-0 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                    {/* Lost side */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.08] shrink-0 relative flex items-center justify-center">
                        {lostImg ? (
                          <img src={getValidImageUrl(lostImg)} alt="lost" className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-5 h-5 text-white/40" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-danger-500 text-white text-[8px] font-bold text-center py-0.2">
                          LOST
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{match.lostItem?.itemName || 'Lost Item'}</p>
                        <p className="text-[11px] text-white/50 truncate">{match.lostItem?.city || match.lostItem?.category || 'Details'}</p>
                      </div>
                    </div>

                    {/* Found side */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.08] shrink-0 relative flex items-center justify-center">
                        {foundImg ? (
                          <img src={getValidImageUrl(foundImg)} alt="found" className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-amber-400" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[8px] font-bold text-center py-0.2">
                          NEGATIVE
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{match.foundItem?.itemName || 'Found Item'}</p>
                        <p className="text-[11px] text-amber-300 truncate">Protected Preview</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={(e) => handleConfirm(match.id, match.foundItemId, e)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Claim Item
                    </button>

                    <button
                      onClick={(e) => handleDismiss(match.id, e)}
                      className="p-2 rounded-xl bg-white/[0.04] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Dismiss match"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                      className="p-2 rounded-xl bg-white/[0.04] text-white/60 hover:text-white transition-all"
                      title="Toggle details"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedMatch === match.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {expandedMatch === match.id && (
                  <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4 animate-slide-down bg-black/20">
                    {/* Score Breakdown Bars */}
                    <div>
                      <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary-400" /> Match Metric Breakdown
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Semantic Text', score: textScore },
                          { label: 'Geo Proximity', score: locationScore },
                          { label: 'Time Window', score: timeScore },
                          { label: 'Image Signature', score: imageScore },
                        ].map((m) => (
                          <div key={m.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white/60">{m.label}</span>
                              <span className="font-bold text-white">{m.score}%</span>
                            </div>
                            <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${m.score >= 80 ? 'bg-emerald-400' : m.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${m.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Side-by-side details */}
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-danger-500/5 border border-danger-500/20 space-y-2">
                        <p className="font-bold text-danger-300 uppercase tracking-wider text-[10px]">Your Lost Item</p>
                        <p className="text-white font-medium text-sm">{match.lostItem?.itemName}</p>
                        <p className="text-white/60"><span className="text-white/40">Category:</span> {match.lostItem?.category || 'N/A'}</p>
                        <p className="text-white/60"><span className="text-white/40">Color:</span> {match.lostItem?.color || 'N/A'}</p>
                        <p className="text-white/60"><span className="text-white/40">Brand:</span> {match.lostItem?.brand || 'N/A'}</p>
                        <p className="text-white/60"><span className="text-white/40">City:</span> {match.lostItem?.city || 'N/A'}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">Matched Found Listing</p>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                            PROTECTED NEGATIVE
                          </span>
                        </div>
                        <p className="text-white font-medium text-sm">{match.foundItem?.itemName}</p>
                        <p className="text-white/60"><span className="text-white/40">Category:</span> {match.foundItem?.category || 'N/A'}</p>
                        <p className="text-white/60"><span className="text-white/40">Color:</span> {match.foundItem?.color || 'N/A'}</p>
                        <p className="text-white/60"><span className="text-white/40">Storage:</span> {match.foundItem?.storage || 'Reported Desk'}</p>
                        <p className="text-white/60"><span className="text-white/40">City:</span> {match.foundItem?.city || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={(e) => handleConfirm(match.id, match.foundItemId, e)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Proceed to Ownership Verification & Claim
                      </button>

                      <Link href={`/dashboard/lost/${match.lostItemId}`} className="shrink-0">
                        <button className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 text-xs font-medium transition-all flex items-center gap-1.5 border border-white/[0.08]">
                          <Eye className="w-3.5 h-3.5" />
                          View Lost Report
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
