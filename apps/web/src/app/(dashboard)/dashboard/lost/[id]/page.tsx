'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { itemsApi } from '@/lib/api';
import { ArrowLeft, MapPin, Clock, Tag, Loader2, Calendar, AlertCircle } from 'lucide-react';

export default function LostItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await itemsApi.getLostItem(id);
        setItem(res.data?.data || res.data);
      } catch (err: any) {
        console.error('Failed to load item:', err);
        setError(err.response?.data?.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchItem();
    }
  }, [id]);

  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="bg-danger-500/10 border border-danger-500/20 rounded-2xl p-8 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-danger-900 mb-2">Item Not Found</h2>
        <p className="text-danger-300 mb-6">{error || "The item you're looking for doesn't exist or has been removed."}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-danger-300 font-medium shadow-sm hover:shadow-md transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] text-white/70 hover:bg-white/[0.02] hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1 font-[family-name:var(--font-display)]">Item Details</h1>
      </div>

      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.12] overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-2 gap-0">
          
          {/* Left Column: Image */}
          <div className="bg-white/[0.02] relative min-h-[300px] md:min-h-full flex items-center justify-center border-b md:border-b-0 md:border-r border-white/[0.12]">
            {item.images && item.images.length > 0 ? (
              <img 
                src={getValidImageUrl(item.images[0].url)} 
                alt={item.itemName} 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <Tag className={`w-16 h-16 text-white/40 ${item.images && item.images.length > 0 ? 'hidden fallback-icon absolute' : ''}`} />
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-danger-500 text-white shadow-md">
                LOST
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-900/80 backdrop-blur-md text-white shadow-md">
                {item.category}
              </span>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{item.itemName}</h2>
              <p className="text-white/70 leading-relaxed">{item.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.08]">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Location</span>
                </div>
                <p className="font-medium text-white">{item.locationAddress || item.city || 'Unknown'}</p>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.08]">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Date Lost</span>
                </div>
                <p className="font-medium text-white">
                  {item.lostDate ? new Date(item.lostDate).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <h3 className="font-semibold text-white">Additional Information</h3>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                  <span className="text-white/60">Brand</span>
                  <span className="font-medium text-white">{item.brand || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                  <span className="text-white/60">Model</span>
                  <span className="font-medium text-white">{item.model || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                  <span className="text-white/60">Color</span>
                  <span className="font-medium text-white">{item.color || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                  <span className="text-white/60">Time Approx</span>
                  <span className="font-medium text-white">{item.lostTimeApprox || '-'}</span>
                </div>
                {item.rewardAmount && (
                  <div className="flex justify-between items-center py-2 border-b border-white/[0.02] col-span-2">
                    <span className="text-white/60">Reward</span>
                    <span className="font-bold text-emerald-600">${item.rewardAmount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 flex items-center gap-3">
              <button 
                onClick={() => router.push('/dashboard/search')}
                className="flex-1 py-3 rounded-xl bg-primary-500/10 text-primary-400 font-semibold hover:bg-primary-500/20 transition-all text-center"
              >
                Search Matches
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
