import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('findit_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints to prevent loops
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('findit_refresh_token');
        const accessToken = localStorage.getItem('findit_access_token');

        if (refreshToken && accessToken && accessToken !== 'dev-token') {
          let userId: string | null = null;
          try {
            const decoded = jwtDecode<{ sub: string }>(accessToken);
            userId = decoded.sub;
          } catch {
            userId = null;
          }

          if (userId) {
            const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
              userId,
              refreshToken,
            });

            localStorage.setItem('findit_access_token', data.data.accessToken);
            localStorage.setItem('findit_refresh_token', data.data.refreshToken);

            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed, clean up tokens below
      }

      // If refresh failed or was invalid, clean up local storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('findit_access_token');
        localStorage.removeItem('findit_refresh_token');
        localStorage.removeItem('findit_dev_user');
        localStorage.removeItem('findit_user_id');

        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string; recaptchaToken: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string; recaptchaToken: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  googleAuth: (data: { email: string; fullName: string; googleId: string; avatarUrl?: string }) =>
    api.post('/auth/google', data),
  forgotPassword: (data: { email: string; recaptchaToken: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; newPassword: string; recaptchaToken: string }) =>
    api.post('/auth/reset-password', data),
  refreshTokens: (data: { userId: string; refreshToken: string }) =>
    api.post('/auth/refresh', data),
};

// ─── Items API ────────────────────────────────────
export const itemsApi = {
  createLostItem: (data: any) => api.post('/lost-items', data),
  getLostItems: (params?: any) => api.get('/lost-items', { params }),
  getMyLostItems: (params?: any) => api.get('/lost-items/my', { params }),
  getLostItem: (id: string) => api.get(`/lost-items/${id}`),
  updateLostItem: (id: string, data: any) => api.put(`/lost-items/${id}`, data),
  deleteLostItem: (id: string) => api.delete(`/lost-items/${id}`),

  createFoundItem: (data: any) => api.post('/found-items', data),
  getFoundItems: (params?: any) => api.get('/found-items', { params }),
  getMyFoundItems: (params?: any) => api.get('/found-items/my', { params }),
  getFoundItem: (id: string) => api.get(`/found-items/${id}`),
  updateFoundItem: (id: string, data: any) => api.put(`/found-items/${id}`, data),
};

// ─── Search API ───────────────────────────────────
export const searchApi = {
  search: (params: any) => api.get('/search', { params }),
};

// ─── Match API ────────────────────────────────────
export const matchApi = {
  getMatches: (params?: any) => api.get('/matches', { params }),
  confirmMatch: (id: string) => api.post(`/matches/${id}/confirm`),
  dismissMatch: (id: string) => api.post(`/matches/${id}/dismiss`),
  runMatching: (lostItemId: string) => api.post(`/matches/run/${lostItemId}`),
  runScan: () => api.post('/matches/scan'),
  createDemoMatch: () => api.post('/matches/demo'),
};

// ─── Claims API ───────────────────────────────────
export const claimsApi = {
  createClaim: (data: any) => api.post('/claims', data),
  getMyClaims: (params?: any) => api.get('/claims/my', { params }),
  getClaim: (id: string) => api.get(`/claims/${id}`),
  updateClaimStatus: (id: string, data: any) => api.put(`/claims/${id}/status`, data),
  addEvidence: (id: string, data: any) => api.post(`/claims/${id}/evidence`, data),
};

// ─── Chat API ─────────────────────────────────────
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (data: { userId: string; matchId?: string }) =>
    api.post('/chat/conversations', data),
  getMessages: (conversationId: string, params?: any) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  getUnreadCount: () => api.get('/chat/unread'),
};

// ─── Notifications API ────────────────────────────
export const notificationsApi = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

// ─── QR API ───────────────────────────────────────
export const qrApi = {
  createTag: (data: { itemName: string; itemDescription?: string }) => api.post('/qr', data),
  getMyTags: () => api.get('/qr/my'),
  scanTag: (code: string, lat?: number, lng?: number) =>
    api.get(`/qr/scan/${code}`, { params: { lat, lng } }),
  deactivateTag: (id: string) => api.delete(`/qr/${id}`),
  activateTag: (id: string) => api.post(`/qr/${id}/activate`),
};

// ─── Upload API ───────────────────────────────────
export const uploadApi = {
  getPresignedUrl: (filename: string, contentType: string) =>
    api.post('/uploads/presigned-url', { filename, contentType }),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  /** Upload a found item image — returns { originalUrl, previewUrl } */
  uploadFoundItemImage: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/found-item-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
};

// ─── Verification API ─────────────────────────────────────
export const verificationApi = {
  /** Get the 8 fixed mandatory ownership questions */
  getMandatoryQuestions: () => api.get('/verification/questions/mandatory'),

  /** Get all questions (mandatory + custom) for a found item */
  getQuestions: (foundItemId: string) =>
    api.get(`/verification/found/${foundItemId}/questions`),

  /** Add a custom verification question (finder, max 5) */
  addCustomQuestion: (foundItemId: string, questionText: string) =>
    api.post(`/verification/found/${foundItemId}/questions`, { questionText }),

  /** Delete a custom question */
  deleteCustomQuestion: (questionId: string) =>
    api.delete(`/verification/questions/${questionId}`),

  /** Submit an ownership claim with all Q&A answers */
  submitClaim: (foundItemId: string, verificationAnswers: Record<string, string>) =>
    api.post(`/verification/found/${foundItemId}/claim`, { verificationAnswers }),

  /** Get all claims on a found item (finder only) */
  getFoundItemClaims: (foundItemId: string) =>
    api.get(`/verification/found/${foundItemId}/claims`),

  /** Get my submitted claims */
  getMyClaims: () => api.get('/verification/claims/my'),

  /** Get a single claim */
  getClaim: (claimId: string) => api.get(`/verification/claims/${claimId}`),

  /** Finder reviews a claim: approve / reject / info_requested */
  reviewClaim: (claimId: string, status: string, finderResponse?: string) =>
    api.put(`/verification/claims/${claimId}/review`, { status, finderResponse }),

  /** Reveal contact info after approval (available to both parties) */
  getRevealedContact: (claimId: string) =>
    api.get(`/verification/claims/${claimId}/contact`),
};

// ─── Analytics API ────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getCategories: () => api.get('/analytics/categories'),
  getTimeSeries: (days?: number) => api.get('/analytics/timeseries', { params: { days } }),
  getHeatmap: () => api.get('/analytics/heatmap'),
  getTopContributors: (limit?: number) => api.get('/analytics/top-contributors', { params: { limit } }),
};

// ─── Reputation API ───────────────────────────────
export const reputationApi = {
  getMyBadges: () => api.get('/reputation/badges'),
  getLeaderboard: (params?: any) => api.get('/reputation/leaderboard', { params }),
};

// ─── Users API ────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  getLeaderboard: (limit?: number) => api.get('/users/leaderboard', { params: { limit } }),
};

export default api;
