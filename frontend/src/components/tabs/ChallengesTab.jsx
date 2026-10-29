import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  Award, 
  Coins, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  Flame,
  Zap,
  Car,
  Trash2,
  Power
} from 'lucide-react';

export default function ChallengesTab({ onCoinUpdate }) {
  const [selectedTier, setSelectedTier] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState({});

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/challenges');
      const data = await res.json();
      if (data.success) {
        setChallenges(data.challenges);
      }
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChallenge = async (challengeId) => {
    try {
      const res = await fetchWithAuth(`/api/challenges/${challengeId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setClaimStatus((prev) => ({
          ...prev,
          [challengeId]: `+${data.reward_coins} Coins!`,
        }));
        // Refresh challenge list and wallet balance
        fetchChallenges();
        if (onCoinUpdate) onCoinUpdate();
      }
    } catch (err) {
      console.error('Error completing challenge:', err);
    }
  };

  const filteredChallenges = challenges.filter((c) => c.tier === selectedTier);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Gamified Sustainability Framework</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Multi-Tiered Eco-Challenges
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Complete actionable daily, weekly, and monthly sustainability tasks to slash personal carbon and automatically earn Eco-Coins.
            </p>
          </div>

          {/* Tier Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-emerald-500/20">
            <button
              onClick={() => setSelectedTier('daily')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                selectedTier === 'daily'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Sprints
            </button>
            <button
              onClick={() => setSelectedTier('weekly')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                selectedTier === 'weekly'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Quests
            </button>
            <button
              onClick={() => setSelectedTier('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                selectedTier === 'monthly'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Milestones
            </button>
          </div>
        </div>

        {/* Tier Summary Alert */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-500/15">
          <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              ⚡
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Daily Payouts</span>
              <span className="text-xs font-mono font-bold text-white">15 - 25 Coins per task</span>
            </div>
          </div>

          <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              🎯
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Weekly Quests</span>
              <span className="text-xs font-mono font-bold text-white">45 - 60 Coins per quest</span>
            </div>
          </div>

          <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              👑
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Monthly Milestones</span>
              <span className="text-xs font-mono font-bold text-white">Up to 200 Coins per trophy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge) => {
          const isCompleted = challenge.completed;

          return (
            <div
              key={challenge.id}
              className={`bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 ${
                isCompleted
                  ? 'border-emerald-400/80 bg-emerald-950/20 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : 'border-emerald-500/20 hover:border-emerald-500/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-mono text-xs font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{challenge.reward_coins} Coins</span>
                  </div>
                  <span className="text-xs font-mono uppercase text-slate-400">
                    Target: {challenge.target_metric}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {challenge.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {challenge.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Status</span>
                    <span className="text-emerald-400 font-bold">
                      {isCompleted ? '100% Complete' : `${challenge.progress} / ${challenge.target}`}
                    </span>
                  </div>
                  <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-emerald-500/20">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: isCompleted ? '100%' : `${(challenge.progress / challenge.target) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-500/15">
                {isCompleted ? (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Reward Claimed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCompleteChallenge(challenge.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Complete & Claim {challenge.reward_coins} Coins</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
