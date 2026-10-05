import type { Metadata } from "next";
import { GoogleOAuthProvider } from '@react-oauth/google';
import CookieConsent from '../components/cookie-consent';
import "./globals.css";

export const metadata: Metadata = {
  title: "LNF – Universal Lost & Found Recovery Network",
  description: "AI-powered platform to report, track, match, and recover lost items. Centralized digital ecosystem for individuals, organizations, and cities.",
  keywords: "lost and found, item recovery, AI matching, QR tags, lost items, found items",
  openGraph: {
    title: "LNF – Universal Lost & Found Recovery Network",
    description: "Report, search, and recover lost items with AI-powered matching",
    type: "website",
  },
  // Security headers via Next.js meta tags (complements server-level headers)
  other: {
    'referrer': 'strict-origin-when-cross-origin',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent clickjacking */}
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        {/* Prevent MIME-type sniffing */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </head>
      <body className="min-h-screen bg-surface-50 text-surface-900 antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id'}>
          {children}
          {/* Cookie consent banner — renders after hydration, outside all page layouts */}
          <CookieConsent />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
