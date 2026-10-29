import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { 
  Leaf, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Lock, 
  Key, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export default function AuthView({ onAuthSuccess }) {
  // Modes: 'otp_login' | 'password_login' | 'register' | 'forgot_password'
  const [mode, setMode] = useState('otp_login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // State
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [showGooglePicker, setShowGooglePicker] = useState(false);

  // Send OTP handler
  const handleSendOTP = async (targetEndpoint = '/auth/send-otp') => {
    if (!identifier.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your email or phone number first.' });
      return;
    }
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}${targetEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to dispatch OTP');

      setOtpSent(true);
      setStatusMsg({ 
        type: 'success', 
        text: `OTP generated! Check terminal or use code: ${data.debug_otp}` 
      });
      if (data.debug_otp) {
        setOtpCode(data.debug_otp); // Auto-fill for convenience during Hackathon testing
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Login
  const handleOTPLogin = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOTP();
      return;
    }
    if (!otpCode.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter the 6-digit OTP code.' });
      return;
    }
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OTP verification failed');

      localStorage.setItem('netzero_token', data.access_token);
      localStorage.setItem('netzero_user', JSON.stringify({
        id: data.user_id,
        email: data.email,
        phone: data.phone,
      }));
      onAuthSuccess();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Submit Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid login credentials');

      localStorage.setItem('netzero_token', data.access_token);
      localStorage.setItem('netzero_user', JSON.stringify({
        id: data.user_id,
        email: data.email,
        phone: data.phone,
      }));
      onAuthSuccess();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Submit Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOTP();
      return;
    }
    if (!otpCode || !password) {
      setStatusMsg({ type: 'error', text: 'Please enter OTP code and password' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          code: otpCode.trim(),
          display_name: displayName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      localStorage.setItem('netzero_token', data.access_token);
      localStorage.setItem('netzero_user', JSON.stringify({ id: data.user_id }));
      onAuthSuccess();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Submit Forgot Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOTP('/auth/forgot-password');
      return;
    }
    if (!otpCode || !newPassword) {
      setStatusMsg({ type: 'error', text: 'Please enter the OTP and your new password.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          code: otpCode.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed');

      setStatusMsg({ type: 'success', text: data.message });
      setMode('password_login');
      setPassword(newPassword);
      setOtpSent(false);
      setOtpCode('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // One-Click Google OAuth simulation with account selector
  const handleGoogleSelect = async (account) => {
    setShowGooglePicker(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          display_name: account.name,
          avatar_url: account.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google authentication failed');

      localStorage.setItem('netzero_token', data.access_token);
      localStorage.setItem('netzero_user', JSON.stringify({
        id: data.user_id,
        email: data.email,
        display_name: data.display_name,
      }));
      onAuthSuccess();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070C09] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Solarpunk Ambient Glow Spots */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glassmorphism Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-8 shadow-[0_12px_48px_0_rgba(0,0,0,0.6)]">
        {/* Solarpunk Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-4">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            NetZero Prints <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">v2.0</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            Solarpunk Carbon Intelligence • Team Havoc.dev
          </p>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Hack Fest 2026 Official Submission (PS-01)
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-emerald-500/20 mb-6">
          <button
            type="button"
            onClick={() => { setMode('otp_login'); setOtpSent(false); setStatusMsg({ type: '', text: '' }); }}
            className={`py-2 text-xs font-mono rounded-lg transition-all ${
              mode === 'otp_login' 
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OTP Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('password_login'); setStatusMsg({ type: '', text: '' }); }}
            className={`py-2 text-xs font-mono rounded-lg transition-all ${
              mode === 'password_login' 
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setOtpSent(false); setStatusMsg({ type: '', text: '' }); }}
            className={`py-2 text-xs font-mono rounded-lg transition-all ${
              mode === 'register' 
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {statusMsg.text && (
          <div className={`mb-6 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusMsg.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            {statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <div className="leading-relaxed">{statusMsg.text}</div>
          </div>
        )}

        {/* MODE 1: OTP LOGIN */}
        {mode === 'otp_login' && (
          <form onSubmit={handleOTPLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                Mobile Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +919876543210 or user@domain.com"
                  className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-emerald-400/80">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSendOTP()}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-lg text-emerald-400 placeholder-slate-600 transition-all outline-none font-bold"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : otpSent ? (
                <><span>Verify & Enter Command Center</span> <ArrowRight className="w-4 h-4" /></>
              ) : (
                <><span>Send Security OTP</span> <Key className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: PASSWORD LOGIN */}
        {mode === 'password_login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                Registered Email or Phone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="preetam@havoc.dev"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-emerald-400/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setOtpSent(false); setStatusMsg({ type: '', text: '' }); }}
                  className="text-[11px] text-emerald-400 hover:underline font-mono"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* MODE 3: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                Full Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Shreyas (Core Dev)"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                Email or Mobile Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="user@domain.com or +919876543210"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                required
              />
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-lg text-emerald-400 placeholder-slate-600 transition-all outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                    Choose Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Processing...' : otpSent ? 'Complete Account Registration' : 'Send Registration OTP'}
            </button>
          </form>
        )}

        {/* MODE 4: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                Your Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="preetam@havoc.dev"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                required
              />
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-lg text-emerald-400 placeholder-slate-600 transition-all outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/80 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Updating...' : otpSent ? 'Confirm & Reset Password' : 'Send Reset Code'}
            </button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => { setMode('password_login'); setStatusMsg({ type: '', text: '' }); }}
                className="text-xs text-slate-400 hover:text-emerald-400 font-mono transition-colors"
              >
                ← Back to Password Login
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-emerald-500/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-mono">
            <span className="bg-[#0b120e] px-3 text-slate-500">Or continue with</span>
          </div>
        </div>

        {/* One-Click Google OAuth Trigger */}
        <button
          type="button"
          onClick={() => setShowGooglePicker(true)}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-emerald-500/25 hover:border-emerald-400/50 text-slate-200 py-3 px-4 rounded-xl font-medium text-xs font-mono transition-all flex items-center justify-center gap-3 shadow-sm hover:scale-[1.01]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>One-Click Google Account Sign-In</span>
        </button>

        {/* Quick Demo Credentials Footer */}
        <div className="mt-6 pt-4 border-t border-emerald-500/10 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Demo Lead: <span className="text-emerald-400">preetam@havoc.dev</span> • Pass: <span className="text-emerald-400">NetZero@2026</span>
          </p>
        </div>
      </div>

      {/* Google Account Picker Modal */}
      {showGooglePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div>
                <h3 className="font-bold text-white text-sm">Choose a Google Account</h3>
                <p className="text-[11px] text-slate-400">to continue to NetZero Prints</p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <button
                type="button"
                onClick={() => handleGoogleSelect({
                  email: 'preetam.lead@havoc.dev',
                  name: 'Preetam (Lead Architect)',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                })}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-emerald-300 text-xs">
                  P
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Preetam (Team Havoc.dev)</div>
                  <div className="text-[11px] text-slate-400 font-mono">preetam.lead@havoc.dev</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSelect({
                  email: 'shreyas.dev@havoc.dev',
                  name: 'Shreyas (Full-Stack Dev)',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                })}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center font-bold text-teal-300 text-xs">
                  S
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Shreyas (Team Havoc.dev)</div>
                  <div className="text-[11px] text-slate-400 font-mono">shreyas.dev@havoc.dev</div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGooglePicker(false)}
              className="mt-4 w-full py-2 text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
