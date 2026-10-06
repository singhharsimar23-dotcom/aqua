import React from 'react';
import { Play, Terminal, ShieldAlert } from 'lucide-react';

interface TopNavProps {
  activeView: 'map' | 'table' | 'ledger' | 'theis' | 'impact';
  onSelectView: (view: 'map' | 'table' | 'ledger' | 'theis' | 'impact') => void;
  onOpenCommandBar: () => void;
  onStartVerifyHero: () => void;
  hasEscrowAlert: boolean;
  onOpenEscrowDrawer: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onSelectView,
  onOpenCommandBar,
  onStartVerifyHero,
  hasEscrowAlert,
  onOpenEscrowDrawer,
}) => {
  return (
    <header className="h-14 px-6 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md flex items-center justify-between z-30 shrink-0 select-none">
      {/* Zone 1: Single text element Brand wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('map');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors"
        >
          AquaPulse
        </a>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onSelectView('map')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            activeView === 'map' ? 'text-white border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Geospatial Stage
        </button>
        <button
          onClick={() => onSelectView('table')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            activeView === 'table' ? 'text-white border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Worked Allocation
        </button>
        <button
          onClick={() => onSelectView('theis')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            activeView === 'theis' ? 'text-white border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Drawdown Physics
        </button>
        <button
          onClick={() => onSelectView('ledger')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            activeView === 'ledger' ? 'text-white border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Merkle Proofs
        </button>
        <button
          onClick={() => onSelectView('impact')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            activeView === 'impact' ? 'text-white border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Energy & CO₂
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {hasEscrowAlert && (
          <button
            onClick={onOpenEscrowDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/50 border border-amber-800/80 rounded-lg hover:bg-amber-900/60 transition-all cursor-pointer animate-pulse"
            title="Farmer C has 14.1h held in escrow pending committee review"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Escrow (14.1h)</span>
          </button>
        )}

        <button
          onClick={onStartVerifyHero}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Verify Flow</span>
        </button>

        <button
          onClick={onOpenCommandBar}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg hover:text-neutral-200 hover:border-neutral-700 transition-colors cursor-pointer"
          title="Command Palette (Cmd+K / Ctrl+K)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>⌘K</span>
        </button>
      </div>
    </header>
  );
};
