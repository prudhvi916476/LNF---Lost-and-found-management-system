'use client';

import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export function GoogleOneTap() {
  const { isAuthenticated, isLoading, googleLogin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // One Tap is only meant for public landing/auth pages, never inside dashboard routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const shouldDisable = isAuthenticated || isLoading || isDashboardRoute;

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      if (!credentialResponse.credential) return;

      try {
        await googleLogin(credentialResponse.credential);
        toast.success('Signed in with Google successfully!');

        // If currently on login or register page, redirect to dashboard
        if (pathname === '/login' || pathname === '/register') {
          router.push('/dashboard');
        }
      } catch (err: any) {
        toast.error('Google sign-in failed', {
          description: err.response?.data?.message || err.message || 'Please try again.',
        });
      }
    },
    onError: () => {
      // One Tap was either dismissed, aborted, or unavailable in this browser context
    },
    disabled: shouldDisable,
    use_fedcm_for_prompt: false,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  return null;
}
