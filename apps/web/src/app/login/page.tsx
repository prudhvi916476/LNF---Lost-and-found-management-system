'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { GoogleButton } from '../../components/ui/google-button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { login, devLogin } = useAuthStore();
  
  const {
    register,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    const emailValue = (document.getElementById('email') as HTMLInputElement)?.value?.trim();
    const passwordValue = (document.getElementById('password') as HTMLInputElement)?.value;

    if (!emailValue || !passwordValue) {
      setAuthError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      await login(emailValue, passwordValue, recaptchaToken || 'dev-recaptcha-token');
      router.push(redirect || '/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setAuthError(msg || 'Invalid email or password. Please try again.');
      } else {
        // Fallback for dev mode
        devLogin({
          email: emailValue,
          fullName: emailValue.includes('@') ? emailValue.split('@')[0] : 'Developer User',
        });
        router.push(redirect || '/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-white flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwVjBoLTJ2MzRoMnptLTQgMFYwaC0ydjM0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Search className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-[family-name:var(--font-display)]">LNF</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight font-[family-name:var(--font-display)]">
            Welcome back to the
            <br />
            <span className="text-white/90">Recovery Network</span>
          </h1>
          <p className="mt-4 text-white/60 text-lg max-w-md">
            Track your lost items, check for matches, and connect with finders securely.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { value: '89%', label: 'Average recovery rate' },
              { value: '<24h', label: 'Average match time' },
              { value: '256-bit', label: 'End-to-end encryption' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
                <span className="text-white/80">
                  <strong className="text-white">{stat.value}</strong> {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 relative py-12">
        <Link href="/" className="absolute top-8 left-6 lg:left-16 flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">LNF</span>
          </div>

          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)]">Sign In</h2>
          <p className="mt-2 text-surface-400">Enter your credentials to access your dashboard</p>

          {authError && (
            <div className="mt-6 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSignIn} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border ${errors.email ? 'border-danger-500/50 focus:ring-danger-500' : 'border-white/10 focus:ring-primary-500'} text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-danger-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter your password"
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border ${errors.password ? 'border-danger-500/50 focus:ring-danger-500' : 'border-white/10 focus:ring-primary-500'} text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-danger-400">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-surface-400">
                <input type="checkbox" className="rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-primary-400 hover:text-primary-300 transition-colors">Forgot password?</Link>
            </div>

            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                theme="dark"
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-surface-500">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Sign In */}
          <div className="mt-6">
            <GoogleButton
              variant="auth"
              text="Continue with Google"
              redirect={redirect || '/dashboard'}
            />
          </div>

          <p className="mt-8 text-center text-sm text-surface-400">
            Don&apos;t have an account?{' '}
            <Link href={`/register${redirect ? `?redirect=${redirect}` : ''}`} className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
