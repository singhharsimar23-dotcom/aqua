import React from 'react';
import { ProvenanceTag } from 'packages/core';

interface ProvenanceBadgeProps {
  tag: ProvenanceTag;
  sourceKey?: string;
  onClick?: () => void;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  tag,
  onClick,
  className = '',
}) => {
  const getTagColor = (t: ProvenanceTag) => {
    switch (t) {
      case 'LIVE':
        return 'text-emerald-400';
      case 'REPLAY':
        return 'text-sky-400';
      case 'SYNTH':
        return 'text-amber-400';
      case 'ASSUMPTION':
        return 'text-purple-400';
      case 'USER':
        return 'text-cyan-400';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={`Provenance: ${tag} — Click to inspect epistemic trace`}
      className={`inline-flex items-center gap-1 font-mono text-[10px] font-medium tracking-tight cursor-pointer hover:underline transition-all ${className}`}
    >
      <span className={getTagColor(tag)}>[{tag}]</span>
      <span className="text-[9px] text-neutral-400 hover:text-neutral-200">prove</span>
    </button>
  );
};
