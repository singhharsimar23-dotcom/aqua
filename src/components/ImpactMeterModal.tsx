import React from 'react';
import { X, Zap, Leaf, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  ImpactMetrics,
  CO2_GRID_FACTOR_KG_PER_KWH,
  PUMP_EFFICIENCY,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
} from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface ImpactMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  impact: ImpactMetrics;
  onProveIt: (trace: ProvenanceTrace) => void;
}

export const ImpactMeterModal: React.FC<ImpactMeterModalProps> = ({
  isOpen,
  onClose,
  impact,
  onProveIt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Impact Meter: Energy (kWh) & CO₂ per m³ Extracted
              </h2>
              <p className="text-xs text-neutral-400">
                Managed AquaPulse allocation compared to synthetic unmanaged counterfactual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Energy & Carbon Headline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-xs text-neutral-400">Managed Energy</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {impact.totalEnergyKwh.toLocaleString()} kWh
              </div>
              <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                {impact.energyPerM3} kWh / m³
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-xs text-neutral-400">Carbon Footprint</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {impact.totalCo2Kg.toLocaleString()} kg
              </div>
              <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                {impact.co2PerM3} kg CO₂ / m³
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border border-emerald-900/50 rounded-xl">
              <div className="text-xs text-emerald-400">Avoided Electricity</div>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                +{impact.energySavedKwh.toLocaleString()} kWh
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Saved vs Unmanaged
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border border-emerald-900/50 rounded-xl">
              <div className="text-xs text-emerald-400">Avoided Carbon</div>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                +{impact.co2AvoidedKg.toLocaleString()} kg
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                CO₂ Emissions Averted
              </div>
            </div>
          </div>

          {/* Managed vs Unmanaged Counterfactual Comparison */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-semibold text-white">
                Controlled Pumping vs Unmanaged Counterfactual Baseline
              </span>
              <ProvenanceBadge
                tag="ASSUMPTION"
                onClick={() => onProveIt(PROVENANCE_REGISTRY['impact.counterfactual'])}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800">
                <div className="font-semibold text-emerald-300 mb-1">
                  1. Managed AquaPulse Regime
                </div>
                <ul className="space-y-1 text-neutral-400 text-[11px] list-disc list-inside">
                  <li>Total Drawdown Head Loss: <span className="font-mono text-neutral-200">1.8 m</span></li>
                  <li>Energy Draw: <span className="font-mono text-neutral-200">{impact.totalEnergyKwh} kWh</span></li>
                  <li>Grid Carbon: <span className="font-mono text-neutral-200">{impact.totalCo2Kg} kg CO₂</span></li>
                  <li>Dignity floors preserved, disputed volume placed in escrow.</li>
                </ul>
              </div>

              <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800">
                <div className="font-semibold text-amber-300 mb-1 flex items-center justify-between">
                  <span>2. Unmanaged Baseline [SYNTHETIC COUNTERFACTUAL]</span>
                  <span className="text-[10px] font-mono text-neutral-500">Modelled</span>
                </div>
                <ul className="space-y-1 text-neutral-400 text-[11px] list-disc list-inside">
                  <li>Well Interference Head Loss: <span className="font-mono text-neutral-200">+4.2 m</span></li>
                  <li>Over-Extraction Volume: <span className="font-mono text-neutral-200">+28%</span></li>
                  <li>Total Energy Draw: <span className="font-mono text-neutral-200">{impact.counterfactualUnmanagedEnergyKwh} kWh</span></li>
                  <li>Total Carbon: <span className="font-mono text-neutral-200">{impact.counterfactualUnmanagedCo2Kg} kg CO₂</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feeder-Hours Recommendation */}
          <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Clock className="w-4 h-4" />
              <span>MSEDCL Agricultural Feeder Window Recommendation</span>
            </div>
            <p className="text-amber-200/80 leading-relaxed text-[11px]">
              Recommended 3-phase agricultural power window: <strong className="text-white">22:00 to 04:00 (Night Off-Peak)</strong>.
              Night pumping reduces evaporative spray losses by 18%, drops cone interference by staggering feeder load, and draws cooler water with higher pump efficiency.
            </p>
            <div className="text-[10px] font-mono text-amber-400/90 pt-1 border-t border-amber-900/30">
              * Governance invariant: This is strictly an advisory recommendation, NEVER an automated cutoff or enforcement.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Impact
          </button>
        </div>
      </div>
    </div>
  );
};
