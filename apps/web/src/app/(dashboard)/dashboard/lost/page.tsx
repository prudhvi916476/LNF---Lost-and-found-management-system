'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Tag, MapPin, Clock, Loader2, Eye, ArrowRight, Trash2 } from 'lucide-react';
import { itemsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function MyLostItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await itemsApi.getMyLostItems();
        setItems(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load my lost items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    // Fix legacy URLs that were saved without the /api prefix
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lost item report?')) return;
    try {
      await itemsApi.deleteLostItem(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success('Lost item report deleted');
    } catch (err: any) {
      toast.error('Failed to delete item', { description: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
            My Lost Items
          </h1>
          <p className="text-white/60 mt-1">Track the items you have reported as lost</p>
        </div>
        <Link
          href="/dashboard/lost/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Report Lost Item
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-white/50" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No lost items reported</h3>
          <p className="text-white/60 mb-6 max-w-sm mx-auto">
            You haven't reported any lost items yet. If you lose something, report it here so our AI can help you find it.
          </p>
          <Link
            href="/dashboard/lost/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            Report an item
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => router.push(`/dashboard/lost/${item.id}`)}
              className="group bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] overflow-hidden hover:shadow-lg hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="h-40 bg-gradient-to-br from-danger-50 to-danger-100 flex items-center justify-center relative overflow-hidden">
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
                    <Tag className="w-8 h-8 text-danger-300 hidden fallback-icon absolute" />
                  </>
                ) : (
                  <Tag className="w-8 h-8 text-danger-300" />
                )}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger-500 text-white shadow-sm">
                  LOST
                </span>
                {item.images?.[0]?.previewUrl && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md shadow-sm">
                    NEGATIVE
                  </span>
                )}
                {item.status === 'matched' && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-500 text-white shadow-sm">MATCHED</span>
                )}
                {item.status === 'recovered' && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white shadow-sm">RECOVERED</span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">{item.itemName}</h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.description}</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city || 'Location unavailable'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-white/70">{item.category}</span>
                  {item.color && <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-white/70">{item.color}</span>}
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.02] text-white/80 text-sm font-medium group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-all">
                    <Eye className="w-4 h-4" />
                    View Details
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="flex items-center justify-center p-2 px-3 rounded-xl bg-white/[0.02] text-white/50 hover:bg-danger-500/10 hover:text-danger-400 transition-all"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
