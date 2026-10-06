import React, { useState } from 'react';
import { X, Shield, Cpu, Scale, Brain, CheckCircle, Sliders } from 'lucide-react';
import {
  EPISTEMIC_ARCHITECTURE,
  FarmerRecord,
  ZoneBudgetConfig,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
} from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface HonestyPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ZoneBudgetConfig;
  onUpdateAssumptions: (newParams: Partial<ZoneBudgetConfig>) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
}

export const HonestyPanelModal: React.FC<HonestyPanelModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateAssumptions,
  onProveIt,
}) => {
  if (!isOpen) return null;

  const [dignityFloorBase, setDignityFloorBase] = useState(10.0);
  const [conformalCoverage, setConformalCoverage] = useState(0.90);
  const [transmissivity, setTransmissivity] = useState(config.aquiferTransmissivityM2Day);

  // Live provenance markers inventory on screen
  const provenanceInventory = {
    LIVE: 8, // Smart meters, Sentinel-2 NDVI, IMD Rainfall, CGWB dynamic cap
    REPLAY: 3, // Historical water level baseline, carto basemap
    SYNTH: 6, // Farmer self-reports, plot boundary polygons, standard discharge rate
    ASSUMPTION: 4, // Customary dignity floor, unmanaged counterfactual model
    USER: 1, // In-browser CSV parse hash
  };

  const handleApplyAssumptions = () => {
    onUpdateAssumptions({
      aquiferTransmissivityM2Day: transmissivity,
      conformalAlpha: 1 - conformalCoverage,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Honesty Panel & Epistemic Boundaries
              </h2>
              <p className="text-xs text-neutral-400">
                Transparent auditing of AI vs Deterministic Rules vs Statistics vs Hydrodynamics.
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
          {/* Live Provenance Counts Inventory */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Active Provenance Inventory in Current Session
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-neutral-900 border border-emerald-900/50 rounded-lg text-center">
                <div className="text-emerald-400 font-bold text-lg">{provenanceInventory.LIVE}</div>
                <div className="text-neutral-400 text-[11px] font-sans">[LIVE] Ground Truth</div>
              </div>
              <div className="p-2.5 bg-neutral-900 border border-sky-900/50 rounded-lg text-center">
                <div className="text-sky-400 font-bold text-lg">{provenanceInventory.REPLAY}</div>
                <div className="text-neutral-400 text-[11px] font-sans">[REPLAY] Baselines</div>
              </div>
              <div className="p-2.5 bg-neutral-900 border border-amber-900/50 rounded-lg text-center">
                <div className="text-amber-400 font-bold text-lg">{provenanceInventory.SYNTH}</div>
                <div className="text-neutral-400 text-[11px] font-sans">[SYNTH] Reports/Casing</div>
              </div>
              <div className="p-2.5 bg-neutral-900 border border-purple-900/50 rounded-lg text-center">
                <div className="text-purple-400 font-bold text-lg">{provenanceInventory.ASSUMPTION}</div>
                <div className="text-neutral-400 text-[11px] font-sans">[ASSUMPTION] Policy</div>
              </div>
              <div className="p-2.5 bg-neutral-900 border border-cyan-900/50 rounded-lg text-center col-span-2 sm:col-span-1">
                <div className="text-cyan-400 font-bold text-lg">{provenanceInventory.USER}</div>
                <div className="text-neutral-400 text-[11px] font-sans">[USER] Client Hash</div>
              </div>
            </div>
          </div>

          {/* Epistemic Architecture Matrix */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-3">
              Separation of Powers: What is AI vs Rules vs Statistics vs Physics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EPISTEMIC_ARCHITECTURE.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{item.title}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        item.isDeterministic
                          ? 'bg-neutral-800 text-cyan-300'
                          : 'bg-purple-950 border border-purple-800 text-purple-300'
                      }`}
                    >
                      {item.isDeterministic ? 'DETERMINISTIC' : 'PROBABILISTIC'}
                    </span>
                  </div>
                  <div className="text-neutral-300 leading-relaxed text-[11px]">
                    <strong className="text-neutral-400">Role: </strong>
                    {item.role}
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80 text-neutral-400 text-[10px] leading-relaxed">
                    <strong className="text-amber-400">Governance Limit: </strong>
                    {item.limitations}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editable Hydrological Assumptions */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Adjust Fundamental Assumptions (Sensitivity Test)</span>
              </span>
              <button
                onClick={handleApplyAssumptions}
                className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-neutral-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Apply Assumptions
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Aquifer Transmissivity (T)</span>
                  <span className="font-mono text-cyan-300">{transmissivity} m²/day</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="10"
                  value={transmissivity}
                  onChange={(e) => setTransmissivity(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Conformal Confidence (1 - α)</span>
                  <span className="font-mono text-cyan-300">{(conformalCoverage * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="0.99"
                  step="0.01"
                  value={conformalCoverage}
                  onChange={(e) => setConformalCoverage(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Dignity Floor Policy Base</span>
                  <span className="font-mono text-purple-300">{dignityFloorBase.toFixed(1)} hrs</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  step="0.5"
                  value={dignityFloorBase}
                  onChange={(e) => setDignityFloorBase(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
