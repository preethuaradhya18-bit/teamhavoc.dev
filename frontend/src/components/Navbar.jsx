import React from 'react';
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
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  coinBalance = 0, 
  profile, 
  onLogout,
  avatarTimestamp
}) {
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'carbon_source', label: 'Carbon by Source', icon: PieChart },
    { id: 'local_map', label: 'Local Map', icon: MapPin },
    { id: 'contributors', label: 'Contributors', icon: TrendingDown },
    { id: 'forecast', label: 'Impact Forecast', icon: Sliders },
    { id: 'challenges', label: 'Challenges', icon: Award },
    { id: 'coins', label: 'Coins & Rewards', icon: Coins },
    { id: 'proof_audit', label: 'Proof Audit', icon: ShieldCheck },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'settings', label: 'Profile & Settings', icon: Settings },
  ];

  const avatarSrc = profile?.avatar_path 
    ? `${API_BASE_URL}${profile.avatar_path}?t=${avatarTimestamp || Date.now()}`
    : null;

  return (
    <header className="sticky top-0 z-40 bg-[#070C09]/85 backdrop-blur-xl border-b border-emerald-500/20 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Team Havoc.dev Badge */}
        <div 
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-all">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                NetZero Prints
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Hack Fest 2026
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider hidden sm:block">
              Team Havoc.dev • Solarpunk HUD
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Coins Pill, Profile Avatar, and Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live Coin Ledger Balance Trigger */}
          <button
            onClick={() => setActiveTab('coins')}
            title="Click to open Coins & Rewards Hub"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl transition-all shadow-sm group"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono text-emerald-400/80 leading-none">WALLET</span>
              <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-300">
                {coinBalance} <span className="text-[10px] text-emerald-400">PTS</span>
              </span>
            </div>
          </button>

          {/* User Profile Avatar with cache-buster */}
          <button
            onClick={() => setActiveTab('settings')}
            title="Account Profile & Settings"
            className="flex items-center gap-2.5 p-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-emerald-500/20 hover:border-emerald-400 transition-all"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs font-mono font-medium text-slate-200 hidden md:inline-block max-w-[100px] truncate">
              {profile?.display_name || 'Pilot'}
            </span>
          </button>

          {/* Explicit Logout Button with visible label and tooltip */}
          <button
            onClick={onLogout}
            title="Sign out of NetZero Prints"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Secondary Nav Bar */}
      <div className="xl:hidden flex items-center gap-1 overflow-x-auto no-scrollbar pt-2.5 mt-2 border-t border-emerald-500/10">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
