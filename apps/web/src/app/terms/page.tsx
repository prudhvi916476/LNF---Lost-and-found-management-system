'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col items-center py-24 px-6 lg:px-16">
      <div className="max-w-3xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold mb-8 font-[family-name:var(--font-display)]">Terms of Service</h1>
        <div className="space-y-6 text-surface-300 leading-relaxed">
          <p>Last updated: June 2026</p>
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using the LNF (Lost & Found) platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
          
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">2. User Responsibilities</h2>
          <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
          
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">3. Reporting Items</h2>
          <p>When reporting a lost or found item, you agree to provide accurate and complete information. False claims or attempts to claim items that do not belong to you may result in account termination and legal action.</p>

          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">4. Platform Role</h2>
          <p>LNF acts as a facilitator to connect people who have lost items with those who have found them. We do not take possession of any items and are not responsible for the condition or return of any property.</p>
        </div>
      </div>
    </div>
  );
}
