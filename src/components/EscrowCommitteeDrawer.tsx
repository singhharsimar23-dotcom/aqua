import React from 'react';
import { X, ShieldAlert, CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react';
import { EscrowStatus, FarmerRecord, ProvenanceTrace } from 'packages/core';

interface EscrowCommitteeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerRecord;
  onApplyVerdict: (farmerId: string, status: EscrowStatus) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
}

export const EscrowCommitteeDrawer: React.FC<EscrowCommitteeDrawerProps> = ({
  isOpen,
  onClose,
  farmer,
  onApplyVerdict,
}) => {
  if (!isOpen) return null;

  const isHeld = farmer.escrowStatus === 'HELD';
  const isConfirmed = farmer.escrowStatus === 'CONFIRMED';
  const isDismissed = farmer.escrowStatus === 'DISMISSED';
  const isTimeout = farmer.escrowStatus === 'TIMEOUT_RELEASED';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0d1017] border-l border-white/[0.1] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto text-slate-100 font-sans">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  Escrow Committee Governance
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">Human review panel for flagged discrepancies</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Invariant Statement */}
          <div className="mt-4 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs leading-relaxed text-slate-300">
            <strong className="text-sky-400 font-semibold">Civic Governance Rule: </strong>
            Signals flag discrepancies; they <span className="text-amber-300 font-semibold">never auto-cut water</span>. Disputed volume is held in escrow until confirmed by the Gram Panchayat Committee.
          </div>

          {/* Farmer Case Summary */}
          <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400">Subject: </span>
                <span className="font-semibold text-sm text-white">
                  {farmer.name} (Farmer {farmer.id})
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">{farmer.wellId} · {farmer.areaHa} ha</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-white/[0.06] font-mono">
              <div className="p-2.5 bg-black/40 rounded-lg border border-white/[0.06]">
                <div className="text-slate-400 text-xs font-sans">Self-Reported</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{farmer.reportedHours.toFixed(1)} hrs</div>
              </div>
              <div className="p-2.5 bg-black/40 rounded-lg border border-white/[0.06]">
                <div className="text-slate-400 text-xs font-sans">Smart Grid Meter</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">{farmer.meterHours?.toFixed(1)} hrs (+30.0h)</div>
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl">
              <div className="flex items-center justify-between text-amber-300 font-semibold text-xs mb-1">
                <span>Escrow Water Held</span>
                <span className="font-mono text-sm font-bold">{farmer.escrowHours.toFixed(1)} hrs</span>
              </div>
              <div className="text-xs text-amber-200/90 leading-relaxed">
                Disputed volume between self-reported claim (20.0h) and preliminary max-min entitlement (34.1h).
              </div>
            </div>
          </div>

          {/* Current Committee Status */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Current Committee Status
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isHeld && <Clock className="w-4 h-4 text-amber-400" />}
                {isConfirmed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isDismissed && <XCircle className="w-4 h-4 text-sky-400" />}
                {isTimeout && <Clock className="w-4 h-4 text-purple-400" />}
                <span className="font-mono font-semibold text-xs text-white">
                  {farmer.escrowStatus}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {isHeld && 'Quarantine active'}
                {isConfirmed && 'Overdraft verified · Excess reallocated'}
                {isDismissed && 'Released to farmer'}
                {isTimeout && 'Released upon 14-day timeout'}
              </span>
            </div>
          </div>

          {/* Action Buttons for Committee */}
          <div className="mt-5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Select Committee Verdict
            </div>

            <button
              onClick={() => onApplyVerdict(farmer.id, 'CONFIRMED')}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isConfirmed
                  ? 'bg-rose-950/40 border-rose-600 text-rose-200'
                  : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-white">Confirm Overdraw (Reallocate Disputed Water)</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Panchayat validates smart-meter proof. Farmer allocation capped at 20.0h. Disputed 14.1h returns to zone pool.
                </div>
              </div>
            </button>

            <button
              onClick={() => onApplyVerdict(farmer.id, 'DISMISSED')}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isDismissed
                  ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                  : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] text-slate-200'
              }`}
            >
              <XCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-white">Dismiss Flag (Release Escrow to Farmer)</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Committee verifies faulty meter or neighbor pumping. All 14.1h released to Farmer C (full 34.1h allocation).
                </div>
              </div>
            </button>

            <button
              onClick={() => onApplyVerdict(farmer.id, 'HELD')}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isHeld
                  ? 'bg-amber-950/40 border-amber-600 text-amber-200'
                  : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-white">Maintain Escrow Hold (Pending Investigation)</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Water remains quarantined. Dignity floor and basic crop survival water continue uninterrupted.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <span className="text-slate-400">Panchayat Resolution 44/2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
