'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '../../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (!recaptchaToken) {
      setError('Please complete the CAPTCHA validation.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email: data.email, recaptchaToken });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
            Reset Your
            <br />
            <span className="text-white/90">Password</span>
          </h1>
          <p className="mt-4 text-white/60 text-lg max-w-md">
            Don't worry, we'll send you an email with a secure link to reset your password and get you back into your account.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 relative py-12">
        <Link href="/login" className="absolute top-8 left-6 lg:left-16 flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Login</span>
        </Link>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">LNF</span>
          </div>

          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)]">Forgot Password?</h2>
          <p className="mt-2 text-surface-400">Enter your email and we'll send a reset link.</p>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="mt-8 text-center bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-success-500/20 text-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-display)]">Email Sent!</h3>
              <p className="text-surface-400 mb-6">
                If an account exists with that email, we have sent a password reset link. Please check your inbox.
              </p>
              <Link href="/login" className="inline-block px-6 py-3 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:shadow-xl transition-all">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
