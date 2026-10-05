'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Bell, MessageCircle, Settings, LogOut, Loader2
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { FloatingPaths } from '@/components/ui/background-paths';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, logout } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow animate-pulse">
            <Search className="w-6 h-6 text-white" />
          </div>
          <p className="text-white/40 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading LNF...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-hidden scroll-smooth flex flex-col">
      {/* Background Theme */}
      <div className="fixed inset-0 z-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Global Navbar */}
      <header className="sticky top-0 z-50 bg-surface-950/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-4 cursor-pointer">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-display)] hidden sm:block tracking-wide">LNF</span>
          </Link>

          {/* Minimal Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium z-10">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">Overview</Link>
            <Link href="/dashboard/search" className="text-white/60 hover:text-white transition-colors">Search</Link>
            <Link href="/dashboard/matches" className="text-white/60 hover:text-white transition-colors">Matches</Link>
            <Link href="/dashboard/claims" className="text-white/60 hover:text-white transition-colors">Claims</Link>
            <Link href="/dashboard/map" className="text-white/60 hover:text-white transition-colors">Map</Link>
          </div>

          <div className="flex items-center gap-2 z-10">
            <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
            </Link>
            <Link href="/dashboard/messages" className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all hidden sm:block">
              <MessageCircle className="w-5 h-5" />
            </Link>
            <Link href="/dashboard/settings" className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all hidden sm:block">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-white/80 hidden lg:block">{user?.fullName?.split(' ')[0]}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-danger-400 transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
