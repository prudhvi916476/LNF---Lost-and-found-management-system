'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleOneTap } from '../google-one-tap';

interface GoogleAuthProviderProps {
  children: React.ReactNode;
  clientId: string;
}

export function GoogleAuthProvider({ children, clientId }: GoogleAuthProviderProps) {
  const hasValidClientId = !!clientId && clientId !== 'your-google-client-id';

  if (!hasValidClientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
      <GoogleOneTap />
    </GoogleOAuthProvider>
  );
}
