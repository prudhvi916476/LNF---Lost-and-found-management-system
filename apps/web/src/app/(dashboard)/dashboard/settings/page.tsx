'use client';

import { useState } from 'react';
import { User, Bell, Shield, Key, Camera, Upload, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import { usersApi } from '@/lib/api';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');

  // Dummy state for toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleSave = async () => {
    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      alert("Please enter a valid international phone number (e.g. +1234567890).");
      return;
    }
    setLoading(true);
    try {
      const res = await usersApi.updateProfile({ fullName, phone });
      setUser(res.data.data);
      alert("Changes saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">Settings</h1>
        <p className="text-white/60 mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] overflow-hidden shadow-sm">
        <div className="flex border-b border-white/[0.08] overflow-x-auto">
          {['Profile', 'Notifications', 'Privacy', 'Security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-primary-500 text-primary-400' : 'text-white/60 hover:text-white/80'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {activeTab === 'Profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <label className="px-4 py-2 bg-white/[0.04] text-white/80 font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-sm cursor-pointer flex items-center gap-2 max-w-max">
                    <Upload className="w-4 h-4" />
                    Upload New Avatar
                    <input type="file" className="hidden" accept="image/*" />
                  </label>
                  <p className="text-xs text-white/50 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/[0.08]">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
                  <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.12] rounded-xl text-white/60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 gradient-primary text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Email Notifications</h4>
                    <p className="text-sm text-white/60">Receive daily summaries and AI match alerts via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] after:border-white/[0.12] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Push Notifications</h4>
                    <p className="text-sm text-white/60">Get instant browser alerts when someone messages you.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] after:border-white/[0.12] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">SMS Alerts</h4>
                    <p className="text-sm text-white/60">Receive text messages for urgent claim updates.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={smsNotif} onChange={() => setSmsNotif(!smsNotif)} />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] after:border-white/[0.12] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
              <div className="pt-6 flex justify-end">
                <button onClick={handleSave} className="px-6 py-2.5 gradient-primary text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Privacy' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Public Profile</h4>
                    <p className="text-sm text-white/60">Allow other users to view your reputation points and joined date.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] after:border-white/[0.12] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Show Contact Info to Matches</h4>
                    <p className="text-sm text-white/60">Automatically share your email with users who have a high-confidence match with you.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={showContact} onChange={() => setShowContact(!showContact)} />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] after:border-white/[0.12] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
              <div className="pt-6 flex justify-end">
                <button onClick={handleSave} className="px-6 py-2.5 gradient-primary text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Save Privacy
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white">Security Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Two-Factor Authentication (2FA)</h4>
                    <p className="text-sm text-white/60">Add an extra layer of security to your account.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] after:border-white/[0.12] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08]">
                <h4 className="font-medium text-white mb-4">Change Password</h4>
                <div className="grid gap-4 max-w-md">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border border-white/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button onClick={handleSave} className="px-6 py-2.5 bg-surface-900 text-white font-medium rounded-xl shadow-md hover:bg-black transition-all hover:-translate-y-0.5">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
