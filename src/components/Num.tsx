import React, { useState } from 'react';
import { ProvenanceTag, ProvenanceTrace } from 'packages/core';

export interface NumProps {
  value: number | string;
  format?: '1' | '2' | '3' | '0' | 'int' | 'raw' | ((v: number) => string);
  unit?: string;
  tag?: ProvenanceTag;
  sourceId?: string;
  sourceName?: string;
  asOf?: string;
  hash?: string;
  description?: string;
  formula?: string;
  onProve?: (trace: ProvenanceTrace) => void;
  className?: string;
  numClassName?: string;
  showDot?: boolean;
}

export const Num: React.FC<NumProps> = ({
  value,
  format = '1',
  unit = '',
  tag = 'SYNTH',
  sourceId,
  sourceName,
  asOf = '2026-10-05T06:00:00Z',
  hash,
  description,
  formula,
  onProve,
  className = '',
  numClassName = '',
  showDot = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Format display value
  let formattedValue: string;
  if (typeof value === 'number') {
    if (typeof format === 'function') {
      formattedValue = format(value);
    } else if (format === '0' || format === 'int') {
      formattedValue = Math.round(value).toLocaleString();
    } else if (format === '2') {
      formattedValue = value.toFixed(2);
    } else if (format === '3') {
      formattedValue = value.toFixed(3);
    } else if (format === 'raw') {
      formattedValue = String(value);
    } else {
      formattedValue = value.toFixed(1);
    }
  } else {
    formattedValue = String(value);
  }

  const getTagColor = (t: ProvenanceTag) => {
    switch (t) {
      case 'LIVE':
        return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
      case 'REPLAY':
        return 'bg-sky-500 text-sky-400 border-sky-500/30';
      case 'SYNTH':
        return 'bg-amber-500 text-amber-400 border-amber-500/30';
      case 'ASSUMPTION':
        return 'bg-purple-500 text-purple-400 border-purple-500/30';
      case 'USER':
        return 'bg-cyan-500 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-neutral-500 text-neutral-400 border-neutral-500/30';
    }
  };

  const getDotColor = (t: ProvenanceTag) => {
    switch (t) {
      case 'LIVE':
        return 'bg-emerald-400';
      case 'REPLAY':
        return 'bg-sky-400';
      case 'SYNTH':
        return 'bg-amber-400';
      case 'ASSUMPTION':
        return 'bg-purple-400';
      case 'USER':
        return 'bg-cyan-400';
      default:
        return 'bg-slate-400';
    }
  };

  const handleProveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProve) {
      onProve({
        tag,
        sourceId: sourceId || `SRC_${tag}`,
        sourceName: sourceName || `${tag} Ground Truth / Core Calculation`,
        timestamp: asOf,
        hash: hash || 'a4f89d91e039bf1e82845c1d683a',
        description: description || `Derived via packages/core mathematical pipeline.`,
        formula,
      });
    }
  };

  return (
    <span
      className={`relative inline-flex items-center gap-1 group font-mono select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={numClassName}>{formattedValue}</span>
      {unit && <span className="opacity-80 font-sans text-[0.88em]">{unit}</span>}

      {showDot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${getDotColor(tag)} opacity-75 group-hover:opacity-100 transition-opacity cursor-pointer`}
          title={`[${tag}] Click or hover to inspect provenance`}
          onClick={handleProveClick}
        />
      )}

      {/* Provenance Hover Card */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-64 p-2.5 rounded-xl bg-slate-900/95 dark:bg-[#0c0f17]/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-left font-sans text-xs text-slate-200 pointer-events-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${getTagColor(tag)}`}>
              [{tag}]
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {asOf ? asOf.slice(0, 10) : '2026-10-05'}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="font-semibold text-slate-100 truncate">
              {sourceName || 'AquaPulse Hydrology Core'}
            </div>
            {sourceId && (
              <div className="text-[10px] font-mono text-slate-400 truncate">
                ID: {sourceId}
              </div>
            )}
            {formula && (
              <div className="text-[10px] font-mono text-sky-400 bg-sky-950/40 p-1 rounded border border-sky-900/50">
                {formula}
              </div>
            )}
            {hash && (
              <div className="text-[10px] font-mono text-slate-500 truncate">
                hash: {hash.slice(0, 16)}...
              </div>
            )}
          </div>

          {onProve && (
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleProveClick}
                className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                Prove it &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
