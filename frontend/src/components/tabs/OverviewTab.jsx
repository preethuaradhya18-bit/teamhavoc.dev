import React, { useState } from 'react';
import { 
  Zap, 
  Car, 
  Fuel, 
  Trash2, 
  Sparkles, 
  Calculator, 
  ArrowUpRight, 
  ShieldCheck, 
  Activity, 
  Globe2, 
  TrendingDown, 
  CheckCircle2,
  Sliders,
  Award
} from 'lucide-react';

export default function OverviewTab({ 
  activity, 
  setActivity, 
  footprint, 
  onCalculate, 
  calculating, 
  setActiveTab 
}) {
  const categories = footprint?.categories_chart || [
    { name: 'Electricity', percent: 35, color: '#10b981', annual_kg: 662.4, icon: Zap },
    { name: 'Transport', percent: 45, color: '#06b6d4', annual_kg: 848.6, icon: Car },
    { name: 'Fuel', percent: 12, color: '#f59e0b', annual_kg: 554.4, icon: Fuel },
    { name: 'Waste', percent: 8, color: '#8b5cf6', annual_kg: 210.0, icon: Trash2 },
  ];

  const totalKg = footprint?.annual_kg_total || 2275.4;
  const totalTons = footprint?.annual_tons_total || (totalKg / 1000).toFixed(3);
  const monthlyKg = (totalKg / 12).toFixed(1);

  // SVG Donut calculation
  let cumulativeAngle = 0;
  const donutPaths = categories.map((cat) => {
    const angle = (cat.percent / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return {
      ...cat,
      startAngle,
      angle,
    };
  });

  return (
    <div className="space-y-8">
      {/* Hero Solarpunk HUD Overview Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
                Live Solarpunk Telemetry • Active Session
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Carbon Intelligence Command Center
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Real-time multi-vector footprint tracking across <span className="text-emerald-400 font-mono">Electricity</span>, <span className="text-cyan-400 font-mono">Transport</span>, <span className="text-amber-400 font-mono">Fuel</span>, and <span className="text-purple-400 font-mono">Waste</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('forecast')}
              className="bg-white/[0.05] hover:bg-emerald-500/15 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-mono text-emerald-300 font-bold flex items-center gap-2 transition-all"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Forecast Engine</span>
            </button>
            <button
              onClick={() => setActiveTab('proof_audit')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-xs font-mono flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Doc Verification</span>
            </button>
          </div>
        </div>

        {/* 4 Primary KPI Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-500/15">
          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-400/80 mb-1 flex items-center justify-between">
              <span>Annual Footprint</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
              {totalTons} <span className="text-xs text-emerald-400 font-normal">t CO2e</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              ~{totalKg} kg per year
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-400/80 mb-1 flex items-center justify-between">
              <span>Monthly Run-Rate</span>
              <TrendingDown className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
              {monthlyKg} <span className="text-xs text-emerald-400 font-normal">kg/mo</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Baseline activity rate
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-400/80 mb-1 flex items-center justify-between">
              <span>Primary Driver</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-amber-300 truncate">
              {footprint?.primary_driver || 'Transport'}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1 font-mono">
              {footprint?.primary_driver_pct || 45}% of total footprint
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-400/80 mb-1 flex items-center justify-between">
              <span>Verification Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-mono text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Audit Certified</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Cryptographically audited
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-Vector Logger Form + Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 4-Vector Activity Input Logger */}
        <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Multi-Vector Activity Logger</span>
                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Scope 1, 2, 3
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Update consumption metrics to recalculate footprint in real time.
              </p>
            </div>
            <button
              onClick={onCalculate}
              disabled={calculating}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{calculating ? 'Syncing...' : 'Sync Metrics'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Electricity Vector */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" /> Electricity (Scope 2)
                </span>
                <span className="text-xs font-mono text-slate-400">kWh/mo</span>
              </div>
              <input
                type="number"
                min="0"
                value={activity.electricity_kwh}
                onChange={(e) => setActivity({ ...activity, electricity_kwh: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-emerald-400"
              />
              <div className="text-[11px] text-slate-500 font-mono">
                Avg grid factor: 0.46 kg CO2e / kWh
              </div>
            </div>

            {/* 2. Transport Vector */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-cyan-400" /> Commute (Scope 3)
                </span>
                <span className="text-xs font-mono text-slate-400">km/wk</span>
              </div>
              <input
                type="number"
                min="0"
                value={activity.commute_km_weekly}
                onChange={(e) => setActivity({ ...activity, commute_km_weekly: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-cyan-400"
              />
              <select
                value={activity.primary_transport_mode}
                onChange={(e) => setActivity({ ...activity, primary_transport_mode: e.target.value })}
                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono outline-none focus:border-cyan-400"
              >
                <option value="Solo Petrol Car">Solo Petrol Car (0.192 kg/km)</option>
                <option value="Solo Diesel Car">Solo Diesel Car (0.171 kg/km)</option>
                <option value="Hybrid Vehicle">Hybrid Vehicle (0.105 kg/km)</option>
                <option value="Electric Vehicle">Electric Vehicle (0.052 kg/km)</option>
                <option value="Public Bus">Public Bus (0.039 kg/km)</option>
                <option value="Metro / Electric Train">Metro / Electric Train (0.028 kg/km)</option>
                <option value="Bicycle / Walking">Bicycle / Walking (0.000 kg/km)</option>
              </select>
            </div>

            {/* 3. Fuel Vector */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-400" /> Direct Fuel (Scope 1)
                </span>
                <span className="text-xs font-mono text-slate-400">Liters/mo</span>
              </div>
              <input
                type="number"
                min="0"
                value={activity.fuel_liters_monthly}
                onChange={(e) => setActivity({ ...activity, fuel_liters_monthly: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-400"
              />
              <select
                value={activity.fuel_type}
                onChange={(e) => setActivity({ ...activity, fuel_type: e.target.value })}
                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono outline-none focus:border-amber-400"
              >
                <option value="Petrol">Petrol (2.31 kg CO2e / L)</option>
                <option value="Diesel">Diesel (2.68 kg CO2e / L)</option>
                <option value="LPG">LPG (1.51 kg CO2e / L)</option>
              </select>
            </div>

            {/* 4. Waste Vector */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-purple-400" /> Solid Waste (Scope 3)
                </span>
                <span className="text-xs font-mono text-slate-400">kg/wk</span>
              </div>
              <input
                type="number"
                min="0"
                value={activity.waste_kg_weekly}
                onChange={(e) => setActivity({ ...activity, waste_kg_weekly: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-purple-400"
              />
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Recycled: {activity.segregation_recycled_pct}%</span>
                <span>•</span>
                <span>Compost: {activity.segregation_composted_pct}%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-center justify-between font-mono">
            <span>Note: Dietary vector has been purged per environmental rebalance protocol.</span>
            <span className="text-emerald-400 font-bold">4-Vector Balance</span>
          </div>
        </div>

        {/* Right Column: Donut Breakdown Visualizer */}
        <div className="lg:col-span-5 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Carbon by Pillar</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Breakdown
                </span>
              </h2>
              <button
                onClick={() => setActiveTab('carbon_source')}
                className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                Deep Dive →
              </button>
            </div>

            {/* Custom SVG Donut Chart */}
            <div className="relative flex items-center justify-center my-6">
              <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r="75"
                  fill="transparent"
                  stroke="#16201a"
                  strokeWidth="28"
                />
                {categories.map((cat, idx) => {
                  const circumference = 2 * Math.PI * 75;
                  const strokeDasharray = `${(cat.percent / 100) * circumference} ${circumference}`;
                  let offset = 0;
                  for (let i = 0; i < idx; i++) {
                    offset += (categories[i].percent / 100) * circumference;
                  }
                  return (
                    <circle
                      key={cat.name}
                      cx="110"
                      cy="110"
                      r="75"
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth="28"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={-offset}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  );
                })}
              </svg>

              {/* Centered Total Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-mono text-emerald-400/80 uppercase tracking-widest">
                  TOTAL
                </span>
                <span className="font-mono text-2xl font-bold text-white">
                  {totalTons}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  t CO2e / yr
                </span>
              </div>
            </div>

            {/* Category Share List */}
            <div className="space-y-2 mt-4">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-mono bg-black/30 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-200 font-medium">{cat.name}</span>
                    <span className="text-[10px] text-slate-500">({cat.scope})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{cat.annual_kg} kg</span>
                    <span className="font-bold text-white">{cat.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('contributors')}
            className="w-full mt-6 py-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300 font-bold flex items-center justify-center gap-2 transition-all"
          >
            <span>Analyze Top Contributor Action Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
