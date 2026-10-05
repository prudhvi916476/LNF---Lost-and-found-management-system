'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2,
  Loader2, AlertTriangle, Clock, MapPin, Package,
  Fingerprint, Archive, BookOpen, Calendar, Star,
} from 'lucide-react';
import { verificationApi } from '@/lib/api';

interface Question {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

interface CustomQuestion {
  id: string;
  questionText: string;
}

const QUESTION_ICONS: Record<string, React.ReactNode> = {
  location: <MapPin className="w-5 h-5" />,
  time: <Clock className="w-5 h-5" />,
  description: <Package className="w-5 h-5" />,
  features: <Fingerprint className="w-5 h-5" />,
  contents: <Archive className="w-5 h-5" />,
  ownership_proof: <BookOpen className="w-5 h-5" />,
  last_usage: <Calendar className="w-5 h-5" />,
  additional_details: <Star className="w-5 h-5" />,
};

const DRAFT_KEY = (id: string) => `claim_draft_${id}`;

export default function ClaimPage() {
  const router = useRouter();
  const params = useParams();
  const foundItemId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [mandatory, setMandatory] = useState<Question[]>([]);
  const [custom, setCustom] = useState<CustomQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [currentQ, setCurrentQ] = useState(0);

  const allQuestions: (Question | { id: string; label: string; hint: string; icon: React.ReactNode })[] = [
    ...mandatory,
    ...custom.map(q => ({
      id: q.id,
      label: q.questionText,
      hint: 'Answer as specifically as possible.',
      icon: <Star className="w-5 h-5" />,
    })),
  ];
  const totalQuestions = allQuestions.length;

  useEffect(() => {
    if (!foundItemId) return;
    (async () => {
      try {
        const res = await verificationApi.getQuestions(foundItemId);
        const { mandatory: m, custom: c } = res.data.data;
        const enrichedMandatory = m.map((q: any) => ({
          ...q,
          icon: QUESTION_ICONS[q.id] ?? <HelpIcon />,
        }));
        setMandatory(enrichedMandatory);
        setCustom(c);

        // Restore draft from localStorage
        const draft = localStorage.getItem(DRAFT_KEY(foundItemId));
        if (draft) {
          try { setAnswers(JSON.parse(draft)); } catch { /* ignore */ }
        }
      } catch (e) {
        setError('Failed to load questions. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, [foundItemId]);

  // Autosave draft
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(DRAFT_KEY(foundItemId), JSON.stringify(answers));
    }
  }, [answers, foundItemId]);

  const setAnswer = (qId: string, value: string) =>
    setAnswers(prev => ({ ...prev, [qId]: value }));

  const canAdvance = () => {
    if (currentQ >= totalQuestions) return false;
    const q = allQuestions[currentQ];
    const answer = answers[q.id] || '';
    return answer.trim().length >= 5;
  };

  const handleSubmit = async () => {
    // Validate all mandatory questions
    for (const q of mandatory) {
      if (!answers[q.id] || answers[q.id].trim().length < 5) {
        setError(`Please answer all required questions (at least 5 characters each).`);
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      await verificationApi.submitClaim(foundItemId, answers);
      localStorage.removeItem(DRAFT_KEY(foundItemId));
      setSubmitted(true);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Submission failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-white/60 mt-4">Loading verification questions...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 shadow-lg border border-green-500/20">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-display)]">
          Claim Submitted!
        </h1>
        <p className="text-white/60 mt-3 max-w-md mx-auto">
          Your answers have been sent to the finder for review. You'll receive a notification
          once they respond. This process usually takes 24–48 hours.
        </p>
        <div className="mt-8 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-left max-w-sm mx-auto">
          <h3 className="font-semibold text-white/90 mb-3">What happens next?</h3>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-start gap-2"><span className="text-primary-500 font-bold shrink-0">1.</span> The finder reviews your answers</div>
            <div className="flex items-start gap-2"><span className="text-primary-500 font-bold shrink-0">2.</span> They approve, reject, or request more info</div>
            <div className="flex items-start gap-2"><span className="text-primary-500 font-bold shrink-0">3.</span> If approved, contact details are revealed</div>
            <div className="flex items-start gap-2"><span className="text-primary-500 font-bold shrink-0">4.</span> You arrange a safe meeting to recover your item</div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl bg-white/[0.04] text-white/80 font-medium hover:bg-white/[0.08] transition-all">
            Dashboard
          </button>
          <button onClick={() => router.push('/dashboard/claims')} className="px-6 py-3 rounded-xl gradient-primary text-white font-medium shadow-md hover:shadow-lg transition-all">
            View My Claims
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQ];
  const isLastQuestion = currentQ === totalQuestions - 1;
  const isCustom = currentQ >= mandatory.length;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : router.back()} className="p-2 rounded-xl hover:bg-white/[0.04] text-white/60">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
            Ownership Verification
          </h1>
          <p className="text-white/60 text-sm">Answer all questions to prove ownership</p>
        </div>
      </div>

      {/* Privacy Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-sm text-primary-200">
          Your answers are encrypted and only shared with the finder.
          Contact details remain hidden until the finder approves your claim.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Question {Math.min(currentQ + 1, totalQuestions)} of {totalQuestions}</span>
          <span>{Math.round(((currentQ) / totalQuestions) * 100)}% complete</span>
        </div>
        <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentQ / totalQuestions) * 100}%` }}
          />
        </div>
        <div className="flex mt-2 gap-1">
          {allQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= currentQ && setCurrentQ(i)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i < currentQ ? 'bg-primary-400' :
                i === currentQ ? 'bg-primary-500' :
                'bg-white/[0.08]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] shadow-sm overflow-hidden">
          {/* Question header */}
          <div className={`px-6 py-5 flex items-center gap-4 ${isCustom ? 'bg-accent-500/10 border-b border-accent-500/20' : 'bg-primary-500/10 border-b border-primary-500/20'}`}>
            <div className={`p-2.5 rounded-xl ${isCustom ? 'bg-accent-500/20 text-accent-400' : 'bg-primary-500/20 text-primary-400'}`}>
              {currentQuestion.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${isCustom ? 'text-accent-400' : 'text-primary-400'}`}>
                  {isCustom ? 'Finder Question' : `Mandatory — Q${currentQ + 1}`}
                </span>
              </div>
              <h2 className="text-base font-semibold text-white mt-1">{currentQuestion.label}</h2>
            </div>
          </div>

          {/* Answer area */}
          <div className="p-6">
            <p className="text-xs text-white/50 mb-3">{currentQuestion.hint}</p>
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={e => setAnswer(currentQuestion.id, e.target.value)}
              rows={5}
              placeholder="Type your answer here (minimum 5 characters)..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all resize-none text-sm"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${(answers[currentQuestion.id] || '').trim().length < 5 ? 'text-amber-500' : 'text-green-500'}`}>
                {(answers[currentQuestion.id] || '').length}/1000 characters
                {(answers[currentQuestion.id] || '').trim().length < 5 && ' (min 5)'}
              </span>
              {(answers[currentQuestion.id] || '').trim().length >= 5 && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Answered
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/70 hover:bg-white/[0.02] disabled:opacity-30 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {!isLastQuestion ? (
              <button
                onClick={() => canAdvance() && setCurrentQ(q => q + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canAdvance()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-500 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Quick overview of all answered */}
      {totalQuestions > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">Your Progress</h3>
          <div className="grid grid-cols-2 gap-2">
            {allQuestions.map((q, i) => {
              const answered = (answers[q.id] || '').trim().length >= 5;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(i)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all text-left ${
                    i === currentQ ? 'bg-primary-500/20 text-primary-300 font-medium' :
                    answered ? 'bg-green-500/10 text-green-400' :
                    'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                  }`}
                >
                  {answered
                    ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />
                    : <span className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />
                  }
                  <span className="truncate">{q.label.split('?')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback icon
function HelpIcon() {
  return <span className="w-5 h-5 text-white/50">?</span>;
}
