import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  TrendingDown, 
  ArrowUpRight, 
  Zap, 
  Car, 
  Fuel, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Award,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function ContributorsTab({ activity, footprint, setActiveTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committedActions, setCommittedActions] = useState({});

  useEffect(() => {
    fetchContributors();
  }, [activity]);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/contributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Contributors fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCommit = (actionId) => {
    setCommittedActions((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const primaryDriver = analytics?.primary_driver || footprint?.primary_driver || 'Transport';
  const driverPct = analytics?.primary_driver_pct || footprint?.primary_driver_pct || 45;
  const recommendations = analytics?.recommendations || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>Carbon Driver Analytics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Primary Carbon Contributors
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Targeted analysis isolating your single highest emission driver, paired with practical, high-impact decarbonization strategies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('forecast')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-xs font-mono flex items-center gap-2"
            >
              <span>Simulate Savings</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Driver Focus Alert Card */}
        <div className="mt-8 p-6 rounded-xl bg-black/40 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
              {driverPct}%
            </div>
            <div>
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                CRITICAL FOCUS AREA
              </span>
              <h2 className="text-xl font-bold text-white">
                {primaryDriver} is Your #1 Footprint Contributor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeting this single vector can eliminate the bulk of your personal greenhouse gas output.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-mono text-slate-400 block">Identified Impact Rate</span>
            <span className="font-mono text-2xl font-bold text-white">
              {analytics?.annual_kg_total ? (analytics.annual_kg_total * (driverPct / 100)).toFixed(1) : '950.0'}
            </span>
            <span className="text-xs text-emerald-400 font-mono ml-1">kg CO2e / yr</span>
          </div>
        </div>
      </div>

      {/* Tailored Action Plan Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>High-Priority Decarbonization Action Plan</span>
            <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Personalized
            </span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {Object.values(committedActions).filter(Boolean).length} / {recommendations.length} Habits Committed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec) => {
            const isCommitted = !!committedActions[rec.id];
            return (
              <div
                key={rec.id}
                className={`bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 ${
                  isCommitted
                    ? 'border-emerald-400 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                    : 'border-emerald-500/20 hover:border-emerald-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      {rec.priority}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {rec.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-500/15 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Potential Savings:</span>
                    <span className="text-emerald-400 font-bold">-{rec.impact_kg_annual} kg/yr</span>
                  </div>

                  <button
                    onClick={() => handleToggleCommit(rec.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                      isCommitted
                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-white/[0.05] hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {isCommitted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Habit Committed (+1 Streak)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>{rec.action}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
