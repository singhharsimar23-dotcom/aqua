import React from 'react';
import { X, Activity, Waves, Gauge, ArrowRight } from 'lucide-react';
import { BorewellNode, WellDrawdownResult, wellFunctionTheis } from 'packages/core';

interface DrawdownTheisModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawdownResults: Record<string, WellDrawdownResult>;
}

export const DrawdownTheisModal: React.FC<DrawdownTheisModalProps> = ({
  isOpen,
  onClose,
  drawdownResults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Theis Groundwater Drawdown & Well Interference Solver
              </h2>
              <p className="text-xs text-neutral-400">
                Non-equilibrium aquifer physics. Calculates transient cone of depression and well-to-well head loss.
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
          {/* Formula Box */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
            <div className="text-xs font-semibold text-neutral-300 mb-2">Theis Non-Equilibrium Equation</div>
            <div className="p-3 bg-neutral-900 rounded-lg font-mono text-cyan-300 text-xs sm:text-sm text-center">
              s(r, t) = [Q / (4·π·T)] · W(u), &nbsp;&nbsp; where u = (r²·S) / (4·T·t)
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-400">
              <div>Transmissivity (T): <span className="font-mono text-neutral-200">120 m²/day</span></div>
              <div>Storativity (S): <span className="font-mono text-neutral-200">0.015</span></div>
              <div>Base Water Table: <span className="font-mono text-neutral-200">18.5 m</span></div>
              <div>Discharge Rate (Q): <span className="font-mono text-neutral-200">15.0 L/s (54 m³/h)</span></div>
            </div>
          </div>

          {/* Well Drawdown Matrix */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-3">
              Borewell Drawdown & Neighbor Interference Matrix
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(drawdownResults).map((res) => (
                <div
                  key={res.wellId}
                  className={`p-4 rounded-xl border ${
                    res.wellId === 'W-03'
                      ? 'border-red-900/60 bg-red-950/20'
                      : 'border-neutral-800 bg-neutral-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{res.wellId}</span>
                      <span className="text-xs text-neutral-400">Farmer {res.farmerId}</span>
                    </div>
                    <span className="font-mono text-xs text-cyan-400">
                      Radius: {res.radiusOfInfluenceM}m
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono text-center">
                    <div className="p-2 bg-neutral-900/80 rounded">
                      <div className="text-[10px] text-neutral-500 font-sans">Self Drawdown</div>
                      <div className="font-bold text-neutral-200 mt-0.5">{res.selfDrawdownM}m</div>
                    </div>
                    <div className="p-2 bg-neutral-900/80 rounded">
                      <div className="text-[10px] text-neutral-500 font-sans">Interference</div>
                      <div className={`font-bold mt-0.5 ${res.interferingDrawdownM > 1 ? 'text-amber-400' : 'text-neutral-200'}`}>
                        +{res.interferingDrawdownM}m
                      </div>
                    </div>
                    <div className="p-2 bg-neutral-900/80 rounded">
                      <div className="text-[10px] text-neutral-500 font-sans">Dynamic Head</div>
                      <div className="font-bold text-sky-400 mt-0.5">{res.dynamicHeadM}m</div>
                    </div>
                  </div>

                  {/* Neighbors affected */}
                  {res.affectedNeighbors.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400 space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-neutral-500">Neighbor Impact</div>
                      {res.affectedNeighbors.map((n, i) => (
                        <div key={i} className="flex justify-between font-mono">
                          <span>{n.neighborWellId} ({n.distanceM}m away):</span>
                          <span className="text-amber-300">-{n.headDropM}m head loss</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Solver
          </button>
        </div>
      </div>
    </div>
  );
};
