'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileWarning, PackageCheck, Sparkles, CheckCircle2,
  Bell, TrendingUp, ArrowRight, Clock, Plus, Search,
  MapPin, MessageCircle, Shield,
} from 'lucide-react';
import { itemsApi, matchApi, notificationsApi } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeLostItems: 0,
    activeFoundItems: 0,
    potentialMatches: 0,
    recoveredItems: 0,
    unreadNotifications: 0,
  });

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lostRes, foundRes, matchRes] = await Promise.all([
          itemsApi.getMyLostItems().catch(() => ({ data: { meta: { total: 0 }, data: [] } })),
          itemsApi.getMyFoundItems().catch(() => ({ data: { meta: { total: 0 }, data: [] } })),
          matchApi.getMatches().catch(() => ({ data: { meta: { total: 0 }, data: [] } })) // Handle optionally
        ]);

        const lostTotal = lostRes.data?.meta?.total || 0;
        const foundTotal = foundRes.data?.meta?.total || 0;
        const matchesTotal = matchRes.data?.meta?.total || 0;
        
        let unreadNotifs = 0;
        try {
          const notifRes = await notificationsApi.getUnreadCount();
          unreadNotifs = notifRes.data?.data?.count ?? notifRes.data?.data ?? 0;
          if (typeof unreadNotifs === 'object') unreadNotifs = 0;
        } catch (e) {
          // Ignore if notifications aren't fully implemented
        }

        const recoveredCount = (lostRes.data?.data || []).filter((item: any) => item.status === 'recovered').length;

        setStats({
          activeLostItems: lostTotal,
          activeFoundItems: foundTotal,
          potentialMatches: matchesTotal,
          recoveredItems: recoveredCount,
          unreadNotifications: unreadNotifs,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Active Lost Reports', value: stats.activeLostItems, icon: FileWarning, color: 'from-danger-400 to-danger-500', bgGlow: 'shadow-danger-400/20', href: '/dashboard/lost' },
    { label: 'Active Found Reports', value: stats.activeFoundItems, icon: PackageCheck, color: 'from-accent-400 to-accent-500', bgGlow: 'shadow-accent-400/20', href: '/dashboard/found' },
    { label: 'Potential Matches', value: stats.potentialMatches, icon: Sparkles, color: 'from-primary-400 to-primary-600', bgGlow: 'shadow-primary-400/20', href: '/dashboard/matches' },
    { label: 'Recovered Items', value: stats.recoveredItems, icon: CheckCircle2, color: 'from-emerald-400 to-emerald-600', bgGlow: 'shadow-emerald-400/20', href: '/dashboard' },
    { label: 'Notifications', value: stats.unreadNotifications, icon: Bell, color: 'from-warning-400 to-warning-500', bgGlow: 'shadow-warning-400/20', href: '/dashboard/notifications' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
            Dashboard
          </h1>
          <p className="text-white/60 mt-1">Welcome to LNF! Here is how to get started:</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/lost/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Report Lost
          </Link>
          <Link
            href="/dashboard/found/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Report Found
          </Link>
        </div>
      </div>



      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={card.label}
            href={card.href}
            className={`group relative p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] hover:shadow-lg ${card.bgGlow} transition-all duration-300 hover:-translate-y-1 animate-slide-up`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-xs text-white/60 mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Search Items', icon: Search, href: '/dashboard/search', color: 'bg-primary-500/10 text-primary-400' },
                { label: 'View Matches', icon: Sparkles, href: '/dashboard/matches', color: 'bg-accent-500/10 text-accent-400' },
                { label: 'Open Map', icon: MapPin, href: '/dashboard/map', color: 'bg-warning-50 text-warning-600' },
                { label: 'My QR Tags', icon: Shield, href: '/dashboard/qr', color: 'bg-white/[0.02] text-white/70' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-white/80 flex-1">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recovery Rate Card */}
          <div className="mt-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-glow">
            <TrendingUp className="w-8 h-8 mb-3 text-white/80" />
            <div className="text-3xl font-bold">0%</div>
            <div className="text-sm text-white/70 mt-1">Recovery Rate</div>
            <div className="mt-4 w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]/20 rounded-full h-2">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-full h-2 transition-all duration-1000" style={{ width: '0%' }} />
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <Link href="/dashboard/notifications" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p>No recent activity yet.</p>
                  <p className="text-sm">Report an item to get started!</p>
                </div>
              ) : (
                activities.map((activity: any, i) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-all animate-slide-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center shrink-0`}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-white/60 mt-0.5 truncate">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/50 shrink-0">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
