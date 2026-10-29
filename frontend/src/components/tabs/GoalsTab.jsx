import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  TrendingDown, 
  AlertCircle,
  X
} from 'lucide-react';

export default function GoalsTab() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form state
  const [interval, setInterval] = useState('monthly');
  const [category, setCategory] = useState('Overall Footprint');
  const [targetKg, setTargetKg] = useState('50');
  const [achievedKg, setAchievedKg] = useState('20');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/goals');
      const data = await res.json();
      if (data.success) {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setInterval('monthly');
    setCategory('Overall Footprint');
    setTargetKg('50');
    setAchievedKg('15');
    setShowModal(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setInterval(goal.interval);
    setCategory(goal.category);
    setTargetKg(goal.target_kg.toString());
    setAchievedKg(goal.achieved_kg.toString());
    setShowModal(true);
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this prevention target goal?')) return;
    try {
      const res = await fetchWithAuth(`/api/goals/${goalId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        fetchGoals();
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        // PUT update
        const res = await fetchWithAuth(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interval,
            category,
            target_kg: parseFloat(targetKg),
            achieved_kg: parseFloat(achievedKg),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          setFeedback({ type: 'success', text: 'Goal target updated!' });
          fetchGoals();
        }
      } else {
        // POST create
        const res = await fetchWithAuth('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interval,
            category,
            target_kg: parseFloat(targetKg),
            achieved_kg: parseFloat(achievedKg) || 0,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          setFeedback({ type: 'success', text: 'New target goal established!' });
          fetchGoals();
        }
      }
    } catch (err) {
      console.error('Error saving goal:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>CO2e Prevention Target Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Goals Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Set, edit, and track custom weekly, monthly, and yearly CO2e reduction targets with real-time dynamic progress bars.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-xs font-mono flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Establish New Goal</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progressPct = Math.min(100, Math.round((goal.achieved_kg / goal.target_kg) * 100));

          return (
            <div
              key={goal.id}
              className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {goal.interval} Goal
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      title="Edit Target"
                      className="p-1 rounded-lg bg-white/[0.05] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Delete Goal"
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">
                  {goal.category}
                </h3>

                {/* Progress Visualizer */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Achieved:</span>
                    <span className="text-emerald-400 font-bold">{goal.achieved_kg} / {goal.target_kg} kg CO2e</span>
                  </div>
                  <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-emerald-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                    <span>Target Horizon: {goal.interval}</span>
                    <span className="text-emerald-300 font-bold">{progressPct}% Complete</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Active Target</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tracking Live
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Goal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b120e] border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>{editingGoal ? 'Edit Reduction Goal' : 'Establish New Reduction Target'}</span>
            </h3>

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                  Interval Horizon
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                >
                  <option value="weekly">Weekly Target</option>
                  <option value="monthly">Monthly Target</option>
                  <option value="yearly">Yearly Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                  Target Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Metro Commute Shift or Solar Charging"
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                    Target (kg CO2e)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetKg}
                    onChange={(e) => setTargetKg(e.target.value)}
                    className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                    Achieved (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={achievedKg}
                    onChange={(e) => setAchievedKg(e.target.value)}
                    className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-5 py-2 rounded-xl text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
