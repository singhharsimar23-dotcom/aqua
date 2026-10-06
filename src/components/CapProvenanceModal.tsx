import React from 'react';
import { X, Target, Play, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  computeCalibratedCap,
  STORED_STRESS_TRAJECTORIES,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
} from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface CapProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTrajectory: (trajectoryId: string) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
}

export const CapProvenanceModal: React.FC<CapProvenanceModalProps> = ({
  isOpen,
  onClose,
  onLoadTrajectory,
  onProveIt,
}) => {
  if (!isOpen) return null;

  const capData = computeCalibratedCap();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Statistically Calibrated Cap Derivation & Stress Scenarios
              </h2>
              <p className="text-xs text-neutral-400">
                Groundwater bucket model with adaptive conformal prediction and 90% confidence coverage.
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
          {/* Calibrated Cap Breakdown Steps */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-semibold text-cyan-400">
                Weekly Cap Calibration Steps (Zone-A 120 ha Bucket)
              </span>
              <ProvenanceBadge
                tag="LIVE"
                onClick={() => onProveIt(PROVENANCE_REGISTRY['zone.weeklyBudgetM3'])}
              />
            </div>

            <div className="space-y-2">
              {capData.calibrationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-neutral-900 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 border border-neutral-800/80"
                >
                  <div>
                    <div className="font-semibold text-neutral-200">{step.step}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">{step.derivation}</div>
                  </div>
                  <div className="font-mono font-bold text-cyan-300 sm:text-right shrink-0">
                    {step.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stored Stress-Test Trajectories */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-3">
              Stored Stress-Test Trajectories (Run Real-Time Drills)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STORED_STRESS_TRAJECTORIES.map((traj) => (
                <div
                  key={traj.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{traj.name}</span>
                      <span className="text-[10px] font-mono text-neutral-500">{traj.id}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                      {traj.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-500">
                      Rain: {traj.weeklyRainfallMm} mm
                    </span>
                    <button
                      onClick={() => {
                        onLoadTrajectory(traj.id);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Load Scenario</span>
                    </button>
                  </div>
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
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
