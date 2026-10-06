import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Play, ShieldAlert, GitCommit, Waves, Zap, Bot, Smartphone, Upload } from 'lucide-react';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'verify_flow',
      label: 'Execute Hero Verify Walkthrough',
      category: 'Narrative',
      icon: Play,
    },
    {
      id: 'select_farmer_c',
      label: 'Inspect Farmer Chandrakant Gaikwad (Plot C - 50h Discrepancy)',
      category: 'Entity',
      icon: MapPin,
    },
    {
      id: 'open_escrow',
      label: 'Open Human Committee Escrow Drawer (14.1h Disputed)',
      category: 'Governance',
      icon: ShieldAlert,
    },
    {
      id: 'open_merkle',
      label: 'Inspect Merkle Receipt Tree & Simulate Tamper',
      category: 'Cryptography',
      icon: GitCommit,
    },
    {
      id: 'open_theis',
      label: 'View Theis Drawdown & Well Interference Matrix',
      category: 'Physics',
      icon: Waves,
    },
    {
      id: 'open_impact',
      label: 'Inspect Carbon & Energy Impact Meter (Avoided CO₂)',
      category: 'Sustainability',
      icon: Zap,
    },
    {
      id: 'open_copilot',
      label: 'Open Grounded Explainer Copilot (English & हिन्दी)',
      category: 'Assistance',
      icon: Bot,
    },
    {
      id: 'open_sms',
      label: 'View GSM Feature Phone SMS / IVR Notification Mock',
      category: 'Accessibility',
      icon: Smartphone,
    },
    {
      id: 'open_table',
      label: 'Open Worked Allocation Table (Client Zero-Diff & CSV Export)',
      category: 'Allocation',
      icon: Play,
    },
    {
      id: 'open_honesty',
      label: 'Open Epistemic Honesty Panel (AI vs Rules vs Statistics)',
      category: 'Audit',
      icon: ShieldAlert,
    },
    {
      id: 'open_cap',
      label: 'Open Conformal Cap Provenance & Stored Trajectories',
      category: 'Hydrology',
      icon: Waves,
    },
    {
      id: 'open_object_graph',
      label: 'Open Object Graph (Farmers, Wells, Feeders, Drawdown)',
      category: 'Network',
      icon: MapPin,
    },
    {
      id: 'open_sandbox',
      label: 'Open Telemetry Simulator & Stress Test Drills',
      category: 'Simulation',
      icon: Zap,
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Search Input */}
        <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-neutral-400 ml-2" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, entity, or drill (e.g. 'Farmer C', 'Merkle', 'Escrow')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-neutral-100 placeholder-neutral-500 py-1"
          />
          <kbd className="hidden sm:inline px-2 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-800 rounded border border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    onSelectAction(action.id);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-neutral-800/80 flex items-center justify-between text-left text-xs transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-100 group-hover:text-white">
                        {action.label}
                      </div>
                      <div className="text-[10px] text-neutral-500">{action.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300">
                    Jump →
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
