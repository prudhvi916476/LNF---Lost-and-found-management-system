'use client';

import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface GoogleButtonProps {
  text?: string;
  variant?: 'hero' | 'navbar' | 'auth' | 'minimal';
  redirect?: string;
  className?: string;
  onSuccessCallback?: () => void;
  disabled?: boolean;
}

export function GoogleButton({
  text = 'Continue with Google',
  variant = 'auth',
  redirect = '/dashboard',
  className = '',
  onSuccessCallback,
  disabled = false,
}: GoogleButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { googleLogin } = useAuthStore();
  const router = useRouter();

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsAuthenticating(true);
      try {
        await googleLogin(tokenResponse.access_token);
        toast.success('Successfully signed in with Google!');
        if (onSuccessCallback) {
          onSuccessCallback();
        }
        if (redirect) {
          router.push(redirect);
        }
      } catch (err: any) {
        toast.error('Google sign-in failed', {
          description: err.response?.data?.message || err.message || 'Authentication error. Please try again.',
        });
      } finally {
        setIsAuthenticating(false);
      }
    },
    onError: (errorResponse) => {
      setIsAuthenticating(false);
      toast.error('Google sign-in error', {
        description: errorResponse.error_description || 'Unable to authenticate with Google.',
      });
    },
    onNonOAuthError: (nonOAuthError) => {
      setIsAuthenticating(false);
      if (nonOAuthError.type !== 'popup_closed') {
        toast.error('Unable to open Google sign-in window');
      }
    },
  });

  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  // Variant styling
  let variantStyles = '';
  switch (variant) {
    case 'hero':
      variantStyles =
        'px-6 py-3.5 rounded-2xl bg-white text-surface-950 font-semibold shadow-xl hover:shadow-2xl hover:bg-surface-100 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 border border-white/20';
      break;
    case 'navbar':
      variantStyles =
        'px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-medium transition-all duration-200 hover:border-white/30 backdrop-blur-md';
      break;
    case 'minimal':
      variantStyles =
        'px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all';
      break;
    case 'auth':
    default:
      variantStyles =
        'w-full py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium transition-all duration-200 active:scale-[0.99]';
      break;
  }

  return (
    <button
      type="button"
      onClick={() => handleLogin()}
      disabled={disabled || isAuthenticating}
      className={`inline-flex items-center justify-center gap-3 select-none disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${className}`}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
