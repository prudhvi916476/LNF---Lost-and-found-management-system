import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    // Restrict powerful browser APIs not used by the app
    value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=(), payment=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Content-Security-Policy',
    // Allows our API origin, Google (OAuth + reCAPTCHA + Maps), and fonts
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + " https://www.googleapis.com https://oauth2.googleapis.com https://accounts.google.com https://maps.googleapis.com https://*.googleapis.com https://nominatim.openstreetmap.org wss: ws:",
      "frame-src 'self' https://www.google.com https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Security headers on every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Redirect trailing slash for consistency
  trailingSlash: false,

  // Power redirects: enforce HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV !== 'production') return [];
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://' + process.env.NEXT_PUBLIC_DOMAIN + '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
