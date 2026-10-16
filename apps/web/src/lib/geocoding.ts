'use client';

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

/**
 * Geocodes an address string to coordinates (latitude, longitude) and city.
 * Uses Google Maps Geocoder if available, falling back gracefully to Nominatim.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query || !query.trim()) return null;

  // 1. Try Google Maps Geocoder if Google Maps JS API is available
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoder.geocode({ address: query }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve({ results });
          } else {
            reject(new Error(status));
          }
        });
      });

      const firstResult = response.results[0];
      const lat = firstResult.geometry.location.lat();
      const lng = firstResult.geometry.location.lng();
      const address = firstResult.formatted_address;

      let city = '';
      for (const comp of firstResult.address_components) {
        if (
          comp.types.includes('locality') ||
          comp.types.includes('administrative_area_level_2') ||
          comp.types.includes('postal_town')
        ) {
          city = comp.long_name;
          break;
        }
      }

      return { lat, lng, address, city };
    } catch (googleErr) {
      console.warn('Google Maps geocoding fallback to OpenStreetMap:', googleErr);
    }
  }

  // 2. Fallback to OpenStreetMap / Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      const address = first.display_name || query;
      const city =
        first.address?.city ||
        first.address?.town ||
        first.address?.village ||
        first.address?.county ||
        '';

      return { lat, lng, address, city };
    }
  } catch (osmErr) {
    console.warn('Nominatim geocode request failed:', osmErr);
  }

  return null;
}

/**
 * Reverse geocodes coordinates (lat, lng) to an address and city.
 * Uses Google Maps Geocoder if available, falling back gracefully to Nominatim.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string } | null> {
  if (isNaN(lat) || isNaN(lng)) return null;

  // 1. Try Google Maps Geocoder if available
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve({ results });
          } else {
            reject(new Error(status));
          }
        });
      });

      const firstResult = response.results[0];
      const address = firstResult.formatted_address;

      let city = '';
      for (const comp of firstResult.address_components) {
        if (
          comp.types.includes('locality') ||
          comp.types.includes('administrative_area_level_2') ||
          comp.types.includes('postal_town')
        ) {
          city = comp.long_name;
          break;
        }
      }

      return { address, city };
    } catch (googleErr) {
      console.warn('Google reverse geocode fallback to OpenStreetMap:', googleErr);
    }
  }

  // 2. Fallback to OpenStreetMap / Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (data && (data.display_name || data.address)) {
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        '';
      const address = data.display_name || '';

      return { address, city };
    }
  } catch (osmErr) {
    console.warn('Nominatim reverse geocode failed:', osmErr);
  }

  return null;
}
