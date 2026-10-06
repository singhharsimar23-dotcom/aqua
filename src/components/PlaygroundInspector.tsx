import React from 'react';
import {
  X,
  Lock,
  Smartphone,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  FarmerRecord,
  WellDrawdownResult,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
} from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface PlaygroundInspectorProps {
  farmer: FarmerRecord | null;
  onClose: () => void;
  drawdown: WellDrawdownResult | undefined;
  onProveIt: (trace: ProvenanceTrace) => void;
  onOpenEscrow: () => void;
  onOpenSms: () => void;
  onSelectNeighbor: (farmerId: string) => void;
  isLightMode: boolean;
}

export const PlaygroundInspector: React.FC<PlaygroundInspectorProps> = ({
  farmer,
  onClose,
  drawdown,
  onProveIt,
  onOpenEscrow,
  onOpenSms,
  onSelectNeighbor,
  isLightMode,
}) => {
  if (!farmer) return null;

  const isFlagged = farmer.isFlagged;
  const hasEscrow = farmer.escrowHours > 0;

  return (
    <div
      className={`absolute top-4 right-16 z-20 w-80 rounded-2xl shadow-2xl p-4 text-xs font-sans flex flex-col gap-3 select-none pointer-events-auto border transition-all animate-in slide-in-from-right-3 duration-200 ${
        isLightMode
          ? 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-900 shadow-slate-300/40'
          : 'bg-[#0d1017]/95 backdrop-blur-xl border-white/[0.1] text-slate-100 shadow-black/60'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold font-mono text-xs ${
              isLightMode
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'bg-white/[0.08] border-white/[0.12] text-sky-400'
            }`}
          >
            {farmer.id}
          </div>
          <div>
            <h4 className="font-semibold text-sm leading-tight">{farmer.name}</h4>
            <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {farmer.crop} · {farmer.areaHa} ha · {farmer.wellId}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLightMode ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Multi-Signal Card */}
      <div
        className={`p-3 rounded-xl border space-y-2 ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs uppercase tracking-wider font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Extraction Telemetry
          </span>
          <ProvenanceBadge
            tag={isFlagged ? 'LIVE' : 'SYNTH'}
            onClick={() => onProveIt(PROVENANCE_REGISTRY[isFlagged ? 'meter.hours' : 'farmer.reportedHours'])}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-white border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
            <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Self-Reported</div>
            <div className="font-bold text-sm mt-0.5">{farmer.reportedHours.toFixed(1)} hrs</div>
          </div>
          <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-white border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
            <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>MSEDCL Grid Meter</div>
            <div className={`font-bold text-sm mt-0.5 ${isFlagged ? (isLightMode ? 'text-rose-600' : 'text-rose-400') : ''}`}>
              {farmer.meterHours !== null ? `${farmer.meterHours.toFixed(1)} hrs` : 'MISSING'}
            </div>
          </div>
        </div>

        {isFlagged && (
          <div
            className={`p-2.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
              isLightMode
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <strong>+30.0h Discrepancy:</strong> Corroborated by high Sentinel-2 NDVI ({farmer.satelliteNdvi.toFixed(3)}). 14.1h held in escrow.
            </div>
          </div>
        )}
      </div>

      {/* Allocation & Escrow Summary */}
      <div
        className={`p-3 rounded-xl border space-y-1.5 font-mono text-xs ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className={`font-sans ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Dignity Floor:</span>
          <span className={`font-semibold text-sm ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'}`}>
            {farmer.dignityFloorHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`font-sans ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Guaranteed Allocated:</span>
          <span className={`font-bold text-sm ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {farmer.allocatedHours.toFixed(1)} hrs
          </span>
        </div>
        {hasEscrow && (
          <div
            className={`flex justify-between items-center pt-1.5 border-t font-bold text-sm ${
              isLightMode ? 'border-slate-200 text-amber-800' : 'border-white/[0.08] text-amber-400'
            }`}
          >
            <span className="font-sans flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Held in Escrow:</span>
            </span>
            <span>{farmer.escrowHours.toFixed(1)} hrs</span>
          </div>
        )}
      </div>

      {/* Aquifer Drawdown */}
      {drawdown && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-mono space-y-1 ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
          }`}
        >
          <div className="flex justify-between">
            <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Dynamic Head:</span>
            <span className="font-semibold">{drawdown.dynamicHeadM} m</span>
          </div>
          <div className="flex justify-between">
            <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Radius of Influence:</span>
            <span className="font-semibold">{drawdown.radiusOfInfluenceM} m</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex items-center gap-2 pt-1 border-t ${isLightMode ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        {hasEscrow && (
          <button
            onClick={onOpenEscrow}
            className={`flex-1 py-2 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isLightMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Escrow Review</span>
          </button>
        )}

        <button
          onClick={onOpenSms}
          className={`py-2 px-3 rounded-xl border transition-colors flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer ${
            isLightMode
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-slate-200'
          }`}
          title="Send SMS"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>SMS</span>
        </button>
      </div>
    </div>
  );
};
