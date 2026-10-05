'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col items-center py-24 px-6 lg:px-16">
      <div className="max-w-3xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold mb-8 font-[family-name:var(--font-display)]">Contact Us</h1>
        <p className="text-xl text-surface-300 mb-12">Have questions or need assistance? We're here to help.</p>
        
        <div className="grid md:grid-cols-1 gap-8 mb-12 max-w-xl mx-auto">
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Email Support</h3>
            <p className="text-surface-400 mb-4">Our team typically responds within 24 hours.</p>
            <a href="mailto:prudhvi916476@gmail.com" className="text-primary-400 hover:text-primary-300 transition-colors">prudhvi916476@gmail.com</a>
          </div>
        </div>

        <form className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-6" onSubmit={(e) => e.preventDefault()}>
          <h3 className="text-2xl font-semibold mb-4">Send us a message</h3>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Name</label>
            <input type="text" required className="w-full bg-surface-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Email</label>
            <input type="email" required className="w-full bg-surface-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Message</label>
            <textarea required className="w-full bg-surface-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]" placeholder="How can we help you?"></textarea>
          </div>
          <button type="submit" className="px-8 py-4 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
