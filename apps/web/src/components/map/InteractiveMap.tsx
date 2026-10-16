'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleInteractiveMap, MapItem } from './GoogleInteractiveMap';
import { getStoredGoogleMapsKey } from '@/lib/google-maps-loader';
import { MapPin, Globe } from 'lucide-react';

// Fix for default marker icons in Leaflet with webpack
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

export default function InteractiveMap({ items = [] }: { items?: MapItem[] }) {
  const [engine, setEngine] = useState<'google' | 'leaflet'>('google');

  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India Center

  return (
    <div className="w-full h-full relative z-0 flex flex-col">
      {/* ─── Engine Switcher Pill ───────────────────────── */}
      <div className="absolute bottom-6 left-4 z-20 flex items-center gap-1 bg-surface-900/80 backdrop-blur-xl border border-white/[0.12] rounded-xl p-1 shadow-2xl">
        <button
          type="button"
          onClick={() => setEngine('google')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            engine === 'google'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="font-bold text-xs">G</span> Google Maps
        </button>
        <button
          type="button"
          onClick={() => setEngine('leaflet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            engine === 'leaflet'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> OpenStreetMap
        </button>
      </div>

      {/* ─── Active Map Engine ─────────────────────────── */}
      {engine === 'google' ? (
        <GoogleInteractiveMap
          items={items}
          fallbackToLeaflet={() => setEngine('leaflet')}
        />
      ) : (
        <div className="w-full h-full relative z-0">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="rounded-2xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {items.map((item) => (
              <Marker key={item.id} position={[item.lat, item.lng]}>
                <Popup>
                  <div className="font-[family-name:var(--font-geist-sans)]">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        item.type === 'lost' ? 'bg-danger-500' : 'bg-accent-500'
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>
                    <h3 className="font-semibold text-sm mt-1">{item.name}</h3>
                    <p className="text-xs text-surface-500">{item.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
