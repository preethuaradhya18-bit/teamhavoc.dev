import React, { useState } from 'react';
import { LoadScript, GoogleMap } from '@react-google-maps/api';
import { 
  MapPin, 
  Search, 
  Layers, 
  Compass, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Eye, 
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function LocalMapTab() {
  const [searchQuery, setSearchQuery] = useState('560001');
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'terrain'
  const [activeZone, setActiveZone] = useState(null);

  // Regional simulated geospatial zones with carbon density indicators
  const zones = [
    {
      id: 'zone_1',
      pincode: '560001',
      name: 'Central Metro Tech Corridor',
      intensityColor: 'red',
      level: 'High Carbon Density',
      gridIntensity: '0.68 kg/kWh',
      primaryEmitter: 'Heavy Commute & Commercial HVAC',
      reductionPotential: '28%',
      coordinates: { x: 38, y: 42 },
      recommendation: 'Prioritize transit shift and solar carport integrations.',
    },
    {
      id: 'zone_2',
      pincode: '560034',
      name: 'North Green Campus & Hostel Cluster',
      intensityColor: 'green',
      level: 'Low / Eco-Friendly Zone',
      gridIntensity: '0.24 kg/kWh',
      primaryEmitter: 'Rooftop Solar Substation Net Exporter',
      reductionPotential: '8%',
      coordinates: { x: 62, y: 28 },
      recommendation: 'Ideal micro-charging hub during 11 AM - 3 PM solar peak.',
    },
    {
      id: 'zone_3',
      pincode: '560095',
      name: 'East Bio-Tech Labs & Workshops',
      intensityColor: 'yellow',
      level: 'Moderate Carbon Density',
      gridIntensity: '0.44 kg/kWh',
      primaryEmitter: 'Autoclave & Machinery Baseline Loads',
      reductionPotential: '19%',
      coordinates: { x: 74, y: 58 },
      recommendation: 'Implement night standby auto-disconnect smart strips.',
    },
    {
      id: 'zone_4',
      pincode: '560100',
      name: 'South Suburban Commuter Ring',
      intensityColor: 'yellow',
      level: 'Moderate Carbon Density',
      gridIntensity: '0.48 kg/kWh',
      primaryEmitter: 'Solo Vehicular Outflow',
      reductionPotential: '34%',
      coordinates: { x: 25, y: 72 },
      recommendation: 'Expand EV feeder shuttle routes to closest metro terminal.',
    },
    {
      id: 'zone_5',
      pincode: '560068',
      name: 'Industrial Logistics & Freight Hub',
      intensityColor: 'red',
      level: 'High Carbon Density',
      gridIntensity: '0.74 kg/kWh',
      primaryEmitter: 'Diesel Freight & Warehouse Generators',
      reductionPotential: '42%',
      coordinates: { x: 82, y: 80 },
      recommendation: 'Electrify forklift fleets and mandate roof solar PV.',
    },
  ];

  // Filtered zone matching search query
  const filteredZones = zones.filter(
    (z) => z.pincode.includes(searchQuery.trim()) || z.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedZone = activeZone || filteredZones[0] || zones[0];

  return (
    <div className="space-y-8">
      {/* Map Hub Header */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Interactive Local Emission Heatmap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Local Carbon Density Map Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Search by 6-digit Pincode or Locality Name to highlight regional grid intensity and local carbon density overlays.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Pincode (e.g. 560001) or Area"
              className="w-full bg-black/50 border border-emerald-500/30 focus:border-emerald-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono outline-none"
            />
          </div>
        </div>

        {/* Layer Controls & Quick Pincode Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-emerald-500/15">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Map Layer:</span>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                mapLayer === 'satellite'
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-white/[0.05] text-slate-300 hover:text-white'
              }`}
            >
              Satellite View
            </button>
            <button
              onClick={() => setMapLayer('terrain')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                mapLayer === 'terrain'
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-white/[0.05] text-slate-300 hover:text-white'
              }`}
            >
              Terrain / Topo
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Quick Areas:</span>
            {['560001', '560034', '560095'].map((pin) => (
              <button
                key={pin}
                onClick={() => setSearchQuery(pin)}
                className="bg-black/40 hover:bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]"
              >
                {pin}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas + Details Sidecar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map Canvas (Bright Sat/Terrain HUD View) */}
        <div className="lg:col-span-8 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          {/* Simulated Satellite/Terrain Textured Map Canvas */}
          <div 
            className={`w-full h-full min-h-[420px] rounded-xl relative overflow-hidden transition-all duration-700 ${
              mapLayer === 'satellite'
                ? 'bg-gradient-to-br from-[#0c1a13] via-[#091510] to-[#06110d]'
                : 'bg-gradient-to-br from-[#121f18] via-[#0f1914] to-[#09110d]'
            }`}
          >
            {/* Topographic Contours / Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Simulated River & Highway Vector Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <path d="M 0 140 Q 200 120 400 240 T 800 280" fill="none" stroke="#06b6d4" strokeWidth="4" />
              <path d="M 120 0 Q 300 300 480 500" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 300 0 L 300 600" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            {/* Interactive Zone Markers */}
            {zones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const colorBg = 
                zone.intensityColor === 'red' ? 'bg-rose-500' :
                zone.intensityColor === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400';
              const shadowColor = 
                zone.intensityColor === 'red' ? 'shadow-[0_0_20px_rgba(244,63,94,0.6)]' :
                zone.intensityColor === 'yellow' ? 'shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'shadow-[0_0_20px_rgba(16,185,129,0.6)]';

              return (
                <div
                  key={zone.id}
                  onClick={() => setActiveZone(zone)}
                  style={{ top: `${zone.coordinates.y}%`, left: `${zone.coordinates.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  <div className={`w-8 h-8 rounded-full ${colorBg} text-black font-extrabold flex items-center justify-center text-xs ${shadowColor} transition-transform group-hover:scale-125 ${isSelected ? 'ring-4 ring-white scale-125' : ''}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                    <span className="font-bold">{zone.pincode}</span>: {zone.name.slice(0, 18)}...
                  </div>
                </div>
              );
            })}

            {/* Compass HUD */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>NORTH HUD</span>
            </div>

            {/* Heatmap Legend Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3 flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-300">High Intensity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Low / Eco</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Zone Deep-Dive Details */}
        <div className="lg:col-span-4 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Zone Inspector
            </span>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
              selectedZone.intensityColor === 'red' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
              selectedZone.intensityColor === 'yellow' ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' :
              'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {selectedZone.level}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {selectedZone.name}
            </h2>
            <div className="font-mono text-xs text-slate-400 mt-0.5">
              Postal Index: <span className="text-emerald-400 font-bold">{selectedZone.pincode}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="bg-black/40 border border-emerald-500/15 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Grid Intensity
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {selectedZone.gridIntensity}
              </span>
            </div>

            <div className="bg-black/40 border border-emerald-500/15 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Primary Emitter
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 text-right max-w-[150px] truncate">
                {selectedZone.primaryEmitter}
              </span>
            </div>

            <div className="bg-black/40 border border-emerald-500/15 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-cyan-400" /> Reduction Potential
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {selectedZone.reductionPotential}
              </span>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-slate-300 space-y-1">
            <span className="font-mono text-emerald-400 font-bold block uppercase text-[10px]">
              Decarbonization Directive:
            </span>
            <p className="leading-relaxed">
              {selectedZone.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
