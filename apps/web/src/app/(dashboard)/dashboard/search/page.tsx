'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search as SearchIcon, Filter, MapPin, ShieldCheck,
  Grid, List, X, Clock, Tag, ArrowRight, Eye, Loader2
} from 'lucide-react';
import { searchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const CATEGORIES = ['All', 'Phone', 'Laptop', 'Wallet', 'Keys', 'Bag', 'Headphones', 'Watch', 'Electronics', 'Other'];

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await searchApi.search({
          query,
          type: selectedType === 'all' ? undefined : selectedType,
          category: selectedCategory === 'All' ? undefined : selectedCategory,
        });
        // API returns { success, items: [...], meta: {...} }
        setResults(res.data?.items || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedType, selectedCategory]);

  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  };

  /** For found items, prefer the anonymised preview; for lost items use the original */
  const getDisplayImageUrl = (item: any) => {
    const img = item.images?.[0];
    if (!img) return '';
    if (item.itemType === 'found' && img.previewUrl) {
      return getValidImageUrl(img.previewUrl);
    }
    return getValidImageUrl(img.url);
  };

  const getDetailHref = (item: any) =>
    item.itemType === 'found'
      ? `/dashboard/found/${item.id}`
      : `/dashboard/lost/${item.id}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">Search Items</h1>
        <p className="text-white/60 mt-1">Search through lost and found items near you</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item name, description, brand..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3.5 rounded-2xl border transition-all ${showFilters ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' : 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border-white/[0.12] text-white/60 hover:bg-white/[0.02]'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] rounded-xl overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-500/10 text-primary-400' : 'text-white/50'}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-500/10 text-primary-400' : 'text-white/50'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type Toggle */}
      <div className="flex items-center gap-2">
        {(['all', 'lost', 'found'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedType === type
                ? type === 'lost' ? 'bg-danger-500 text-white shadow-md' : type === 'found' ? 'bg-accent-500 text-white shadow-md' : 'gradient-primary text-white shadow-md'
                : 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-white/70 border border-white/[0.12] hover:bg-white/[0.02]'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.12] p-5 shadow-sm animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-white/50 hover:text-white/70">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat ? 'bg-primary-500 text-white' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04]'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-white/60">{results.length} results found</p>
          {loading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
        </div>
      </div>

      {/* Results Grid */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item, i) => {
            const href = getDetailHref(item);
            return (
              <div
                key={item.id}
                onClick={() => router.push(href)}
                className="group bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] overflow-hidden hover:shadow-lg hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center relative overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getDisplayImageUrl(item)}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <Tag className="w-8 h-8 text-white/40 hidden fallback-icon absolute" />
                    </>
                  ) : (
                    <Tag className="w-8 h-8 text-white/40" />
                  )}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm ${item.itemType === 'lost' ? 'bg-danger-500 text-white' : 'bg-accent-500 text-white'}`}>
                    {item.itemType === 'lost' ? 'LOST' : 'FOUND'}
                  </span>
                  {item.itemType === 'found' && item.images?.[0]?.previewUrl && (
                    <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <ShieldCheck className="w-2.5 h-2.5" /> Protected
                    </span>
                  )}
                  {item.status === 'matched' && (
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-500 text-white">MATCHED</span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">{item.itemName}</h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.description}</p>

                  <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-white/70">{item.category}</span>
                    {item.color && <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-white/70">{item.color}</span>}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(href); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.02] text-white/80 text-sm font-medium hover:bg-white/[0.04] transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {item.itemType === 'found' && item.status !== 'returned' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/found/${item.id}/claim`); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium shadow-sm hover:bg-primary-600 hover:shadow-md transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Claim Item
                      </button>
                    ) : item.itemType === 'found' ? (
                      <div className="flex-1 flex items-center justify-center py-2 text-sm text-white/50">
                        Returned
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((item, i) => {
            const href = getDetailHref(item);
            return (
              <div
                key={item.id}
                onClick={() => router.push(href)}
                className="flex items-center gap-4 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl border border-white/[0.08] p-4 hover:shadow-md hover:bg-white/[0.02]/50 transition-all animate-slide-up cursor-pointer"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="w-16 h-16 rounded-xl bg-white/[0.02] flex items-center justify-center shrink-0 overflow-hidden relative">
                  {item.images && item.images.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getDisplayImageUrl(item)}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <Tag className="w-6 h-6 text-white/40 hidden fallback-icon absolute" />
                    </>
                  ) : (
                    <Tag className="w-6 h-6 text-white/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.itemType === 'lost' ? 'bg-danger-500/10 text-danger-400' : 'bg-accent-500/10 text-accent-400'}`}>
                      {item.itemType.toUpperCase()}
                    </span>
                    <h3 className="font-medium text-white truncate">{item.itemName}</h3>
                  </div>
                  <p className="text-xs text-white/60 mt-1 truncate">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city}</span>
                    <span>{item.category}</span>
                    <span>{item.createdAt}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(href); }}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 bg-white/[0.02] hover:bg-white/[0.04] hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                  {item.itemType === 'found' && item.status !== 'returned' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/found/${item.id}/claim`); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 shadow-sm hover:shadow-md transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Claim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
