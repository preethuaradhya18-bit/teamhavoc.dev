import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag, 
  Sparkles, 
  Gift, 
  Trees, 
  Coffee, 
  Ticket, 
  Tag, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function CoinsHubTab({ onCoinUpdate }) {
  const [balanceData, setBalanceData] = useState({
    balance: 0,
    total_earned: 0,
    total_redeemed: 0,
    transactions: [],
  });
  const [redeemFeedback, setRedeemFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoinsLedger();
  }, []);

  const fetchCoinsLedger = async () => {
    try {
      const res = await fetchWithAuth('/api/coins/balance');
      const data = await res.json();
      if (data.success) {
        setBalanceData(data);
      }
    } catch (err) {
      console.error('Error fetching coin balance:', err);
    }
  };

  const handleRedeemReward = async (reward) => {
    setLoading(true);
    setRedeemFeedback(null);
    try {
      const formData = new FormData();
      formData.append('reward_title', reward.title);
      formData.append('cost_coins', reward.cost.toString());

      const res = await fetchWithAuth('/api/coins/redeem', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Redemption failed');

      setRedeemFeedback({
        type: 'success',
        text: `Voucher Generated: ${reward.voucherCode} (${reward.title})`,
      });
      fetchCoinsLedger();
      if (onCoinUpdate) onCoinUpdate();
    } catch (err) {
      setRedeemFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Sustainable Marketplace Catalog
  const rewardsCatalog = [
    {
      id: 'r_tree',
      title: 'Plant a Real Geo-Tagged Native Tree',
      category: 'Reforestation Certificate',
      cost: 150,
      icon: Trees,
      badge: 'Bestseller',
      voucherCode: 'ECO-TREE-2026-X81',
      description: 'Dedicated sapling planted in urban green belt with GPS coordinates.',
    },
    {
      id: 'r_cafe',
      title: 'Campus Eco-Cafeteria 25% Off Meal Voucher',
      category: 'Food & Nutrition',
      cost: 80,
      icon: Coffee,
      badge: 'Popular',
      voucherCode: 'CAFE-ECO-25OFF',
      description: 'Valid for zero-waste meals and organic beverages across campus dining.',
    },
    {
      id: 'r_metro',
      title: 'City Metro Transit Pass (50% Subsidy)',
      category: 'Clean Transit',
      cost: 120,
      icon: Ticket,
      badge: 'High Value',
      voucherCode: 'METRO-PASS-SUB50',
      description: 'Subsidized contactless tap-to-ride token for city electric train.',
    },
    {
      id: 'r_swag',
      title: 'Solarpunk Bio-Tech Bamboo Flask & Kit',
      category: 'Merchandise',
      cost: 200,
      icon: Gift,
      badge: 'Limited',
      voucherCode: 'SOLAR-FLASK-SWAG',
      description: 'Insulated stainless steel & bamboo engraved flask to eliminate disposable cups.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Wallet Balance Hero Card */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Decentralized Sustainability Wallet Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Coins & Rewards Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Every verified audit and completed challenge credits Eco-Coins directly into your wallet. Redeem coins for real-world sustainability perks.
            </p>
          </div>

          <div className="bg-black/40 border border-emerald-500/40 p-5 rounded-2xl flex items-center gap-4 shrink-0 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center font-bold shadow-lg">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400/80 block uppercase tracking-wider">
                Current Available Balance
              </span>
              <div className="font-mono text-3xl font-bold text-white">
                {balanceData.balance} <span className="text-xs text-emerald-400">PTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Cumulative Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-500/15">
          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Earned</span>
            <div className="font-mono text-2xl font-bold text-emerald-400 mt-0.5">
              +{balanceData.total_earned}
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Redeemed</span>
            <div className="font-mono text-2xl font-bold text-rose-400 mt-0.5">
              -{balanceData.total_redeemed}
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Transactions</span>
            <div className="font-mono text-2xl font-bold text-white mt-0.5">
              {balanceData.transactions.length}
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Audit Multiplier</span>
            <div className="font-mono text-2xl font-bold text-cyan-300 mt-0.5">
              1.35x
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {redeemFeedback && (
        <div className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-3 ${
          redeemFeedback.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
        }`}>
          {redeemFeedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="font-bold">{redeemFeedback.text}</span>
        </div>
      )}

      {/* Rewards Catalog Marketplace */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <span>Eco-Perks Marketplace</span>
          <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Instant Redemption
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rewardsCatalog.map((reward) => {
            const Icon = reward.icon;
            const canAfford = balanceData.balance >= reward.cost;

            return (
              <div
                key={reward.id}
                className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      {reward.badge}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{reward.cost} PTS</span>
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center my-2">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {reward.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <button
                  onClick={() => handleRedeemReward(reward)}
                  disabled={!canAfford || loading}
                  className={`w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95'
                      : 'bg-white/[0.04] text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <span>{canAfford ? 'Redeem Voucher' : `Need ${reward.cost - balanceData.balance} more`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Transaction Ledger Table */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Wallet Activity Ledger</span>
          <span className="text-[10px] font-mono text-slate-400">
            ({balanceData.transactions.length} entries)
          </span>
        </h2>

        {balanceData.transactions.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No transactions logged yet. Complete a challenge or audit a bill to earn your first coins!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-500/15 text-slate-400 uppercase text-[11px]">
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {balanceData.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      {tx.type === 'EARN' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          <ArrowUpRight className="w-3 h-3" /> EARNED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                          <ArrowDownLeft className="w-3 h-3" /> REDEEMED
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-white font-medium">{tx.description}</td>
                    <td className="py-3 text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className={`py-3 text-right font-bold ${tx.type === 'EARN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'EARN' ? `+${tx.amount}` : `-${tx.amount}`} PTS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
