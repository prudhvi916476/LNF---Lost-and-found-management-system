'use client';

let loadPromise: Promise<typeof google> | null = null;
let authErrorTriggered = false;

export function getStoredGoogleMapsKey(): string {
  if (typeof window === 'undefined') return '';
  const local = localStorage.getItem('findit_google_maps_key');
  if (local && local.trim() && local !== 'your-google-maps-api-key') {
    return local.trim();
  }
  const envKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    '';
  if (envKey && envKey.trim() && envKey !== 'your-google-maps-api-key') {
    return envKey.trim();
  }
  return '';
}

export function saveStoredGoogleMapsKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key || !key.trim()) {
    localStorage.removeItem('findit_google_maps_key');
  } else {
    localStorage.setItem('findit_google_maps_key', key.trim());
  }
  // Reset load promise so next attempt reloads with the new key
  loadPromise = null;
  authErrorTriggered = false;
}

export function loadGoogleMapsScript(customKey?: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  const apiKey = (customKey || getStoredGoogleMapsKey()).trim();

  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return Promise.reject(new Error('NO_API_KEY'));
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<typeof google>((resolve, reject) => {
    // Listen for Google Maps authentication error
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      authErrorTriggered = true;
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
      reject(new Error('AUTH_FAILURE: Google Maps API key is invalid or Maps JavaScript API is not enabled.'));
    };

    const callbackName = '__initGoogleMaps_' + Math.random().toString(36).substring(2, 9);
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps loaded but object missing'));
      }
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
