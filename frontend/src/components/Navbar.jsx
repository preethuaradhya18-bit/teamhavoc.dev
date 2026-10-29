import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { 
  Leaf, 
  LayoutDashboard, 
  PieChart, 
  MapPin, 
  TrendingDown, 
  Sliders, 
  Award, 
  Coins, 
  ShieldCheck, 
  Target, 
  Settings, 
  LogOut, 
  User,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  coinBalance = 0, 
  profile, 
  onLogout,
  avatarTimestamp
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // 1 & 4. Main Nav Tabs: "Doc Verification" (renamed from Proof Audit) and "Wallet" directly below "Goals"
  const mainNavTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'carbon_source', label: 'Carbon by Source', icon: PieChart },
    { id: 'local_map', label: 'Local Map', icon: MapPin },
    { id: 'contributors', label: 'Contributors', icon: TrendingDown },
    { id: 'forecast', label: 'Impact Forecast', icon: Sliders },
    { id: 'challenges', label: 'Challenges', icon: Award },
    { id: 'proof_audit', label: 'Doc Verification', icon: ShieldCheck },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'coins', label: 'Wallet', icon: Coins }, // Positioned directly below Goals!
  ];

  const avatarSrc = profile?.avatar_path 
    ? `${API_BASE_URL}${profile.avatar_path}?t=${avatarTimestamp || Date.now()}`
    : null;

  return (
    <>
      {/* =========================================================================
          1. VERTICAL LEFT SIDEBAR LAYOUT
          - Brand Logo at top
          - Navigation tabs (with "Doc Verification" and "Wallet" below "Goals")
          - 2. Stacked Settings & Logout at bottom-left corner (mt-auto)
         ========================================================================= */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#070C09]/95 backdrop-blur-2xl border-r border-emerald-500/20 z-40 flex flex-col p-4 shadow-[8px_0_32px_0_rgba(0,0,0,0.5)] transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo & Team Havoc.dev Badge */}
        <div 
          onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
          className="flex items-center gap-3 cursor-pointer group shrink-0 pb-4 border-b border-emerald-500/15"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-all">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                NetZero Prints
              </span>
              <span className="text-[9px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                2026
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider">
              Team Havoc.dev • Solarpunk
            </div>
          </div>
        </div>

        {/* 1. Main Navigation Tabs: Vertical List on the left side of the screen */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar py-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/70 px-3 mb-1">
            Navigation Hub
          </div>
          {mainNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all text-left ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {/* Live balance badge for Wallet */}
                {tab.id === 'coins' && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md shrink-0">
                    {coinBalance} PTS
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 2. Settings & Logout Stacked in bottom-left corner of the sidebar (flex-col and mt-auto) */}
        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-emerald-500/15">
          {/* Settings button pushed slightly up */}
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono transition-all text-left ${
              activeTab === 'settings'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
            }`}
          >
            <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="truncate font-semibold">Settings</span>
          </button>

          {/* Logout button placed directly below Settings */}
          <button
            onClick={onLogout}
            title="Sign out of NetZero Prints"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-all text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Mobile Header Bar (lg:hidden) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#070C09]/90 backdrop-blur-xl border-b border-emerald-500/20 z-30 px-4 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-white/[0.04] border border-emerald-500/20 text-emerald-400"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <span className="font-extrabold text-sm text-white">NetZero Prints</span>
        </div>

        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* =========================================================================
          3. USER PROFILE AVATAR ONLY IN TOP-RIGHT CORNER (absolute top-4 right-4)
          - Displays ONLY user profile picture (full name hidden from default view)
          - Clickable state opens dropdown menu displaying user details & "Edit Profile" button
         ========================================================================= */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            title="User Profile Menu"
            className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-950/80 border-2 border-emerald-400/80 hover:border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center text-emerald-400 transition-all hover:scale-105 active:scale-95 focus:outline-none"
          >
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>

          {/* Profile Dropdown Menu / Modal */}
          {profileDropdownOpen && (
            <>
              {/* Invisible Click-Outside Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileDropdownOpen(false)} 
              />

              <div className="absolute right-0 top-12 mt-2 w-64 bg-[#070C09]/95 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl p-4 shadow-[0_16px_48px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-500/15">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/60 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate">
                      {profile?.display_name || 'Pilot User'}
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      Verified Eco-Citizen
                    </span>
                  </div>
                </div>

                <div className="py-3 space-y-1.5 text-xs font-mono text-slate-300 border-b border-emerald-500/15">
                  {profile?.email && (
                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-white truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-white">{profile.phone}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-emerald-400/80 pt-1">
                    Wallet Balance: <span className="font-bold text-emerald-300">{coinBalance} PTS</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
