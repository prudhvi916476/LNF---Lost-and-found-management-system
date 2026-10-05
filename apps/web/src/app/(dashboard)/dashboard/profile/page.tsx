'use client';

import { useAuthStore } from '../../../../stores/authStore';
import { User, Mail, Shield, Award, Edit3, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { reputationApi } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reputationApi.getMyBadges().then(res => {
      setBadges(res.data?.data || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-white/60">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
          My Profile
        </h1>
        <p className="text-white/60 mt-1">Manage your account details and view your reputation.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.12] p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-glow">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <h2 className="text-xl font-bold text-white">{user?.fullName}</h2>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-white/60">
              <Mail className="w-4 h-4" />
              {user?.email}
            </div>
            
            <div className="mt-4 px-3 py-1 bg-primary-500/10 text-primary-300 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {user?.role}
            </div>

            <button className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 border border-white/[0.12] rounded-xl text-white/80 hover:bg-white/[0.02] transition-all font-medium text-sm">
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Right Column: Reputation & Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.12] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-warning-500" />
              Reputation & Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.08]">
                <div className="text-sm text-white/60 mb-1">Reputation Points</div>
                <div className="text-2xl font-bold text-white">{user?.reputationPoints || 0}</div>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.08]">
                <div className="text-sm text-white/60 mb-1">Account Status</div>
                <div className="text-lg font-medium text-emerald-600 flex items-center gap-1">
                  {user?.isVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/[0.08]">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">Recent Badges {loading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}</h4>
              <div className="flex gap-2">
                {badges.length === 0 && !loading && (
                  <div className="text-xs text-white/50">No badges earned yet.</div>
                )}
                {badges.map((badge: any) => (
                  <div key={badge.id} className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-white/70 border border-white/[0.12]" title={badge.name}>
                    <Award className="w-5 h-5" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2">Badges you earn by helping the community will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
