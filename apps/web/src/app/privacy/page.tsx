'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col items-center py-24 px-6 lg:px-16">
      <div className="max-w-3xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold mb-8 font-[family-name:var(--font-display)]">Privacy Policy</h1>
        <div className="space-y-6 text-surface-300 leading-relaxed">
          <p>Last updated: June 2026</p>
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create or modify your account, report a lost item, report a found item, contact customer support, or otherwise communicate with us. This may include your name, email address, phone number, and any other information you choose to provide.</p>
          
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to operate and improve our platform, match lost and found items, communicate with you, and personalize your experience. We do not sell your personal information to third parties.</p>
          
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">3. Data Security</h2>
          <p>We implement reasonable security measures to protect the confidentiality, security, and integrity of your personal information. However, please be aware that no security measures are perfect or impenetrable.</p>
          
          <h2 className="text-2xl text-white font-semibold mt-8 mb-4">4. Location Information</h2>
          <p>When you report an item, we may collect and process information about your actual location. We use various technologies to determine location, including IP address, GPS, and other sensors.</p>
        </div>
      </div>
    </div>
  );
}
