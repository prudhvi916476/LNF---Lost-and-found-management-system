'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Cookie, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

type ConsentLevel = 'all' | 'essential' | null;

const CONSENT_COOKIE_NAME = 'lnf_cookie_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function getStoredConsent(): ConsentLevel {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  if (value === 'all' || value === 'essential') return value;
  return null;
}

function storeConsent(level: 'all' | 'essential') {
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(level)}; max-age=${CONSENT_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

interface CookieConsentProps {
  onConsentChange?: (level: 'all' | 'essential') => void;
}

export default function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show banner only if no consent has been recorded
    const stored = getStoredConsent();
    if (!stored) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback((level: 'all' | 'essential') => {
    setIsExiting(true);
    storeConsent(level);
    onConsentChange?.(level);
    setTimeout(() => setVisible(false), 400);
  }, [onConsentChange]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 transition-all duration-400 ${
        isExiting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
    >
      <div className="max-w-4xl mx-auto bg-surface-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm leading-tight">We use cookies</h2>
            <p className="text-surface-400 text-xs mt-0.5 leading-relaxed">
              LNF uses cookies to keep you signed in and improve your experience. We never sell your data.{' '}
              <Link href="/privacy" className="text-primary-400 hover:text-primary-300 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
          <button
            onClick={() => dismiss('essential')}
            className="p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
            aria-label="Close and accept essential cookies only"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cookie categories (expandable) */}
        {showDetails && (
          <div className="px-5 py-3 space-y-3 border-b border-white/[0.06]">
            {[
              {
                name: 'Essential Cookies',
                desc: 'Required for authentication, session management, and security. Cannot be disabled.',
                examples: 'lnf_cookie_consent, JWT access & refresh tokens',
                locked: true,
              },
              {
                name: 'Functional Cookies',
                desc: 'Remember your preferences such as theme, view mode, and language.',
                examples: 'findit_view_mode, findit_theme',
                locked: false,
              },
              {
                name: 'Analytics',
                desc: 'Help us understand how the app is used so we can improve it. No personally identifiable data is collected.',
                examples: 'Page views, feature usage metrics',
                locked: false,
              },
            ].map((cat) => (
              <div key={cat.name} className="flex gap-3 items-start">
                <div className="mt-0.5">
                  {cat.locked ? (
                    <ShieldCheck className="w-4 h-4 text-accent-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20 bg-primary-500/20 shrink-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{cat.name} {cat.locked && <span className="text-accent-400 text-[10px] ml-1">Always on</span>}</p>
                  <p className="text-surface-400 text-xs mt-0.5">{cat.desc}</p>
                  <p className="text-surface-500 text-[11px] mt-0.5 italic">{cat.examples}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1.5 text-surface-400 hover:text-white text-xs transition-colors self-start"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showDetails ? 'Hide details' : 'Cookie details'}
          </button>

          <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
            <button
              id="cookie-reject-btn"
              onClick={() => dismiss('essential')}
              className="px-4 py-2 rounded-xl border border-white/10 text-surface-400 hover:text-white hover:border-white/20 text-xs font-medium transition-all"
            >
              Essential only
            </button>
            <button
              id="cookie-accept-btn"
              onClick={() => dismiss('all')}
              className="px-5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Helper hook to read the current consent level anywhere in the app */
export function useCookieConsent(): ConsentLevel {
  const [consent, setConsent] = useState<ConsentLevel>(null);
  useEffect(() => {
    setConsent(getStoredConsent());
  }, []);
  return consent;
}
