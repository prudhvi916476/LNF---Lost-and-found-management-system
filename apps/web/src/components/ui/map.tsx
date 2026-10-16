'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  getStoredGoogleMapsKey,
  loadGoogleMapsScript,
} from '@/lib/google-maps-loader';
import { GOOGLE_MAPS_DARK_STYLE } from '@/lib/google-maps-dark-style';
import { Crosshair, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Fix Leaflet's default icon path issues in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface MapProps {
  position?: [number, number];
  onPositionChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);
  return null;
}

function MapEvents({ onPositionChange }: { onPositionChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onPositionChange) {
        onPositionChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function Map({ position, onPositionChange, readOnly = false }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [googleLoadFailed, setGoogleLoadFailed] = useState(false);

  const googleContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);

  const defaultPosition: [number, number] = [20.5937, 78.9629]; // India default
  const activePosition = position || defaultPosition;

  useEffect(() => {
    setMounted(true);
    const key = getStoredGoogleMapsKey();
    if (key) {
      loadGoogleMapsScript(key)
        .then(() => setIsGoogleLoaded(true))
        .catch(() => setGoogleLoadFailed(true));
    } else {
      setGoogleLoadFailed(true);
    }
  }, []);

  // Initialize Google Map if loaded
  useEffect(() => {
    if (!isGoogleLoaded || !googleContainerRef.current || typeof google === 'undefined') return;

    const center = { lat: activePosition[0], lng: activePosition[1] };
    const map = new google.maps.Map(googleContainerRef.current, {
      center,
      zoom: position ? 15 : 5,
      styles: GOOGLE_MAPS_DARK_STYLE,
      disableDefaultUI: readOnly,
      zoomControl: !readOnly,
      streetViewControl: false,
      mapTypeControl: false,
    });

    googleMapRef.current = map;

    // Place marker
    if (position) {
      googleMarkerRef.current = new google.maps.Marker({
        position: center,
        map,
        draggable: !readOnly,
        animation: google.maps.Animation.DROP,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#38bdf8',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          scale: 1.6,
          anchor: new google.maps.Point(12, 22),
        },
      });

      if (!readOnly && onPositionChange) {
        googleMarkerRef.current.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onPositionChange(e.latLng.lat(), e.latLng.lng());
          }
        });
      }
    }

    if (!readOnly && onPositionChange) {
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onPositionChange(lat, lng);

          if (googleMarkerRef.current) {
            googleMarkerRef.current.setPosition({ lat, lng });
          } else {
            googleMarkerRef.current = new google.maps.Marker({
              position: { lat, lng },
              map,
              draggable: true,
              icon: {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: '#38bdf8',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 1.6,
                anchor: new google.maps.Point(12, 22),
              },
            });
            googleMarkerRef.current.addListener('dragend', (de: google.maps.MapMouseEvent) => {
              if (de.latLng) onPositionChange(de.latLng.lat(), de.latLng.lng());
            });
          }
        }
      });
    }
  }, [isGoogleLoaded, readOnly]);

  // Update marker position when external position changes
  useEffect(() => {
    if (!googleMapRef.current || !position) return;
    const pos = { lat: position[0], lng: position[1] };
    if (googleMarkerRef.current) {
      googleMarkerRef.current.setPosition(pos);
    }
    googleMapRef.current.panTo(pos);
  }, [position]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (onPositionChange) onPositionChange(lat, lng);
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat, lng });
          googleMapRef.current.setZoom(16);
        }
        toast.success('Found your location!');
      },
      (err) => toast.error('Location error: ' + err.message)
    );
  };

  if (!mounted) return <div className="w-full h-full bg-white/[0.04] animate-pulse rounded-2xl" />;

  // If Google Maps is loaded and active
  if (isGoogleLoaded && !googleLoadFailed) {
    return (
      <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden border border-white/[0.08]">
        <div ref={googleContainerRef} className="w-full h-full z-0" />
        {!readOnly && (
          <button
            type="button"
            onClick={handleLocateMe}
            title="Use current location"
            className="absolute top-3 right-3 z-10 p-2.5 rounded-xl bg-surface-900/80 hover:bg-surface-800 text-white border border-white/10 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <Crosshair className="w-4 h-4 text-primary-400" />
          </button>
        )}
        <div className="absolute bottom-2 left-3 z-10 text-[10px] text-white/50 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
          Google Maps Location Picker
        </div>
      </div>
    );
  }

  // Fallback to Leaflet with OSM if Google Maps key is not yet set
  return (
    <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden border border-white/[0.08]">
      <MapContainer
        center={activePosition}
        zoom={position ? 15 : 5}
        scrollWheelZoom={!readOnly}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} />}
        <MapUpdater position={activePosition} />
        {!readOnly && <MapEvents onPositionChange={onPositionChange} />}
      </MapContainer>
    </div>
  );
}
