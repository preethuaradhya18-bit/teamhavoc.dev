import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from './api';

// Components & Tabs
import AuthView from './components/AuthView';
import Navbar from './components/Navbar';
import AIChatWidget from './components/AIChatWidget';

import OverviewTab from './components/tabs/OverviewTab';
import CarbonBySourceTab from './components/tabs/CarbonBySourceTab';
import LocalMapTab from './components/tabs/LocalMapTab';
import ContributorsTab from './components/tabs/ContributorsTab';
import ForecastTab from './components/tabs/ForecastTab';
import ChallengesTab from './components/tabs/ChallengesTab';
import CoinsHubTab from './components/tabs/CoinsHubTab';
import ProofAuditTab from './components/tabs/ProofAuditTab';
import GoalsTab from './components/tabs/GoalsTab';
import SettingsTab from './components/tabs/SettingsTab';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // 4-Vector Footprint Activity State (Diet Purged!)
  const [activity, setActivity] = useState({
    electricity_kwh: 120,
    commute_km_weekly: 85,
    primary_transport_mode: 'Solo Petrol Car',
    secondary_transport_mode: 'Public Bus',
    secondary_transport_pct: 20,
    fuel_liters_monthly: 20,
    fuel_type: 'Petrol',
    waste_kg_weekly: 12,
    segregation_recycled_pct: 35,
    segregation_composted_pct: 25,
  });

  const [footprint, setFootprint] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Check auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('netzero_token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserData();
      calculateFootprint();
    }

    const handleLogout = () => {
      setIsAuthenticated(false);
      setProfile(null);
    };

    window.addEventListener('netzero_auth_logout', handleLogout);
    return () => window.removeEventListener('netzero_auth_logout', handleLogout);
  }, []);

  const fetchUserData = async () => {
    try {
      // 1. Fetch Profile
      const resProfile = await fetchWithAuth('/api/user/profile');
      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data);
      }

      // 2. Fetch Wallet Balance
      const resCoins = await fetchWithAuth('/api/coins/balance');
      if (resCoins.ok) {
        const coinData = await resCoins.json();
        setCoinBalance(coinData.balance);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const calculateFootprint = async () => {
    setCalculating(true);
    try {
      const res = await fetchWithAuth('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (res.ok) {
        const data = await res.json();
        setFootprint(data.data);
      }
    } catch (err) {
      console.error('Failed to calculate footprint:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    fetchUserData();
    calculateFootprint();
  };

  const handleLogout = () => {
    localStorage.removeItem('netzero_token');
    localStorage.removeItem('netzero_user');
    setIsAuthenticated(false);
    setProfile(null);
  };

  // 1. Mandatory Auth Guard: if not authenticated, render Login/Auth screen
  if (!isAuthenticated) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070C09] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      {/* Solarpunk Ambient Blur Background Highlights */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-80 h-80 bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Fixed Sticky HUD Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coinBalance={coinBalance}
        profile={profile}
        onLogout={handleLogout}
        avatarTimestamp={avatarTimestamp}
      />

      {/* Main Tabbed Command Center Viewport */}
      <main className="lg:pl-64 pt-20 lg:pt-8 max-w-7xl mx-auto px-4 lg:px-8 py-8 relative z-10">
        {activeTab === 'overview' && (
          <OverviewTab
            activity={activity}
            setActivity={setActivity}
            footprint={footprint}
            onCalculate={calculateFootprint}
            calculating={calculating}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'carbon_source' && (
          <CarbonBySourceTab
            footprint={footprint}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'local_map' && (
          <LocalMapTab />
        )}

        {activeTab === 'contributors' && (
          <ContributorsTab
            activity={activity}
            footprint={footprint}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastTab
            activity={activity}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesTab
            onCoinUpdate={fetchUserData}
          />
        )}

        {activeTab === 'coins' && (
          <CoinsHubTab
            onCoinUpdate={fetchUserData}
          />
        )}

        {activeTab === 'proof_audit' && (
          <ProofAuditTab
            onCoinUpdate={fetchUserData}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTab />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            profile={profile}
            onProfileUpdate={fetchUserData}
            avatarTimestamp={avatarTimestamp}
            setAvatarTimestamp={setAvatarTimestamp}
          />
        )}
      </main>

      {/* Floating Solarpunk AI Helpdesk Bot Widget */}
      <AIChatWidget />
    </div>
  );
}
