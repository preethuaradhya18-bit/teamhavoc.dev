import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../../api';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Hash, 
  Clock, 
  Tag, 
  ArrowUpRight 
} from 'lucide-react';

export default function ProofAuditTab({ onCoinUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('Electricity');
  const [docType, setDocType] = useState('Utility Bill');
  const [reportedValue, setReportedValue] = useState('120');
  const [unit, setUnit] = useState('kWh');
  const [notes, setNotes] = useState('');

  const [uploading, setUploading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetchWithAuth('/api/audit/logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Audit logs fetch error:', err);
    }
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    if (cat === 'Electricity') {
      setDocType('Utility Bill');
      setUnit('kWh');
      setReportedValue('120');
    } else if (cat === 'Transport') {
      setDocType('Metro Pass / Bus Ticket');
      setUnit('km');
      setReportedValue('85');
    } else if (cat === 'Fuel') {
      setDocType('Gas Station Receipt');
      setUnit('Liters');
      setReportedValue('25');
    } else if (cat === 'Waste') {
      setDocType('Compost Scale Receipt');
      setUnit('kg');
      setReportedValue('14');
    } else {
      setDocType('Eco-Certificate');
      setUnit('badge');
      setReportedValue('1');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', text: 'Please select a proof file (.pdf, .png, .jpg) to upload.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', category);
      formData.append('document_type', docType);
      formData.append('reported_value', reportedValue);
      formData.append('unit', unit);
      if (notes) formData.append('notes', notes);

      // Do NOT manually set Content-Type so browser creates boundary
      const res = await fetchWithAuth('/api/audit/verify-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Audit verification rejected');

      setFeedback({
        type: 'success',
        text: data.message || 'Audit Verified & Sealed into Compliance Ledger!',
      });
      setSelectedFile(null);
      fetchAuditLogs();
      if (onCoinUpdate) onCoinUpdate();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Greenwashing Verification Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Doc Verification Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Upload utility bills, fuel receipts, transit passes, or certificates. The backend cryptographic engine hashes documents to reject duplicates and awards Eco-Coin bounties upon approval.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-mono text-xs text-emerald-400">
            <Coins className="w-4 h-4" />
            <span>Earn 30 - 75 Coins per audit</span>
          </div>
        </div>

        {/* Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-500/15">
          <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono uppercase text-emerald-400 block font-bold">SHA-256 Anti-Spoof</span>
            <p className="text-xs text-slate-400 mt-0.5">Every document buffer is cryptographically fingerprinted to block re-uploading.</p>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono uppercase text-teal-400 block font-bold">1.35x Trust Multiplier</span>
            <p className="text-xs text-slate-400 mt-0.5">Verified logs carry higher weight on campus leaderboards and ESG reports.</p>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/15">
            <span className="text-[11px] font-mono uppercase text-cyan-400 block font-bold">Automated Coin Credit</span>
            <p className="text-xs text-slate-400 mt-0.5">Approved uploads immediately credit your wallet ledger with reward points.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Form + Audited Documents Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Form Card */}
        <div className="lg:col-span-5 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Submit Verification Document</span>
          </h2>

          {feedback && (
            <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
              feedback.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}>
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{feedback.text}</div>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                Activity Category
              </label>
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
              >
                <option value="Electricity">Electricity (+50 Coins)</option>
                <option value="Transport">Public Transit / Commute (+40 Coins)</option>
                <option value="Fuel">Direct Vehicle Fuel (+35 Coins)</option>
                <option value="Waste">Organic Waste Composting (+30 Coins)</option>
                <option value="Eco-Certificate">Campus Eco-Certificate (+75 Coins)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                  Reported Metric
                </label>
                <input
                  type="text"
                  value={reportedValue}
                  onChange={(e) => setReportedValue(e.target.value)}
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  required
                />
              </div>
            </div>

            {/* Local File Picker */}
            <div>
              <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                Select Proof File (.png, .jpg, .pdf)
              </label>
              <div className="border border-dashed border-emerald-500/40 hover:border-emerald-400 bg-black/30 rounded-xl p-4 text-center cursor-pointer transition-all">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="hidden"
                  id="proof-upload-input"
                />
                <label htmlFor="proof-upload-input" className="cursor-pointer block">
                  <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <span className="text-xs font-mono text-slate-300 block">
                    {selectedFile ? selectedFile.name : 'Click to select proof from local drive'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">
                    Max size: 5MB
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-emerald-400/80 mb-1.5">
                Notes or Bill Reference #
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. BESCOM Metro Bill #9042"
                className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs font-mono shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{uploading ? 'Auditing Hash...' : 'Audit & Claim Coins'}</span>
            </button>
          </form>
        </div>

        {/* Audited Records Table */}
        <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Audited Compliance Ledger</span>
              <span className="text-[10px] font-mono text-slate-400">
                ({auditLogs.length} verified documents)
              </span>
            </h2>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-slate-500">
              No proof documents uploaded yet. Upload your first utility bill or bus pass to earn verified status!
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{log.category}</span>
                      <span className="text-[10px] font-mono text-slate-400">• {log.document_type}</span>
                      {log.status === 'VERIFIED' ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                          Verified
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                          Rejected
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      Reported: <span className="text-emerald-400 font-bold">{log.reported_value} {log.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                      Hash: {log.file_hash?.slice(0, 24)}...
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      +{log.coins_awarded} Coins
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
