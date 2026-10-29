import React, { useState } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  User, 
  Upload, 
  Lock, 
  Shield, 
  Download, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Moon, 
  Sun,
  Calendar,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

export default function SettingsTab({ 
  profile, 
  onProfileUpdate, 
  avatarTimestamp, 
  setAvatarTimestamp 
}) {
  // Profile edit state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [privacyPublic, setPrivacyPublic] = useState(profile?.privacy_public || false);
  const [dataSharing, setDataSharing] = useState(profile?.data_sharing || true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status feedback
  const [feedback, setFeedback] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [downloadingESG, setDownloadingESG] = useState(false);
  const [theme, setTheme] = useState('dark');

  const avatarSrc = profile?.avatar_path 
    ? `${API_BASE_URL}${profile.avatar_path}?t=${avatarTimestamp || Date.now()}`
    : null;

  // Local File Upload for Avatar
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Do NOT manually set Content-Type header so browser adds boundaries!
      const res = await fetchWithAuth('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Avatar upload failed');

      // Update avatar timestamp to trigger global cache-busting re-render
      const newTs = Date.now();
      setAvatarTimestamp(newTs);
      setFeedback({ type: 'success', text: 'Avatar successfully uploaded and synced globally!' });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile update submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          phone,
          privacy_public: privacyPublic,
          data_sharing: dataSharing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Profile update failed');

      setFeedback({ type: 'success', text: 'Profile preferences saved successfully.' });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  // Change password submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setFeedback({ type: 'error', text: 'Both current and new passwords are required.' });
      return;
    }
    setFeedback(null);
    try {
      const res = await fetchWithAuth('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Password change failed');

      setFeedback({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  // Authenticated ESG Report PDF Download Handler
  const handleDownloadESG = async () => {
    setDownloadingESG(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('netzero_token');
      const response = await fetch(`${API_BASE_URL}/api/esg/export-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ESG Report: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `NetZero_ESG_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setFeedback({ type: 'success', text: 'ESG Sustainability Audit Report successfully generated and downloaded!' });
    } catch (err) {
      console.error('ESG Download Error:', err);
      setFeedback({ type: 'error', text: err.message || 'Could not download ESG report.' });
    } finally {
      setDownloadingESG(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Profile Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Dynamic Avatar with File Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/60 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center text-emerald-400">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>

            {/* Hidden Native File Picker */}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleAvatarFileChange}
              className="hidden"
              id="avatar-file-input"
            />
            <label
              htmlFor="avatar-file-input"
              className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm"
            >
              <Upload className="w-4 h-4 mb-1 text-emerald-400" />
              <span>{uploadingAvatar ? 'Saving...' : 'Change Photo'}</span>
            </label>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-bold text-white">
                {profile?.display_name || 'Solarpunk Pioneer'}
              </h1>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Verified Eco-Citizen
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              {profile?.bio || 'Building clean energy habits for Net-Zero emissions.'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{profile?.email || 'preetam@havoc.dev'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{profile?.phone || '+91 98765 43210'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '2026'}</span>
              </span>
            </div>
          </div>

          {/* 1-Click Authenticated ESG PDF Export */}
          <button
            onClick={handleDownloadESG}
            disabled={downloadingESG}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-xs font-mono flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingESG ? 'Rendering PDF...' : 'Export ESG Report'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${
          feedback.type === 'error'
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        }`}>
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Editing Form */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Profile Details & Bio</span>
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                Bio / Environmental Motto
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            {/* Privacy Controls */}
            <div className="pt-2 space-y-3">
              <span className="text-xs font-mono uppercase text-emerald-400/80 font-bold block">
                Privacy & Data Governance
              </span>
              <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/15 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Public Profile Visibility</div>
                  <div className="text-[11px] text-slate-400 font-mono">Show achievements and streak badge on cohort board</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyPublic}
                  onChange={(e) => setPrivacyPublic(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/15 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Anonymized ESG Research Sharing</div>
                  <div className="text-[11px] text-slate-400 font-mono">Contribute anonymous telemetry to open green research</div>
                </div>
                <input
                  type="checkbox"
                  checked={dataSharing}
                  onChange={(e) => setDataSharing(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              Save Profile Preferences
            </button>
          </form>
        </div>

        {/* Security & Password Change */}
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Change Password</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold transition-all"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Theme & Display Mode */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-400" />
              <span>Display Theme</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              The platform is optimized with a Solarpunk Bio-Tech Dark HUD.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-black/40 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Solarpunk Dark (Default)</span>
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 ${
                  theme === 'light'
                    ? 'bg-emerald-500 text-black font-extrabold'
                    : 'bg-black/40 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Eco Light</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
