'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  Layers,
  MapPin,
  Crosshair,
  Search,
  ExternalLink,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
  Satellite,
} from 'lucide-react';
import {
  getStoredGoogleMapsKey,
  saveStoredGoogleMapsKey,
  loadGoogleMapsScript,
} from '@/lib/google-maps-loader';
import { GOOGLE_MAPS_DARK_STYLE } from '@/lib/google-maps-dark-style';
import { toast } from 'sonner';

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
  type: 'lost' | 'found';
  name: string;
  status: string;
}

interface GoogleInteractiveMapProps {
  items: MapItem[];
  fallbackToLeaflet?: () => void;
}

export function GoogleInteractiveMap({ items, fallbackToLeaflet }: GoogleInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'dark' | 'roadmap' | 'satellite'>('dark');
  const [activeKey, setActiveKey] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

  // Initialize and load Google Maps
  const initMap = useCallback(async (keyToUse?: string) => {
    setIsLoading(true);
    setLoadError(null);

    const key = keyToUse || getStoredGoogleMapsKey();
    setActiveKey(key);

    if (!key) {
      setIsLoading(false);
      setLoadError('NO_KEY');
      return;
    }

    try {
      const google = await loadGoogleMapsScript(key);
      if (!mapContainerRef.current) return;

      const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India default center
      const initialCenter = items.length > 0 && items[0].lat && items[0].lng
        ? { lat: items[0].lat, lng: items[0].lng }
        : defaultCenter;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: items.length > 0 ? 12 : 5,
        styles: mapType === 'dark' ? GOOGLE_MAPS_DARK_STYLE : undefined,
        mapTypeId: mapType === 'satellite' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: false,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to initialize Google Maps:', err);
      setIsLoading(false);
      setLoadError(err.message || 'Google Maps failed to load. Please verify your API Key.');
    }
  }, [items, mapType]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Update styles when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (mapType === 'dark') {
      map.setOptions({
        styles: GOOGLE_MAPS_DARK_STYLE,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });
    } else if (mapType === 'satellite') {
      map.setOptions({
        styles: undefined,
        mapTypeId: google.maps.MapTypeId.HYBRID,
      });
    } else {
      map.setOptions({
        styles: undefined,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });
    }
  }, [mapType]);

  // Render markers when items or map changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof google === 'undefined' || !google.maps) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (items.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    items.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const position = { lat: item.lat, lng: item.lng };
      bounds.extend(position);

      const isLost = item.type === 'lost';
      const markerColor = isLost ? '#f43f5e' : '#10b981';

      // SVG Pin icon
      const svgIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: markerColor,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 1.6,
        anchor: new google.maps.Point(12, 22),
      };

      const marker = new google.maps.Marker({
        position,
        map,
        title: item.name,
        icon: svgIcon,
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        setSelectedItem(item);
        if (infoWindowRef.current) {
          const detailUrl = isLost ? `/dashboard/lost/${item.id}` : `/dashboard/found/${item.id}`;
          const content = `
            <div style="color: #0f172a; padding: 6px; font-family: sans-serif; min-width: 180px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="background: ${isLost ? '#f43f5e' : '#10b981'}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
                  ${item.type}
                </span>
                <span style="font-size: 11px; color: #64748b; text-transform: capitalize;">${item.status}</span>
              </div>
              <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #0f172a;">${item.name}</h4>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569;">
                📍 ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}
              </p>
              <a href="${detailUrl}" style="display: inline-block; background: #3b82f6; color: white; font-size: 12px; font-weight: 600; text-decoration: none; padding: 6px 12px; border-radius: 8px;">
                View Details &rarr;
              </a>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    if (items.length > 1) {
      map.fitBounds(bounds);
    } else if (items.length === 1) {
      map.setCenter({ lat: items[0].lat, lng: items[0].lng });
      map.setZoom(14);
    }
  }, [items]);

  // Locate User GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Locating your position...', { id: 'gps-locate' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('gps-locate');
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const map = mapInstanceRef.current;

        if (map && typeof google !== 'undefined') {
          map.panTo(userPos);
          map.setZoom(15);

          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(userPos);
          } else {
            userMarkerRef.current = new google.maps.Marker({
              position: userPos,
              map,
              title: 'Your Location',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#38bdf8',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 8,
              },
            });
          }
          toast.success('Centered to your current location');
        }
      },
      (err) => {
        toast.dismiss('gps-locate');
        toast.error('Could not obtain location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveKey = () => {
    if (!inputKey.trim()) {
      toast.error('Please enter a valid Google Maps API Key');
      return;
    }
    saveStoredGoogleMapsKey(inputKey.trim());
    toast.success('Google Maps API Key saved! Loading map...');
    setShowKeyModal(false);
    initMap(inputKey.trim());
  };

  return (
    <div className="w-full h-full relative z-0 overflow-hidden rounded-2xl">
      {/* ─── Map Container ───────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-surface-950" />

      {/* ─── Loading Overlay ─────────────────────────────────── */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-950/80 backdrop-blur-md text-white">
          <Loader2 className="w-10 h-10 animate-spin text-primary-400 mb-3" />
          <p className="text-sm font-medium text-white/80">Connecting Google Maps...</p>
          <span className="text-xs text-white/40 mt-1">Fetching vector tiles and live markers</span>
        </div>
      )}

      {/* ─── Error / Missing Key State ───────────────────────── */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-950/90 backdrop-blur-xl p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4 text-primary-400">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-display)]">
            Connect Google Maps
          </h3>
          <p className="text-white/60 text-sm max-w-md mb-6">
            Enter your Google Cloud Maps API key to activate Google vector tiles, Street View, and satellite imagery for your lost & found recovery network.
          </p>

          <div className="w-full max-w-md bg-white/[0.04] border border-white/[0.1] rounded-2xl p-4 mb-4 backdrop-blur-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all"
              >
                Connect
              </button>
            </div>
            <p className="text-[11px] text-white/40 mt-2.5 text-left">
              💡 Enable <strong>Maps JavaScript API</strong> in Google Cloud Console under project <code>207365907552</code>.
            </p>
          </div>

          {fallbackToLeaflet && (
            <button
              type="button"
              onClick={fallbackToLeaflet}
              className="text-xs text-primary-400 hover:text-primary-300 underline font-medium transition-colors"
            >
              Continue with OpenStreetMap view for now &rarr;
            </button>
          )}
        </div>
      )}

      {/* ─── Floating Controls on Active Map ─────────────────── */}
      {!loadError && !isLoading && (
        <>
          {/* Top-Right Style Selectors */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-surface-900/80 backdrop-blur-xl border border-white/[0.12] rounded-xl p-1 shadow-2xl">
            <button
              type="button"
              onClick={() => setMapType('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapType === 'dark'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapType === 'roadmap'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapType === 'satellite'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              Satellite
            </button>
          </div>

          {/* Top-Left Stats Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-surface-900/80 backdrop-blur-xl border border-white/[0.12] rounded-xl px-3.5 py-2 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white">Google Maps Connected</span>
            </div>
            <div className="w-px h-3.5 bg-white/20" />
            <span className="text-xs text-white/60">
              {items.length} {items.length === 1 ? 'item' : 'items'} mapped
            </span>
          </div>

          {/* Bottom-Right Location & Key Button */}
          <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLocateUser}
              title="Locate my position"
              className="p-3 rounded-xl bg-surface-900/80 hover:bg-surface-800 text-white border border-white/[0.12] shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <Crosshair className="w-5 h-5 text-primary-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setInputKey(getStoredGoogleMapsKey());
                setShowKeyModal(true);
              }}
              title="Google Maps API Settings"
              className="p-3 rounded-xl bg-surface-900/80 hover:bg-surface-800 text-white/70 hover:text-white border border-white/[0.12] shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <Key className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* ─── API Key Settings Modal ──────────────────────────── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Google Maps API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-white/60 mb-4">
              Configure your Google Cloud Maps API key to power vector street tiles, terrain, and geocoding services.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  API Key
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
