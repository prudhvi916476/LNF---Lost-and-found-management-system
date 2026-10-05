'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Tag, MapPin, Clock, Loader2, Eye, ArrowRight, ShieldCheck } from 'lucide-react';
import { itemsApi } from '@/lib/api';

export default function MyFoundItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await itemsApi.getMyFoundItems();
        setItems(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load my found items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
            My Found Items
          </h1>
          <p className="text-white/60 mt-1">Track the items you have reported as found</p>
        </div>
        <Link
          href="/dashboard/found/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Report Found Item
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-white/50" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No found items reported</h3>
          <p className="text-white/60 mb-6 max-w-sm mx-auto">
            You haven't reported any found items yet. If you find something, report it here so we can help return it to its owner.
          </p>
          <Link
            href="/dashboard/found/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            Report an item
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => router.push(`/dashboard/found/${item.id}`)}
              className="group bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] overflow-hidden hover:shadow-lg hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="h-40 bg-gradient-to-br from-accent-50 to-accent-100 flex items-center justify-center relative overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getValidImageUrl(item.images[0].previewUrl || item.images[0].url)}
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <Tag className="w-8 h-8 text-accent-300 hidden fallback-icon absolute" />
                  </>
                ) : (
                  <Tag className="w-8 h-8 text-accent-300" />
                )}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-500 text-white shadow-sm">
                  FOUND
                </span>
                {item.images?.[0]?.previewUrl && (
                  <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Protected
                  </span>
                )}
                {item.status === 'matched' && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-500 text-white">MATCHED</span>
                )}
                {item.status === 'returned' && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white">RETURNED</span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white group-hover:text-accent-400 transition-colors">{item.itemName}</h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.description}</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city || 'Location unavailable'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-white/70">{item.category}</span>
                  {item.color && <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-white/70">{item.color}</span>}
                </div>

                <div className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.02] text-white/80 text-sm font-medium group-hover:bg-accent-500/10 group-hover:text-accent-400 transition-all">
                  <Eye className="w-4 h-4" />
                  View Details
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
