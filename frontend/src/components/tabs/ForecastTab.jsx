import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  Sliders, 
  Sparkles, 
  Trees, 
  Car, 
  DollarSign, 
  TrendingDown, 
  Zap, 
  Trash2, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function ForecastTab({ activity, setActiveTab }) {
  const [evShift, setEvShift] = useState(40);
  const [solarShift, setSolarShift] = useState(35);
  const [wasteShift, setWasteShift] = useState(50);
  
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runForecastCalculation();
  }, [evShift, solarShift, wasteShift, activity]);

  const runForecastCalculation = async () => {
    try {
      const res = await fetchWithAuth('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline_activity: activity,
          ev_transit_shift_pct: evShift,
          green_grid_solar_pct: solarShift,
          waste_recycling_compost_pct: wasteShift,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForecast(data.data);
      }
    } catch (err) {
      console.error('Forecast calculation error:', err);
    }
  };

  const baselineKg = forecast?.baseline_annual_kg || 2275.4;
  const projectedKg = forecast?.projected_annual_kg || 1580.2;
  const savedKg = forecast?.annual_kg_saved || 695.2;
  const pctReduction = forecast?.pct_reduction || 30.6;
  const trees = forecast?.trees_equivalent || 31.6;
  const kmOffset = forecast?.km_car_offset || 3620;
  const costSavings = forecast?.estimated_cost_saved_usd || 83.42;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Reactive Behavioral Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Impact Forecast Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Drag interactive habit sliders to preview projected monthly & yearly CO2e savings before committing to operational shifts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEvShift(50); setSolarShift(50); setWasteShift(60); }}
              className="bg-white/[0.05] hover:bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-300 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Optimal Plan</span>
            </button>
          </div>
        </div>

        {/* Real-time Projected Savings HUD Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-500/15">
          <div className="bg-black/40 border border-emerald-500/30 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-mono uppercase text-emerald-400/80 block">
              Annual CO2e Prevented
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400">
              -{savedKg} <span className="text-xs text-white font-normal">kg/yr</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400/90 font-bold">
              {pctReduction}% Footprint Cut
            </div>
          </div>

          <div className="bg-black/40 border border-emerald-500/30 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-mono uppercase text-teal-400/80 block">
              Tree Offset Equivalent
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Trees className="w-6 h-6 text-emerald-400" />
              <span>{trees}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Mature trees planted / yr
            </div>
          </div>

          <div className="bg-black/40 border border-emerald-500/30 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-mono uppercase text-cyan-400/80 block">
              Car Driving Offset
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Car className="w-6 h-6 text-cyan-400" />
              <span>{kmOffset}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Gasoline km avoided
            </div>
          </div>

          <div className="bg-black/40 border border-emerald-500/30 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-mono uppercase text-amber-400/80 block">
              Direct Utility Savings
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-amber-300 flex items-center gap-1">
              <DollarSign className="w-6 h-6 text-amber-400" />
              <span>{costSavings}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Estimated fuel & bill saved
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Grid & Visual Baseline Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Controls */}
        <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Behavioral Habit Levers</span>
            <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Interactive
            </span>
          </h2>

          {/* Lever 1: EV & Public Transit Shift */}
          <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  EV & Transit Commute Shift
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-cyan-400">{evShift}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={evShift}
              onChange={(e) => setEvShift(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-black/60 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% (Solo ICE Car)</span>
              <span>50% (Transit 3 Days/Wk)</span>
              <span>100% (Zero-Emission)</span>
            </div>
          </div>

          {/* Lever 2: Green Grid Solar Shift */}
          <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Green Grid Solar-Hour Sync
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400">{solarShift}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={solarShift}
              onChange={(e) => setSolarShift(parseInt(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-black/60 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% (Unmanaged Grid)</span>
              <span>50% (Solar Window Shift)</span>
              <span>100% (100% Rooftop Solar)</span>
            </div>
          </div>

          {/* Lever 3: Waste Recycling & Compost */}
          <div className="bg-black/40 border border-purple-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Waste Diversion & Aerobic Composting
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-purple-400">{wasteShift}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={wasteShift}
              onChange={(e) => setWasteShift(parseInt(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer h-2 bg-black/60 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% (100% Landfill)</span>
              <span>50% (Dry Segregated)</span>
              <span>100% (Zero-Waste Circular)</span>
            </div>
          </div>
        </div>

        {/* Visual Baseline vs Projected Comparison */}
        <div className="lg:col-span-5 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Projected Annual Emission Trajectory
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-6">
              Visual comparison of current baseline against simulated habit reduction.
            </p>

            <div className="space-y-6">
              {/* Baseline Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Current Baseline:</span>
                  <span className="font-bold text-white">{baselineKg} kg CO2e</span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-4 overflow-hidden border border-slate-700 p-0.5">
                  <div className="h-full bg-rose-500/80 rounded-full w-full" />
                </div>
              </div>

              {/* Projected Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-emerald-400 font-bold">Simulated Horizon:</span>
                  <span className="font-bold text-emerald-400">{projectedKg} kg CO2e</span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-4 overflow-hidden border border-emerald-500/30 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(15, (projectedKg / baselineKg) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Savings Breakdown by Pillar */}
            {forecast?.savings_by_pillar && (
              <div className="mt-8 pt-6 border-t border-emerald-500/15 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Avoided CO2e by Vector:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-black/40 p-2 rounded-lg border border-cyan-500/20">
                    <span className="text-[10px] text-slate-400 block">Transport</span>
                    <span className="font-bold text-cyan-300">-{forecast.savings_by_pillar.transport_saved_kg} kg</span>
                  </div>
                  <div className="bg-black/40 p-2 rounded-lg border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">Electricity</span>
                    <span className="font-bold text-emerald-300">-{forecast.savings_by_pillar.electricity_saved_kg} kg</span>
                  </div>
                  <div className="bg-black/40 p-2 rounded-lg border border-purple-500/20">
                    <span className="text-[10px] text-slate-400 block">Waste</span>
                    <span className="font-bold text-purple-300">-{forecast.savings_by_pillar.waste_saved_kg} kg</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('challenges')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs font-mono shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Lock Target into Challenges Hub</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
