import React from 'react';
import { X, Sliders, RotateCcw, AlertTriangle, Play } from 'lucide-react';
import { FarmerRecord } from 'packages/core';

interface SandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmers: FarmerRecord[];
  onUpdateFarmerData: (farmerId: string, reportedHours: number, meterHours: number | null) => void;
  onResetBenchmark: () => void;
}

export const SandboxModal: React.FC<SandboxModalProps> = ({
  isOpen,
  onClose,
  farmers,
  onUpdateFarmerData,
  onResetBenchmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Hydrological Sandbox & Stress Tuning
              </h2>
              <p className="text-xs text-neutral-400">
                Adjust individual reported and meter pump-hours. Test the "missing is never zero" rule.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetBenchmark}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Benchmark</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {farmers.map((f) => {
            const isMissing = f.isMeterMissing || f.meterHours === null;

            return (
              <div
                key={f.id}
                className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center font-bold text-xs text-white">
                      {f.id}
                    </span>
                    <span className="text-xs font-semibold text-neutral-200">
                      {f.name} ({f.crop} · {f.areaHa} ha)
                    </span>
                  </div>

                  {/* Missing Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                    <span className="text-neutral-400">Meter Offline?</span>
                    <input
                      type="checkbox"
                      checked={isMissing}
                      onChange={(e) => {
                        onUpdateFarmerData(f.id, f.reportedHours, e.target.checked ? null : 30);
                      }}
                      className="accent-amber-400 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isMissing ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-neutral-900 text-neutral-500'}`}>
                      {isMissing ? 'MISSING' : 'ONLINE'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Reported Hours Slider */}
                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Self-Reported Hours</span>
                      <span className="font-mono text-cyan-300 font-semibold">{f.reportedHours} hrs</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={f.reportedHours}
                      onChange={(e) => {
                        onUpdateFarmerData(f.id, Number(e.target.value), f.meterHours);
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Meter Hours Slider */}
                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Smart Meter Hours</span>
                      <span className="font-mono text-red-400 font-semibold">
                        {isMissing ? 'OFFLINE (Missing)' : `${f.meterHours} hrs`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      disabled={isMissing}
                      value={f.meterHours || 20}
                      onChange={(e) => {
                        onUpdateFarmerData(f.id, f.reportedHours, Number(e.target.value));
                      }}
                      className={`w-full accent-red-400 cursor-pointer ${isMissing ? 'opacity-30 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
