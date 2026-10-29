import React from 'react';
import { 
  Zap, 
  Car, 
  Fuel, 
  Trash2, 
  Layers, 
  ShieldAlert, 
  Info, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export default function CarbonBySourceTab({ footprint, setActiveTab }) {
  const categories = footprint?.categories_chart || [
    { name: 'Electricity', percent: 35.0, color: '#10b981', annual_kg: 662.4, scope: 'Scope 2', icon: Zap },
    { name: 'Transport', percent: 45.0, color: '#06b6d4', annual_kg: 848.6, scope: 'Scope 3', icon: Car },
    { name: 'Fuel', percent: 12.0, color: '#f59e0b', annual_kg: 554.4, scope: 'Scope 1', icon: Fuel },
    { name: 'Waste', percent: 8.0, color: '#8b5cf6', annual_kg: 210.0, scope: 'Scope 3', icon: Trash2 },
  ];

  const scopes = footprint?.scopes || {
    scope1_kg: 554.4,
    scope2_kg: 662.4,
    scope3_kg: 1058.6,
    scope1_tons: 0.554,
    scope2_tons: 0.662,
    scope3_tons: 1.059,
  };

  const totalKg = footprint?.annual_kg_total || (scopes.scope1_kg + scopes.scope2_kg + scopes.scope3_kg);

  return (
    <div className="space-y-8">
      {/* Tab Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>GHG Protocol Scope 1 • 2 • 3 Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Carbon by Source Breakdown
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Strict 4-Pillar carbon accounting. All emission vectors map directly into international GHG accounting scopes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('contributors')}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <span>View Driver Action Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Scope Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-500/15">
          <div className="bg-black/40 border border-amber-500/30 p-5 rounded-xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Scope 1 (Direct)</span>
              <span className="text-[10px] font-mono text-slate-400 bg-amber-500/10 px-2 py-0.5 rounded">Fuel & Onsite</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">
              {scopes.scope1_tons} <span className="text-xs text-amber-400 font-normal">t CO2e</span>
            </div>
            <p className="text-xs text-slate-400">
              Direct combustion of petrol, diesel, and heating fuels under immediate user operational control.
            </p>
            <div className="text-[11px] font-mono text-amber-400/90 pt-1">
              Annual: {scopes.scope1_kg} kg ({((scopes.scope1_kg / totalKg) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="bg-black/40 border border-emerald-500/30 p-5 rounded-xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Scope 2 (Indirect)</span>
              <span className="text-[10px] font-mono text-slate-400 bg-emerald-500/10 px-2 py-0.5 rounded">Purchased Power</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">
              {scopes.scope2_tons} <span className="text-xs text-emerald-400 font-normal">t CO2e</span>
            </div>
            <p className="text-xs text-slate-400">
              Emissions from generation of purchased grid electricity supplied to appliances and labs.
            </p>
            <div className="text-[11px] font-mono text-emerald-400/90 pt-1">
              Annual: {scopes.scope2_kg} kg ({((scopes.scope2_kg / totalKg) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="bg-black/40 border border-cyan-500/30 p-5 rounded-xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Scope 3 (Value Chain)</span>
              <span className="text-[10px] font-mono text-slate-400 bg-cyan-500/10 px-2 py-0.5 rounded">Transit & Waste</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">
              {scopes.scope3_tons} <span className="text-xs text-cyan-400 font-normal">t CO2e</span>
            </div>
            <p className="text-xs text-slate-400">
              Downstream and upstream supply chain impacts: commuter transport and landfill waste decay.
            </p>
            <div className="text-[11px] font-mono text-cyan-400/90 pt-1">
              Annual: {scopes.scope3_kg} kg ({((scopes.scope3_kg / totalKg) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Pillar Metrics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          return (
            <div 
              key={cat.name}
              className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="font-mono text-xs font-extrabold">{cat.percent}%</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{cat.name}</h3>
                    <div className="text-xs font-mono text-slate-400">{cat.scope} Standard</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-lg font-bold text-white">
                    {cat.annual_kg} <span className="text-xs text-slate-400 font-normal">kg/yr</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    {(cat.annual_kg / 12).toFixed(1)} kg/mo
                  </div>
                </div>
              </div>

              {/* Progress bar visualizer */}
              <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden p-0.5 border border-emerald-500/20">
                <div 
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                />
              </div>

              <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-1">
                <span>Accountability: Third-Party Verifiable</span>
                <span className="text-emerald-400 font-bold">Auditable</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
