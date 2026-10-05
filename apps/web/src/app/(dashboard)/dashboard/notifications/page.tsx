'use client';

import { Bell, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getNotifications();
      setNotifications(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">Notifications</h1>
          <p className="text-white/60 mt-1">Stay updated on your items and matches</p>
        </div>
        <button onClick={handleMarkAllRead} className="flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
          <CheckCircle2 className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="text-lg font-medium text-white">You're all caught up!</h3>
          <p className="text-white/60 mt-1">No new notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border ${n.isRead ? 'border-white/[0.08]' : 'border-primary-500/20 bg-primary-500/10'} shadow-sm`}>
              <h4 className="font-semibold">{n.title}</h4>
              <p className="text-sm text-white/70">{n.body || n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
