import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  reputationPoints: number;
  isVerified: boolean;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

/** Safely decode the access token to get the user ID */
function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string, recaptchaToken: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; recaptchaToken: string }) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

/** Store access token and refresh token in localStorage.
 *  Note: the user ID is derived from the JWT; it is NOT stored separately. */
function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('findit_access_token', accessToken);
  localStorage.setItem('findit_refresh_token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('findit_access_token');
  localStorage.removeItem('findit_refresh_token');
  // Also clear the legacy userId key if it exists
  localStorage.removeItem('findit_user_id');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password, recaptchaToken) => {
    const { data } = await authApi.login({ email, password, recaptchaToken });
    const tokens = data.data;
    saveTokens(tokens.accessToken, tokens.refreshToken);

    const profile = await authApi.getProfile();
    const user = profile.data.data;
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (registerData) => {
    const { data } = await authApi.register(registerData);
    const tokens = data.data;
    saveTokens(tokens.accessToken, tokens.refreshToken);

    const profile = await authApi.getProfile();
    const user = profile.data.data;
    set({ user, isAuthenticated: true, isLoading: false });
  },

  googleLogin: async (accessToken: string) => {
    // Fetch user info from Google
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch Google user info');
    const userInfo = await res.json();

    const { data } = await authApi.googleAuth({
      email: userInfo.email,
      fullName: userInfo.name,
      googleId: userInfo.sub,
      avatarUrl: userInfo.picture,
    });

    const tokens = data.data;
    saveTokens(tokens.accessToken, tokens.refreshToken);

    const profile = await authApi.getProfile();
    const user = profile.data.data;
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout — clear local state regardless
    }
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem('findit_access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Check token expiry before making a network request
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          // Token expired — try refresh before giving up
          const refreshToken = localStorage.getItem('findit_refresh_token');
          const userId = getUserIdFromToken(token);
          if (refreshToken && userId) {
            const { data } = await authApi.refreshTokens({ userId, refreshToken });
            saveTokens(data.data.accessToken, data.data.refreshToken);
          } else {
            clearTokens();
            set({ isLoading: false });
            return;
          }
        }
      } catch {
        // If decode fails, continue and let the server reject it
      }

      const { data } = await authApi.getProfile();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
