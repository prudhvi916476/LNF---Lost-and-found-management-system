'use client';

import { Filter, X, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { itemsApi } from '@/lib/api';

const InteractiveMap = dynamic(() => import('../../../../components/map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white/[0.04] text-white/60 animate-pulse">
      Loading interactive map...
    </div>
  ),
});

export default function MapPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['lost', 'found']);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [lostRes, foundRes] = await Promise.all([
          itemsApi.getLostItems({ limit: 100 }).catch(() => ({ data: { data: [] } })),
          itemsApi.getFoundItems({ limit: 100 }).catch(() => ({ data: { data: [] } }))
        ]);
        
        const lost = (lostRes.data?.data || []).map((i: any) => ({
          id: i.id,
          lat: i.locationLat,
          lng: i.locationLng,
          type: 'lost',
          name: i.itemName,
          status: i.status
        })).filter((i: any) => i.lat && i.lng);

        const found = (foundRes.data?.data || []).map((i: any) => ({
          id: i.id,
          lat: i.locationLat,
          lng: i.locationLng,
          type: 'found',
          name: i.itemName,
          status: i.status
        })).filter((i: any) => i.lat && i.lng);

        setItems([...lost, ...found]);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    };
    fetchMapData();
  }, []);

  const visibleItems = items.filter(item => activeFilters.includes(item.type));

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">Map</h1>
          <p className="text-white/60 mt-1">View lost and found items in your area</p>
        </div>
        
        <div className="relative z-10">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl shadow-sm transition-colors ${showFilters ? 'bg-primary-500/10 border-primary-500/20 text-primary-300' : 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border-white/[0.12] hover:bg-white/[0.02] text-white/80'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] rounded-xl shadow-xl overflow-hidden animate-slide-down origin-top-right">
              <div className="p-3 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                <span className="font-semibold text-sm text-white">Map Filters</span>
                <button onClick={() => setShowFilters(false)} className="text-white/50 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                <label className="flex items-center gap-3 p-2 hover:bg-white/[0.02] rounded-lg cursor-pointer transition-colors">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${activeFilters.includes('lost') ? 'bg-danger-500 border-danger-500' : 'border-white/[0.12]'}`}>
                    {activeFilters.includes('lost') && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger-500" />
                    <span className="text-sm font-medium text-white/80">Lost Items</span>
                  </div>
                  <input type="checkbox" className="hidden" checked={activeFilters.includes('lost')} onChange={() => toggleFilter('lost')} />
                </label>
                
                <label className="flex items-center gap-3 p-2 hover:bg-white/[0.02] rounded-lg cursor-pointer transition-colors">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${activeFilters.includes('found') ? 'bg-accent-500 border-accent-500' : 'border-white/[0.12]'}`}>
                    {activeFilters.includes('found') && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-500" />
                    <span className="text-sm font-medium text-white/80">Found Items</span>
                  </div>
                  <input type="checkbox" className="hidden" checked={activeFilters.includes('found')} onChange={() => toggleFilter('found')} />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white/[0.04] rounded-2xl border border-white/[0.12] overflow-hidden relative shadow-inner z-0">
        <InteractiveMap items={visibleItems} />
      </div>
    </div>
  );
}
