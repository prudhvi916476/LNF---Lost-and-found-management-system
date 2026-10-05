'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Shield, Zap, QrCode, BarChart3, Users, ArrowRight, Sparkles, Globe2,
  FileWarning, PackageCheck, CheckCircle2, Bell, TrendingUp, Plus, Clock,
  Filter, Grid, List, X, Tag, Eye, Loader2, ShieldCheck, Trash2,
  LogOut, MessageCircle, Compass, Settings,
} from 'lucide-react';
import { FloatingPaths } from '@/components/ui/background-paths';
import { TextParallaxContent } from '@/components/ui/text-parallax-content-scroll';
import { Button } from '@/components/ui/material-design-3-button';
import { useAuthStore } from '@/stores/authStore';
import { itemsApi, searchApi, matchApi, notificationsApi } from '@/lib/api';
import { toast } from 'sonner';

// ─── Animation Variants ──────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};
const letterVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 40, filter: 'blur(12px)' },
  visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Constants ────────────────────────────────────────
const CATEGORIES = ['All', 'Phone', 'Laptop', 'Wallet', 'Keys', 'Bag', 'Headphones', 'Watch', 'Electronics', 'Other'];
type DashTab = 'my-lost' | 'my-found' | 'overview';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, logout } = useAuthStore();

  // Glass base style
  const glass = 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl';
  const glassHover = 'hover:bg-white/[0.07] hover:border-white/[0.12]';

  // ─── Search State ───────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // ─── Hub State ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [stats, setStats] = useState({ activeLostItems: 0, activeFoundItems: 0, potentialMatches: 0, recoveredItems: 0, unreadNotifications: 0 });
  const [myLostItems, setMyLostItems] = useState<any[]>([]);
  const [myFoundItems, setMyFoundItems] = useState<any[]>([]);
  const [myLostLoading, setMyLostLoading] = useState(false);
  const [myFoundLoading, setMyFoundLoading] = useState(false);

  // Fetch Profile on Mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch Stats when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const [lostRes, foundRes, matchRes] = await Promise.all([
          itemsApi.getMyLostItems().catch(() => ({ data: { meta: { total: 0 }, data: [] } })),
          itemsApi.getMyFoundItems().catch(() => ({ data: { meta: { total: 0 }, data: [] } })),
          matchApi.getMatches().catch(() => ({ data: { meta: { total: 0 }, data: [] } })),
        ]);
        let unreadNotifs = 0;
        try {
          const notifRes = await notificationsApi.getUnreadCount();
          unreadNotifs = notifRes.data?.data?.count ?? notifRes.data?.data ?? 0;
          if (typeof unreadNotifs === 'object') unreadNotifs = 0;
        } catch {}
        const recoveredCount = (lostRes.data?.data || []).filter((item: any) => item.status === 'recovered').length;
        setStats({
          activeLostItems: lostRes.data?.meta?.total || 0,
          activeFoundItems: foundRes.data?.meta?.total || 0,
          potentialMatches: matchRes.data?.meta?.total || 0,
          recoveredItems: recoveredCount,
          unreadNotifications: unreadNotifs,
        });
      } catch {}
    })();
  }, [isAuthenticated]);

  // Handle Global Search (Debounced)
  useEffect(() => {
    if (!searchQuery && selectedType === 'all' && selectedCategory === 'All') {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    setHasSearched(true);
    const fetchResults = async () => {
      setSearchLoading(true);
      try {
        const res = await searchApi.search({
          query: searchQuery,
          type: selectedType === 'all' ? undefined : selectedType,
          category: selectedCategory === 'All' ? undefined : selectedCategory,
        });
        setSearchResults(res.data?.items || []);
      } catch {}
      finally { setSearchLoading(false); }
    };
    const t = setTimeout(fetchResults, 400); // 400ms debounce
    return () => clearTimeout(t);
  }, [searchQuery, selectedType, selectedCategory]);

  // Handle Hub Tabs Data
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'my-lost') {
      setMyLostLoading(true);
      itemsApi.getMyLostItems().then(res => setMyLostItems(res.data?.data || [])).catch(() => {}).finally(() => setMyLostLoading(false));
    } else if (activeTab === 'my-found') {
      setMyFoundLoading(true);
      itemsApi.getMyFoundItems().then(res => setMyFoundItems(res.data?.data || [])).catch(() => {}).finally(() => setMyFoundLoading(false));
    }
  }, [activeTab, isAuthenticated]);

  // ─── Helpers ────────────────────────────────────────
  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) return url.replace('/uploads/', '/api/uploads/');
    return url;
  };
  
  const getDisplayImageUrl = (item: any) => {
    const img = item.images?.[0];
    if (!img) return '';
    if ((item.itemType === 'found' || item.images?.[0]?.previewUrl) && img.previewUrl) return getValidImageUrl(img.previewUrl);
    return getValidImageUrl(img.url);
  };

  const handleDeleteLost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lost item report?')) return;
    try {
      await itemsApi.deleteLostItem(id);
      setMyLostItems(prev => prev.filter(i => i.id !== id));
      toast.success('Lost item report deleted');
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.response?.data?.message || err.message });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow animate-pulse">
            <Search className="w-6 h-6 text-white" />
          </div>
          <p className="text-white/40 text-sm">Loading LNF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-hidden scroll-smooth">
      {/* ─── Floating Paths Background ───────────────── */}
      <div className="fixed inset-0 z-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* ─── Global Navbar ───────────────────────────── */}
      <header className="sticky top-0 z-50 bg-surface-950/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-display)] hidden sm:block tracking-wide">LNF</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#search" className="text-white/60 hover:text-white transition-colors">Search</a>
            {!isAuthenticated && <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>}
            {!isAuthenticated && <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors">How It Works</a>}
            {isAuthenticated && <a href="#hub" className="text-white/60 hover:text-white transition-colors">Your Hub</a>}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <Bell className="w-5 h-5" />
                {stats.unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />}
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
                <span className="text-sm font-medium text-white/80 hidden md:block">{user?.fullName?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-danger-400 transition-all" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="px-5 py-2 text-sm font-semibold bg-white text-surface-900 rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────── */}
      <main className="relative z-10">
        {/* ─── HERO SECTION ────────────────────────────── */}
        {!isAuthenticated && (
          <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-16 text-center z-10">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto flex flex-col items-center">
              


              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold leading-[1] tracking-tight font-[family-name:var(--font-display)] mb-6">
                Never Lose <br className="sm:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-300 via-amber-400 to-primary-600">What Matters</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg text-white/50 max-w-2xl mx-auto mb-12">
                The universal platform to report, match, and recover lost items instantly. Join the global recovery network.
              </motion.p>

              {/* Central Search Bar */}
              <motion.div variants={itemVariants} id="search" className="max-w-2xl mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 blur-2xl rounded-3xl" />
                <div className="relative flex flex-col sm:flex-row items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-2 shadow-2xl transition-all focus-within:border-primary-500/50 focus-within:bg-white/[0.06]">
                  <div className="flex-1 flex items-center w-full">
                    <Search className="w-6 h-6 text-white/40 ml-4 mr-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a lost phone, wallet, or bag..."
                      className="flex-1 bg-transparent text-white placeholder-white/30 px-2 py-4 focus:outline-none text-base sm:text-lg w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto px-2 pb-2 sm:px-0 sm:pb-0">
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-3.5 rounded-xl border transition-all ${showFilters ? 'bg-primary-500/20 border-primary-500/30 text-primary-400' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08]'}`}>
                      <Filter className="w-5 h-5" />
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-500 text-white font-semibold shadow-glow hover:bg-primary-600 transition-all">
                      Search
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Quick Action Buttons */}
              <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
                <Link href={isAuthenticated ? "/dashboard/lost/new" : "/login?redirect=/dashboard/lost/new"} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all font-medium backdrop-blur-sm">
                  <FileWarning className="w-5 h-5 text-danger-400" /> Report Lost Item
                </Link>
                <Link href={isAuthenticated ? "/dashboard/found/new" : "/login?redirect=/dashboard/found/new"} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all font-medium backdrop-blur-sm">
                  <PackageCheck className="w-5 h-5 text-accent-400" /> I Found Something
                </Link>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* ─── LIVE SEARCH RESULTS ───────────────────── */}
        <AnimatePresence>
          {hasSearched && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 lg:px-8 max-w-7xl mx-auto mb-20"
            >
              <div className={`${glass} p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-400" /> Search Results
                  </h2>
                  <div className="flex gap-2 items-center">
                    <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden mr-2">
                      <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-white/40'}`}><Grid className="w-4 h-4" /></button>
                      <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-white/40'}`}><List className="w-4 h-4" /></button>
                    </div>
                    {(['all', 'lost', 'found'] as const).map(type => (
                      <button key={type} onClick={() => setSelectedType(type)} className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${selectedType === type ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.08]'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="mb-6 animate-slide-down">
                    <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.1]'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                ) : searchResults.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {searchResults.map((item) => (
                        <div key={item.id} onClick={() => router.push(isAuthenticated ? (item.itemType === 'found' ? `/dashboard/found/${item.id}` : `/dashboard/lost/${item.id}`) : '/login')} className={`group bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer`}>
                          <div className="h-32 bg-black/20 flex items-center justify-center relative overflow-hidden">
                            {item.images?.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={getDisplayImageUrl(item)} alt={item.itemName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <Tag className="w-6 h-6 text-white/20" />
                            )}
                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${item.itemType === 'lost' ? 'bg-danger-500 text-white' : 'bg-accent-500 text-white'}`}>
                              {item.itemType === 'lost' ? 'LOST' : 'FOUND'}
                            </span>
                            {item.status === 'matched' && <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500 text-white">MATCHED</span>}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm text-white group-hover:text-primary-300 truncate">{item.itemName}</h3>
                            <p className="text-xs text-white/40 mt-1 line-clamp-1">{item.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-white/40 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.city}</span>
                              {!isAuthenticated ? (
                                <span className="text-[10px] text-primary-400 font-semibold">Login to view</span>
                              ) : (
                                item.itemType === 'found' && item.status !== 'returned' && (
                                  <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/found/${item.id}/claim`); }} className="text-[10px] font-semibold bg-primary-500 text-white px-2.5 py-1 rounded-md hover:bg-primary-600 transition-colors">Claim</button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((item) => {
                        const href = isAuthenticated ? (item.itemType === 'found' ? `/dashboard/found/${item.id}` : `/dashboard/lost/${item.id}`) : '/login';
                        return (
                          <div key={item.id} onClick={() => router.push(href)} className={`flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] rounded-xl p-3 transition-all cursor-pointer`}>
                            <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.images?.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getDisplayImageUrl(item)} alt={item.itemName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              ) : (
                                <Tag className="w-5 h-5 text-white/20" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.itemType === 'lost' ? 'bg-danger-500/20 text-danger-400' : 'bg-accent-500/20 text-accent-400'}`}>{item.itemType.toUpperCase()}</span>
                                <h3 className="font-medium text-sm text-white truncate">{item.itemName}</h3>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city}</span>
                                <span>{item.category}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              {isAuthenticated && item.itemType === 'found' && item.status !== 'returned' && (
                                <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/found/${item.id}/claim`); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 shadow-sm transition-all flex items-center justify-center gap-1.5">
                                  <ShieldCheck className="w-3 h-3" /> Claim
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">No items found matching your search.</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ─── YOUR HUB (Authenticated Only) ─────────── */}
        {isAuthenticated && (
          <section id="hub" className="px-4 lg:px-8 max-w-7xl mx-auto mb-24">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">Your Hub</h2>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Lost Items', value: stats.activeLostItems, color: 'text-danger-400' },
                { label: 'Found Items', value: stats.activeFoundItems, color: 'text-accent-400' },
                { label: 'Matches', value: stats.potentialMatches, color: 'text-primary-400' },
                { label: 'Recovered', value: stats.recoveredItems, color: 'text-emerald-400' },
              ].map(stat => (
                <div key={stat.label} className={`${glass} p-4 text-center`}>
                  <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Hub Tabs */}
            <div className={`${glass} overflow-hidden`}>
              <div className="flex border-b border-white/[0.08]">
                <button onClick={() => setActiveTab('overview')} className={`flex-1 py-4 text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-white/[0.06] text-white border-b-2 border-primary-500' : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'}`}>Activity Overview</button>
                <button onClick={() => setActiveTab('my-lost')} className={`flex-1 py-4 text-sm font-semibold transition-all ${activeTab === 'my-lost' ? 'bg-white/[0.06] text-white border-b-2 border-primary-500' : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'}`}>My Lost Items</button>
                <button onClick={() => setActiveTab('my-found')} className={`flex-1 py-4 text-sm font-semibold transition-all ${activeTab === 'my-found' ? 'bg-white/[0.06] text-white border-b-2 border-primary-500' : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'}`}>My Found Items</button>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
                      <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                      <div className="space-y-3">
                        <Link href="/dashboard/matches" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                          <span className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary-400"/> View Potential Matches</span>
                          <ArrowRight className="w-4 h-4 text-white/30" />
                        </Link>
                        <Link href="/dashboard/map" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                          <span className="flex items-center gap-3"><MapPin className="w-4 h-4 text-warning-400"/> Explore Map</span>
                          <ArrowRight className="w-4 h-4 text-white/30" />
                        </Link>
                        <Link href="/dashboard/qr" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                          <span className="flex items-center gap-3"><QrCode className="w-4 h-4 text-white/70"/> Manage QR Tags</span>
                          <ArrowRight className="w-4 h-4 text-white/30" />
                        </Link>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 flex flex-col items-center justify-center text-center">
                      <Clock className="w-8 h-8 text-white/20 mb-3" />
                      <p className="text-white/60 text-sm">No new notifications in the last 24 hours.</p>
                      <Link href="/dashboard/notifications" className="text-primary-400 text-xs font-semibold mt-2 hover:underline">View History</Link>
                    </div>
                  </div>
                )}

                {activeTab === 'my-lost' && (
                  <div>
                    {myLostLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary-400 animate-spin"/></div>
                    ) : myLostItems.length > 0 ? (
                      <div className="grid md:grid-cols-3 gap-4">
                         {myLostItems.map((item) => (
                          <div key={item.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                            <h4 className="font-semibold text-sm mb-1 truncate">{item.itemName}</h4>
                            <p className="text-xs text-white/40 mb-3">{new Date(item.createdAt).toLocaleDateString()}</p>
                            <div className="flex gap-2">
                              <button onClick={() => router.push(`/dashboard/lost/${item.id}`)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium py-1.5 rounded transition-all">View</button>
                              <button onClick={() => handleDeleteLost(item.id)} className="px-3 bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 rounded transition-all"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </div>
                         ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/40 text-sm">You have not reported any lost items.</div>
                    )}
                  </div>
                )}

                {activeTab === 'my-found' && (
                  <div>
                    {myFoundLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary-400 animate-spin"/></div>
                    ) : myFoundItems.length > 0 ? (
                      <div className="grid md:grid-cols-3 gap-4">
                         {myFoundItems.map((item) => (
                          <div key={item.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                            <h4 className="font-semibold text-sm mb-1 truncate">{item.itemName}</h4>
                            <p className="text-xs text-white/40 mb-3">{new Date(item.createdAt).toLocaleDateString()}</p>
                            <button onClick={() => router.push(`/dashboard/found/${item.id}`)} className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium py-1.5 rounded transition-all">View</button>
                          </div>
                         ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/40 text-sm">You have not reported any found items.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── MARKETING SECTIONS ────────────────────── */}
        {!isAuthenticated && (
          <>
            {/* Features */}
            <TextParallaxContent
              imgUrl="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop"
              subheading="Find. Match. Recover."
              heading={<span>Powerful Features for <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-primary-600">Recovery</span></span>}
            >
              <section id="features" className="relative z-10 px-6 lg:px-16 pb-24 pt-8">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { icon: <Zap className="w-6 h-6" />, title: 'AI Smart Matching', description: 'Our AI engine compares descriptions, images, locations, and timing to automatically match lost items with found reports.', gradient: 'from-primary-500 to-primary-700' },
                    { icon: <QrCode className="w-6 h-6" />, title: 'QR Smart Tags', description: 'Register your valuables with unique QR codes. When someone finds your item, they scan the tag and you get notified instantly.', gradient: 'from-accent-400 to-accent-600' },
                    { icon: <MapPin className="w-6 h-6" />, title: 'Interactive Maps', description: 'View lost and found items on an interactive map with heatmaps, radius search, and location-based alerts.', gradient: 'from-warning-400 to-warning-500' },
                    { icon: <Shield className="w-6 h-6" />, title: 'Secure Verification', description: 'Dynamic verification questions and evidence upload prevent fraudulent claims and ensure items go to rightful owners.', gradient: 'from-danger-400 to-danger-500' },
                    { icon: <Globe2 className="w-6 h-6" />, title: 'Organization Portals', description: 'Custom branded portals for universities, airports, and companies to manage lost and found at scale.', gradient: 'from-primary-400 to-accent-500' },

                  ].map((feature, i) => (
                    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.1 }} key={feature.title} className={`group p-6 ${glass} ${glassHover} transition-all duration-500 ease-out hover:-translate-y-1`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-500 ease-out`}>{feature.icon}</div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </TextParallaxContent>

            {/* How It Works */}
            <TextParallaxContent
              imgUrl="https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?q=80&w=2564&auto=format&fit=crop"
              subheading="Simple Process"
              heading={<span>How <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-primary-600">LNF</span> Works</span>}
            >
              <section id="how-it-works" className="relative z-10 px-6 lg:px-16 pb-24 pt-8">
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Report', description: 'Lost something? Report it with details, photos, and location. Found something? Submit it in seconds.', icon: <Search className="w-8 h-8" /> },
                    { step: '02', title: 'Match', description: 'Our AI engine automatically scans and matches your report against thousands of listings using text, image, and location analysis.', icon: <Sparkles className="w-8 h-8" /> },
                    { step: '03', title: 'Recover', description: "Verify ownership, chat securely with the finder, and arrange recovery. Track your item's journey every step of the way.", icon: <Shield className="w-8 h-8" /> },
                  ].map((step, i) => (
                    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.1 }} key={step.step} className="relative text-center">
                      <div className="text-7xl font-extrabold text-white/[0.03] absolute top-0 left-1/2 -translate-x-1/2 font-[family-name:var(--font-display)]">{step.step}</div>
                      <div className="relative pt-8">
                        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white mx-auto mb-4 shadow-glow">{step.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed">{step.description}</p>
                      </div>
                      {i < 2 && (
                        <div className="hidden md:block absolute top-1/2 -right-4 w-8">
                          <ArrowRight className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            </TextParallaxContent>
          </>
        )}
      </main>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="relative z-10 px-6 lg:px-16 py-12 border-t border-white/5 mt-12 bg-black/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Search className="w-4 h-4 text-white" /></div>
            <span className="font-bold tracking-widest text-white/90">LNF</span>
          </div>
          <p className="text-sm text-white/40">© 2026 LNF. Universal Lost & Found Recovery Network.</p>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
