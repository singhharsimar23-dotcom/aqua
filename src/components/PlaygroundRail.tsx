import React from 'react';
import {
  Sparkles,
  Layers,
  Activity,
  Waves,
  Network,
  Zap,
  FileSpreadsheet,
  GitCommit,
  Smartphone,
  Sliders,
  Scale,
  Sun,
  Moon,
  RotateCcw,
  Terminal,
} from 'lucide-react';

export type PlaygroundTool =
  | 'verify'
  | 'layers'
  | 'signals'
  | 'theis'
  | 'graph'
  | 'impact'
  | 'table'
  | 'ledger'
  | 'sms'
  | 'sandbox'
  | 'waterfall';

interface PlaygroundRailProps {
  activeTool: PlaygroundTool;
  onSelectTool: (tool: PlaygroundTool) => void;
  onOpenCommandBar: () => void;
  onResetBenchmark: () => void;
  hasEscrow: boolean;
  isLightMode: boolean;
  onToggleLightMode: () => void;
}

export const PlaygroundRail: React.FC<PlaygroundRailProps> = ({
  activeTool,
  onSelectTool,
  onOpenCommandBar,
  onResetBenchmark,
  hasEscrow,
  isLightMode,
  onToggleLightMode,
}) => {
  // 11 distinct tools mapped per spec & UI_WIRING.md
  const tools: { id: PlaygroundTool; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'verify', label: 'Verification Sequence & Live Hero', icon: Sparkles },
    { id: 'layers', label: 'GIS Layers & Basemaps', icon: Layers },
    { id: 'signals', label: 'Signal Board (W2)', icon: Activity },
    { id: 'theis', label: 'Aquifer Drawdown & Theis Cones', icon: Waves },
    { id: 'graph', label: 'Hydrological Object Graph (W6)', icon: Network },
    { id: 'impact', label: 'Feeder Impact & Carbon Meter (W7-W8)', icon: Zap },
    { id: 'table', label: 'Worked Allocation Table (W1)', icon: FileSpreadsheet },
    { id: 'ledger', label: 'Receipts & Cryptographic Ledger (W9)', icon: GitCommit },
    { id: 'sms', label: 'SMS & IVR Dispatch (W13 - MOCK)', icon: Smartphone },
    { id: 'sandbox', label: 'Telemetry Simulator & Stress Runs', icon: Sliders },
    { id: 'waterfall', label: 'Fairness Waterfall (W5) & Zone Stress (W3)', icon: Scale },
  ];

  return (
    <aside
      className={`w-14 border-r flex flex-col items-center justify-between py-3 z-30 select-none shrink-0 transition-colors ${
        isLightMode
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-[#080a0f] border-white/[0.08] text-slate-300'
      }`}
    >
      {/* Top: AquaPulse Geometric Mark */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={() => onSelectTool('verify')}
          title="AquaPulse Civic Water Allocation"
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md hover:scale-105 transition-all cursor-pointer"
        >
          {/* Custom Precision Geometric Mark: Water Droplet intersecting concentric Pulse Isobars */}
          <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="3 3" />
            <path
              d="M16 4.5 C16 4.5 7.5 15.5 7.5 20.5 C7.5 25.19 11.31 29 16 29 C20.69 29 24.5 25.19 24.5 20.5 C24.5 15.5 16 4.5 16 4.5 Z"
              fill="rgba(255, 255, 255, 0.22)"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M11 20.5 C13 18.5 14.5 18.5 16 20.5 C17.5 22.5 19 22.5 21 20.5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Separator */}
        <div className={`w-6 h-px ${isLightMode ? 'bg-slate-200' : 'bg-white/[0.08]'}`} />

        {/* Tool Navigation Icons */}
        <div className="flex flex-col gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;

            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                title={t.label}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? isLightMode
                      ? 'bg-sky-100/90 text-sky-700 font-semibold shadow-xs'
                      : 'bg-white/[0.12] text-sky-400 font-semibold shadow-xs'
                    : isLightMode
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[1.8]" />
                {isActive && (
                  <span className="absolute -left-1.5 w-1 h-4 rounded-r-md bg-sky-500" />
                )}
                {t.id === 'verify' && hasEscrow && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#080a0f]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Tools & Theme Switcher */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Reset to Canonical Baseline */}
        <button
          onClick={onResetBenchmark}
          title="Restore Exact Canonical Baseline (§6.11)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isLightMode
              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleLightMode}
          title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isLightMode
              ? 'bg-amber-100/80 text-amber-700 hover:bg-amber-200'
              : 'text-slate-400 hover:text-sky-300 hover:bg-white/[0.06]'
          }`}
        >
          {isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Command Menu Shortcut Button */}
        <button
          onClick={onOpenCommandBar}
          title="Command Palette (Cmd/Ctrl + K)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isLightMode
              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
          }`}
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
