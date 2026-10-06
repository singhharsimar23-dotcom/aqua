import React from 'react';
import { X, ShieldCheck, Database, Calendar, Hash, FileCode } from 'lucide-react';
import { ProvenanceTrace } from 'packages/core';

interface ProveItModalProps {
  trace: ProvenanceTrace | null;
  onClose: () => void;
}

export const ProveItModal: React.FC<ProveItModalProps> = ({ trace, onClose }) => {
  if (!trace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#0d1017] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Data Provenance Audit
              </h3>
              <div className="text-xs text-slate-400 mt-0.5">Immutable origin and calculation trace</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5 text-xs">
          {/* Tag & Source Banner */}
          <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-xs">Provenance Classification</div>
              <div className="text-sm font-mono font-semibold text-white mt-1">
                [{trace.tag}] {trace.sourceName}
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-1 rounded bg-black/40 border border-white/[0.08] text-slate-300">
              {trace.sourceId}
            </span>
          </div>

          {/* Description */}
          <div>
            <div className="text-slate-400 text-xs font-medium mb-1.5">Description & Epistemic Scope</div>
            <div className="text-slate-200 text-xs leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.06]">
              {trace.description}
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="space-y-2.5 text-xs">
            {trace.timestamp && (
              <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Telemetry Timestamp</span>
                </span>
                <span className="font-mono text-slate-200 font-semibold">{trace.timestamp}</span>
              </div>
            )}

            {trace.sceneId && (
              <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Sentinel-2 L2A Scene ID</span>
                </div>
                <div className="font-mono text-emerald-300 text-xs break-all select-all font-medium">
                  {trace.sceneId}
                </div>
              </div>
            )}

            {trace.formula && (
              <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>Analytical Derivation Formula</span>
                </div>
                <div className="font-mono text-amber-200 text-xs break-all font-medium">{trace.formula}</div>
              </div>
            )}

            {trace.hash && (
              <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Hash className="w-4 h-4 text-purple-400" />
                  <span>SHA-256 Fingerprint</span>
                </div>
                <div className="font-mono text-purple-300 text-xs break-all select-all font-medium">
                  {trace.hash}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium text-xs rounded-xl border border-white/[0.1] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
