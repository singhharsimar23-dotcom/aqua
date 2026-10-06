import React from 'react';
import { X, Network, User, Zap, Waves, ShieldAlert, GitCommit, ArrowRight } from 'lucide-react';
import { FarmerRecord, WellDrawdownResult } from 'packages/core';

interface ObjectGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  farmers: FarmerRecord[];
  drawdownResults: Record<string, WellDrawdownResult>;
}

export const ObjectGraphModal: React.FC<ObjectGraphModalProps> = ({
  isOpen,
  onClose,
  selectedObjectId,
  onSelectObject,
  farmers,
  drawdownResults,
}) => {
  if (!isOpen) return null;

  const currentFarmer = farmers.find((f) => f.id === selectedObjectId || f.wellId === selectedObjectId) || farmers[2]; // default to Farmer C
  const well = drawdownResults[currentFarmer.wellId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Object-Centric Entity Graph: Farmer → Well → Feeder → Escrow
              </h2>
              <p className="text-xs text-neutral-400">
                Selecting an entity links its hydrodynamics, electrical grid feeder, and cryptographic ledger proofs.
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

        {/* Farmer Selector Strip */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 p-2 gap-2 text-xs">
          {farmers.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectObject(f.id)}
              className={`flex-1 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                currentFarmer.id === f.id
                  ? 'border-cyan-400 bg-neutral-800 text-white font-semibold'
                  : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <div>Farmer {f.id}: {f.name.split(' ')[0]}</div>
              <div className="text-[10px] opacity-70 font-mono">{f.wellId} · {f.crop}</div>
            </button>
          ))}
        </div>

        {/* Entity Graph Visualizer */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Node 1: Farmer Profile */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <User className="w-4 h-4" />
                <span>1. Farmer Entity</span>
              </div>
              <div className="font-bold text-white text-sm">{currentFarmer.name}</div>
              <div className="text-neutral-400 text-[11px] space-y-0.5">
                <div>Plot Area: <span className="font-mono text-neutral-200">{currentFarmer.areaHa} ha</span></div>
                <div>Crop: <span className="text-neutral-200">{currentFarmer.crop}</span></div>
                <div>Reported: <span className="font-mono text-neutral-200">{currentFarmer.reportedHours} hrs</span></div>
              </div>
            </div>

            {/* Node 2: Borewell & Physics */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Waves className="w-4 h-4" />
                <span>2. Borewell Entity</span>
              </div>
              <div className="font-bold text-white text-sm font-mono">{currentFarmer.wellId}</div>
              <div className="text-neutral-400 text-[11px] space-y-0.5">
                <div>Discharge: <span className="font-mono text-neutral-200">15.0 L/s</span></div>
                <div>Radius Infl.: <span className="font-mono text-neutral-200">{well?.radiusOfInfluenceM || 180} m</span></div>
                <div>Dynamic Head: <span className="font-mono text-neutral-200">{well?.dynamicHeadM || 22.1} m</span></div>
              </div>
            </div>

            {/* Node 3: Agricultural Feeder Grid */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Zap className="w-4 h-4" />
                <span>3. Feeder Grid</span>
              </div>
              <div className="font-bold text-white text-sm font-mono">{currentFarmer.feederId}</div>
              <div className="text-neutral-400 text-[11px] space-y-0.5">
                <div>Grid Voltage: <span className="font-mono text-neutral-200">11 kV</span></div>
                <div>Meter Read: <span className="font-mono text-red-400 font-bold">{currentFarmer.meterHours} hrs</span></div>
                <div>Window: <span className="text-neutral-200">22:00 - 04:00</span></div>
              </div>
            </div>

            {/* Node 4: Escrow & Ledger Leaf */}
            <div className={`p-3.5 bg-neutral-950 border rounded-xl space-y-2 ${currentFarmer.escrowHours > 0 ? 'border-amber-700/80 bg-amber-950/10' : 'border-neutral-800'}`}>
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>4. Escrow & Ledger</span>
              </div>
              <div className="font-bold text-sm font-mono text-white">
                {currentFarmer.escrowHours > 0 ? `${currentFarmer.escrowHours}h ESCROW` : '0h Escrow'}
              </div>
              <div className="text-neutral-400 text-[11px] space-y-0.5">
                <div>Status: <span className="font-mono text-amber-300 font-bold">{currentFarmer.escrowStatus}</span></div>
                <div className="truncate">Leaf: <span className="font-mono text-neutral-300">{currentFarmer.leafHash.slice(0, 10)}...</span></div>
              </div>
            </div>
          </div>

          {/* Neighbor Well Interference Links */}
          {well && well.affectedNeighbors.length > 0 && (
            <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-neutral-300">
                Hydrodynamic Well Interference Links from {well.wellId}:
              </div>
              <div className="space-y-1.5">
                {well.affectedNeighbors.map((n, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectObject(n.neighborFarmerId)}
                    className="p-2 bg-neutral-900 rounded-lg flex items-center justify-between cursor-pointer hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{well.wellId}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="font-mono font-bold text-cyan-400">{n.neighborWellId} (Farmer {n.neighborFarmerId})</span>
                    </div>
                    <div className="font-mono text-amber-300">
                      -{n.headDropM}m head loss @ {n.distanceM}m distance
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Graph
          </button>
        </div>
      </div>
    </div>
  );
};
