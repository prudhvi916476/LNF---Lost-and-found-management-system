'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  const defaultPosition: [number, number] = [20.5937, 78.9629]; // India default
  const activePosition = position || defaultPosition;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-white/[0.04] animate-pulse rounded-2xl"></div>;

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
