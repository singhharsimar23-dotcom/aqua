import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  Activity,
  Waves,
  GitCommit,
  Zap,
  FileText,
  Smartphone,
  Sliders,
  Scale,
  Lock,
  Download,
  AlertTriangle,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import {
  FarmerRecord,
  ZoneBudgetConfig,
  ZoneSummary,
  ImpactMetrics,
  WellDrawdownResult,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
  exportAllocationToCsv,
} from 'packages/core';
import { PlaygroundTool } from './PlaygroundRail.tsx';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface PlaygroundWidgetPanelProps {
  activeTool: PlaygroundTool;
  farmers: FarmerRecord[];
  config: ZoneBudgetConfig;
  summary: ZoneSummary;
  impact: ImpactMetrics;
  drawdownResults: Record<string, WellDrawdownResult>;
  verifyStep: number;
  onSetVerifyStep: (step: number) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
  onOpenEscrowDrawer: () => void;
  onOpenMerkleModal: () => void;
  onOpenTheisModal: () => void;
  onUpdateFarmerData: (farmerId: string, reportedHours: number, meterHours: number | null) => void;
  isLightMode: boolean;
}

export const PlaygroundWidgetPanel: React.FC<PlaygroundWidgetPanelProps> = ({
  activeTool,
  farmers,
  config,
  summary,
  impact,
  drawdownResults,
  verifyStep,
  onSetVerifyStep,
  selectedObjectId,
  onSelectObject,
  onProveIt,
  onOpenEscrowDrawer,
  onOpenMerkleModal,
  onOpenTheisModal,
  onUpdateFarmerData,
  isLightMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSignalFilter, setActiveSignalFilter] = useState<'all' | 'meter' | 'ndvi' | 'drawdown'>('all');
  const [copilotLang, setCopilotLang] = useState<'en' | 'hi'>('en');
  const [isTamperingMerkle, setIsTamperingMerkle] = useState(false);
  const [isPlayingSmsVoice, setIsPlayingSmsVoice] = useState(false);

  const farmerC = farmers.find((f) => f.id === 'C') || farmers[2];

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.wellId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadCsv = () => {
    const csvContent = exportAllocationToCsv(farmers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AquaPulse_Worked_Allocation_${config.zoneId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleVoice = () => {
    setIsPlayingSmsVoice(!isPlayingSmsVoice);
    if (!isPlayingSmsVoice && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(
        `AquaPulse Wardha Panchayat. Farmer Chandrakant Gaikwad. Your weekly guaranteed allocation is 20 hours. 14.1 hours is safely held in escrow pending committee review.`
      );
      msg.rate = 0.9;
      msg.onend = () => setIsPlayingSmsVoice(false);
      window.speechSynthesis.speak(msg);
    } else if (isPlayingSmsVoice && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSmsVoice(false);
    }
  };

  return (
    <div
      className={`w-[380px] lg:w-[410px] h-full border-r flex flex-col justify-between z-20 shadow-xl overflow-hidden select-none shrink-0 font-sans transition-colors ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0d1017]/95 backdrop-blur-xl border-white/[0.08] text-slate-100'
      }`}
    >
      {/* Search & Signal Filter */}
      <div className={`p-4 border-b flex flex-col gap-3 ${isLightMode ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.08]'}`}>
        <div className="relative flex items-center">
          <Search className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isLightMode ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search farmer, parcel, or well..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg pl-10 pr-9 py-2 text-sm transition-all focus:outline-none focus:ring-1 ${
              isLightMode
                ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                : 'bg-white/[0.05] border border-white/[0.1] text-slate-100 placeholder-slate-400 focus:border-sky-400 focus:ring-sky-400/20'
            }`}
          />
          <kbd
            className={`absolute right-3 text-xs font-mono px-1.5 py-0.5 rounded border ${
              isLightMode ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-neutral-900 border-neutral-700 text-neutral-400'
            }`}
          >
            /
          </kbd>
        </div>

        {/* Minimalist Segmented Filter */}
        <div
          className={`grid grid-cols-4 p-1 rounded-lg border text-xs font-medium ${
            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-black/30 border-white/[0.06]'
          }`}
        >
          {(['all', 'meter', 'ndvi', 'drawdown'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveSignalFilter(mode)}
              className={`py-1.5 rounded capitalize transition-all cursor-pointer text-center ${
                activeSignalFilter === mode
                  ? isLightMode
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'bg-white/[0.14] text-white shadow-xs font-semibold'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'drawdown' ? 'Drawdown' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tool: Hero Verification Sequence */}
        {activeTool === 'verify' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Verification Sequence
                </h3>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Multi-signal cross-check of self-reported pump hours
                </div>
              </div>
              <ProvenanceBadge
                tag="LIVE"
                onClick={() => onProveIt(PROVENANCE_REGISTRY['zone.weeklyBudgetM3'])}
              />
            </div>

            {/* 4 Step Selector Cards */}
            <div className="space-y-2">
              {[
                {
                  step: 1,
                  title: '1. Self-Reports',
                  ratio: '89.2% Semi-critical',
                  ratioColor: isLightMode ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-amber-300 bg-amber-950/40 border-amber-800/40',
                  desc: 'Farmers self-report 95.0h total. Zone extraction initially appears within safe cap.',
                },
                {
                  step: 2,
                  title: '2. Multi-Signal Ingestion',
                  ratio: 'Grid & Satellite Active',
                  ratioColor: isLightMode ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-300 bg-emerald-950/40 border-emerald-800/40',
                  desc: 'MSEDCL smart-meter electrical runtimes and Sentinel-2 NDVI canopy data ingested.',
                },
                {
                  step: 3,
                  title: '3. Verification Flip',
                  ratio: '103.0% Over-exploited',
                  ratioColor: isLightMode ? 'text-rose-700 bg-rose-50 border-rose-200 font-bold' : 'text-rose-300 bg-rose-950/50 border-rose-800 font-bold',
                  desc: 'Smart meter shows Farmer C pumped 50h (+30h delta). Zone flips to Over-exploited!',
                },
                {
                  step: 4,
                  title: '4. Escrow & Allocation',
                  ratio: '14.1h Escrow Secured',
                  ratioColor: isLightMode ? 'text-amber-800 bg-amber-50 border-amber-200 font-bold' : 'text-amber-300 bg-amber-950/50 border-amber-800 font-bold',
                  desc: 'Dignity floor preserved. Disputed water held in escrow. Cryptographic receipt signed.',
                },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => onSetVerifyStep(s.step)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    verifyStep === s.step
                      ? isLightMode
                        ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/20'
                        : 'bg-white/[0.08] border-sky-400 ring-2 ring-sky-400/20'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold text-sm ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                      {s.title}
                    </span>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${s.ratioColor}`}>
                      {s.ratio}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mt-1.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Farmer C Discrepancy Card */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                verifyStep >= 3
                  ? isLightMode
                    ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                    : 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                  : isLightMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-current/10">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${verifyStep >= 3 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>Plot C Discrepancy Analysis</span>
                </div>
                <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Farmer Chandrakant
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className={`p-2.5 rounded-lg border ${isLightMode ? 'bg-white border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
                  <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Self-Reported</div>
                  <div className={`text-sm font-bold mt-0.5 ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                    {farmerC.reportedHours.toFixed(1)} hrs
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLightMode ? 'bg-white border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
                  <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>MSEDCL Grid Meter</div>
                  <div className={`text-sm font-bold mt-0.5 ${verifyStep >= 3 ? (isLightMode ? 'text-rose-600' : 'text-rose-400') : (isLightMode ? 'text-slate-900' : 'text-slate-100')}`}>
                    {farmerC.meterHours?.toFixed(1)} hrs <span className="text-xs font-normal">(+30.0h)</span>
                  </div>
                </div>
              </div>

              {verifyStep >= 3 && (
                <div className="mt-2.5 pt-2 border-t border-current/10 flex items-center justify-between text-xs">
                  <span className={`font-sans ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    Held in Escrow (No Auto-Cut):
                  </span>
                  <span className={`font-mono font-bold text-sm ${isLightMode ? 'text-amber-800' : 'text-amber-300'}`}>
                    {farmerC.escrowHours.toFixed(1)} hrs
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tool: Allocation Waterfall */}
        {activeTool === 'waterfall' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Allocation Waterfall
                </h3>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Max-min water filling with guaranteed dignity floor
                </div>
              </div>
              <button
                onClick={handleDownloadCsv}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isLightMode
                    ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                    : 'text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08]'
                }`}
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 font-mono text-sm">
              <div className={`p-3 rounded-xl border flex justify-between items-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                <div>
                  <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    1. Gross Measured Demand
                  </div>
                  <div className={`text-base font-bold ${isLightMode ? 'text-rose-600' : 'text-rose-400'}`}>
                    {summary.verifiedTotalHours.toFixed(1)} hrs
                  </div>
                </div>
                <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {summary.verifiedTotalM3.toLocaleString()} m³
                </span>
              </div>

              <div className={`p-3 rounded-xl border flex justify-between items-center ${isLightMode ? 'bg-sky-50/60 border-sky-300' : 'bg-sky-950/20 border-sky-800/40'}`}>
                <div>
                  <div className={`text-xs font-sans ${isLightMode ? 'text-sky-700 font-semibold' : 'text-sky-300'}`}>
                    2. Calibrated Cap Ceiling
                  </div>
                  <div className={`text-base font-bold ${isLightMode ? 'text-sky-800' : 'text-sky-300'}`}>
                    {config.weeklyBudgetHoursEq.toFixed(1)} hrs
                  </div>
                </div>
                <span className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  {config.weeklyBudgetM3.toLocaleString()} m³
                </span>
              </div>

              <div className={`p-3 rounded-xl border flex justify-between items-center ${isLightMode ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/20 border-indigo-800/40'}`}>
                <div>
                  <div className={`text-xs font-sans ${isLightMode ? 'text-indigo-700 font-semibold' : 'text-indigo-300'}`}>
                    3. Dignity Floor (Guaranteed Base)
                  </div>
                  <div className={`text-base font-bold ${isLightMode ? 'text-indigo-800' : 'text-indigo-300'}`}>
                    37.0 hrs total
                  </div>
                </div>
                <span className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Pool Remainder: 69.5h
                </span>
              </div>

              <div className={`p-3 rounded-xl border flex justify-between items-center ${isLightMode ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/30 border-amber-800/50'}`}>
                <div>
                  <div className={`text-xs font-sans ${isLightMode ? 'text-amber-800 font-semibold' : 'text-amber-300'}`}>
                    4. Escrow Quarantine (Plot C)
                  </div>
                  <div className={`text-base font-bold ${isLightMode ? 'text-amber-800' : 'text-amber-300'}`}>
                    {farmerC.escrowHours.toFixed(1)} hrs held
                  </div>
                </div>
                <span className={`text-xs font-sans ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Status: {farmerC.escrowStatus}
                </span>
              </div>
            </div>

            {/* Farmer Breakdown */}
            <div className={`pt-3 border-t space-y-2 ${isLightMode ? 'border-slate-200' : 'border-white/[0.08]'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Farmer Allocation Breakdown:
              </div>
              {filteredFarmers.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onSelectObject(f.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedObjectId === f.id
                      ? isLightMode
                        ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/20'
                        : 'bg-white/[0.08] border-sky-400 ring-2 ring-sky-400/20'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div>
                    <div className={`font-semibold text-sm ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                      Farmer {f.id} · {f.name}
                    </div>
                    <div className={`text-xs font-mono mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Floor: {f.dignityFloorHours}h · Entitlement: {f.preliminaryEntitlementHours}h
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={`font-bold text-sm ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {f.allocatedHours.toFixed(1)} hrs
                    </div>
                    {f.escrowHours > 0 && (
                      <div className={`text-xs font-semibold ${isLightMode ? 'text-amber-800' : 'text-amber-400'}`}>
                        +{f.escrowHours.toFixed(1)}h [ESCROW]
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool: Multi-Signal Matrix */}
        {activeTool === 'signals' && (
          <div className="space-y-3.5">
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Multi-Signal Ground Truth
              </h3>
              <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Self-Report vs MSEDCL Smart Meter vs Sentinel-2 NDVI
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredFarmers.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onSelectObject(f.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    f.isFlagged
                      ? isLightMode
                        ? 'bg-rose-50/70 border-rose-300'
                        : 'bg-rose-950/20 border-rose-800/60'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-current/10">
                    <span className={`font-semibold text-sm ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                      Farmer {f.id}: {f.name}
                    </span>
                    <span className={`font-mono text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {f.crop} · {f.areaHa} ha
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs text-center">
                    <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
                      <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Report</div>
                      <div className={`font-bold text-sm mt-0.5 ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>{f.reportedHours}h</div>
                    </div>
                    <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
                      <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Meter</div>
                      <div className={`font-bold text-sm mt-0.5 ${f.isFlagged ? (isLightMode ? 'text-rose-600' : 'text-rose-400') : (isLightMode ? 'text-slate-900' : 'text-slate-100')}`}>
                        {f.meterHours !== null ? `${f.meterHours}h` : 'MISSING'}
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/[0.06]'}`}>
                      <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>NDVI</div>
                      <div className={`font-bold text-sm mt-0.5 ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>{f.satelliteNdvi.toFixed(3)}</div>
                    </div>
                  </div>
                  {f.isFlagged && (
                    <div className={`mt-2 text-xs font-medium ${isLightMode ? 'text-rose-700' : 'text-rose-300'}`}>
                      Discrepancy: +{f.meterDiscrepancyDelta}h. Escrow hold applied safely.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool: Aquifer Drawdown Physics */}
        {activeTool === 'theis' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Drawdown Physics
                </h3>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Theis analytical cone of depression & well interference
                </div>
              </div>
              <button
                onClick={onOpenTheisModal}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                  isLightMode
                    ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                    : 'bg-white/[0.06] text-sky-300 border-white/[0.08] hover:bg-white/[0.12]'
                }`}
              >
                Formula
              </button>
            </div>

            <div className={`p-3 rounded-xl border font-mono text-xs space-y-1.5 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'}`}>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Transmissivity (T):</span>
                <span className="font-semibold">120 m²/day</span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Storativity (S):</span>
                <span className="font-semibold">0.015</span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Discharge Rate:</span>
                <span className="font-semibold">15.0 L/s (54 m³/h)</span>
              </div>
            </div>

            <div className="space-y-2">
              {Object.values(drawdownResults).map((w) => (
                <div
                  key={w.wellId}
                  className={`p-3 rounded-xl border text-xs font-mono ${
                    isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div className="flex justify-between font-semibold text-sm">
                    <span className={isLightMode ? 'text-slate-900' : 'text-slate-100'}>{w.wellId} (Farmer {w.farmerId})</span>
                    <span className={isLightMode ? 'text-sky-700' : 'text-sky-400'}>{w.dynamicHeadM}m Head</span>
                  </div>
                  <div className={`flex justify-between text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>Self: {w.selfDrawdownM}m</span>
                    <span>Interference: +{w.interferingDrawdownM}m</span>
                    <span>Radius: {w.radiusOfInfluenceM}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool: Cryptographic Ledger */}
        {activeTool === 'ledger' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cryptographic Ledger
                </h3>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Binary SHA-256 Merkle root & tamper-evident proof
                </div>
              </div>
              <button
                onClick={() => setIsTamperingMerkle(!isTamperingMerkle)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg border cursor-pointer transition-colors ${
                  isTamperingMerkle
                    ? isLightMode
                      ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800 font-semibold'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    : 'bg-white/[0.06] text-slate-300 border-white/[0.08] hover:bg-white/[0.12]'
                }`}
              >
                {isTamperingMerkle ? 'Tamper Active' : 'Simulate Tamper'}
              </button>
            </div>

            <div className={`p-3 rounded-xl border font-mono text-xs space-y-1.5 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'}`}>
              <div className={`text-xs font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Active Merkle Root
              </div>
              <div className={`text-xs font-bold break-all select-all ${isLightMode ? 'text-sky-800' : 'text-sky-300'}`}>
                {isTamperingMerkle
                  ? '7b89f012cc4567890123def4567890123def4567890123def4567890123def00'
                  : 'e89c62f01d4a3b8417c889aa092147ff3a9032128e44b912a76f6634cd1122ab'}
              </div>
              <div className={`text-xs font-semibold ${isTamperingMerkle ? (isLightMode ? 'text-rose-700' : 'text-rose-400') : (isLightMode ? 'text-emerald-700' : 'text-emerald-400')}`}>
                {isTamperingMerkle ? 'Tamper Detected: Hash Mismatch' : 'Root Verified (Bit-for-Bit)'}
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {farmers.map((f) => (
                <div
                  key={f.id}
                  className={`p-2.5 rounded-lg border ${
                    isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div className="flex justify-between font-semibold">
                    <span className={isLightMode ? 'text-slate-900' : 'text-slate-100'}>Leaf {f.id} ({f.name})</span>
                    <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>{f.escrowStatus}</span>
                  </div>
                  <div className={`text-xs truncate mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {f.leafHash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool: Energy & Carbon Impact */}
        {activeTool === 'impact' && (
          <div className="space-y-3.5">
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Energy & Carbon Accounting
              </h3>
              <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Managed AquaPulse vs unmanaged counterfactual
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
                <div className={`text-xs font-sans ${isLightMode ? 'text-emerald-800 font-semibold' : 'text-emerald-300'}`}>
                  Avoided Energy
                </div>
                <div className={`text-lg font-bold mt-1 ${isLightMode ? 'text-emerald-900' : 'text-emerald-400'}`}>
                  +{impact.energySavedKwh} kWh
                </div>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {impact.energyPerM3} kWh/m³
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
                <div className={`text-xs font-sans ${isLightMode ? 'text-emerald-800 font-semibold' : 'text-emerald-300'}`}>
                  CO₂ Averted
                </div>
                <div className={`text-lg font-bold mt-1 ${isLightMode ? 'text-emerald-900' : 'text-emerald-400'}`}>
                  +{impact.co2AvoidedKg} kg
                </div>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  0.72 kg/kWh CEA
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${isLightMode ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'}`}>
              <div className={`font-semibold ${isLightMode ? 'text-amber-900' : 'text-amber-300'}`}>
                Feeder Advisory: 22:00 – 04:00
              </div>
              <p className={`leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Off-peak night pumping lowers well interference head drop by 1.8m and cuts evaporative loss across the Wardha agricultural basin.
              </p>
            </div>
          </div>
        )}

        {/* Tool: Allocation Policy Explainer */}
        {activeTool === 'copilot' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Policy Explainer
                </h3>
                <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Civic rules & rationale in plain language
                </div>
              </div>
              <div className={`flex p-0.5 rounded-lg border text-xs ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/[0.08]'}`}>
                <button
                  onClick={() => setCopilotLang('en')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    copilotLang === 'en'
                      ? isLightMode ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'bg-white/[0.14] text-white font-semibold'
                      : isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setCopilotLang('hi')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    copilotLang === 'hi'
                      ? isLightMode ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'bg-white/[0.14] text-white font-semibold'
                      : isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {copilotLang === 'en' ? (
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                  <div className={`font-semibold text-sm mb-1 ${isLightMode ? 'text-sky-800' : 'text-sky-300'}`}>
                    Why did the zone stress flip?
                  </div>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                    Self-reports totaled 95.0h (89.2% Semi-critical). Independent MSEDCL electrical meter readings proved Farmer C ran for 50.0h rather than the 20.0h reported, pushing extraction to 125.0h (103.0% Over-exploited).
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                  <div className={`font-semibold text-sm mb-1 ${isLightMode ? 'text-amber-800' : 'text-amber-300'}`}>
                    Why escrow instead of cutting water?
                  </div>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                    Telemetry signals flag anomalies; they never unilaterally cut a farmer's water. Farmer C receives 20.0h guaranteed baseline. The disputed 14.1h is held safely in escrow pending Gram Panchayat review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                  <div className={`font-semibold text-sm mb-1 ${isLightMode ? 'text-sky-800' : 'text-sky-300'}`}>
                    जल क्षेत्र ओवर-एक्सप्लॉइटेड क्यों हुआ?
                  </div>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                    किसानों द्वारा दर्ज रिपोर्ट में 95 घंटे थे (89.2%)। लेकिन सरकारी बिजली मीटर से पता चला कि किसान चंद्रकांत ने 20 के बदले 50 घंटे पंप चलाया (+30h), जिससे कुल निकासी 125 घंटे (103.0%) पर पहुँच गई।
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                  <div className={`font-semibold text-sm mb-1 ${isLightMode ? 'text-amber-800' : 'text-amber-300'}`}>
                    पानी एस्क्रो में क्यों रखा गया है?
                  </div>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                    सॉफ्टवेयर कभी अपने-आप पानी नहीं काटता। चंद्रकांत को 20 घंटे बुनियादी पानी दिया गया है। 14.1 घंटे विवादित पानी ग्राम पंचायत समिति के निर्णय तक एस्क्रो में सुरक्षित है।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool: SMS/IVR Dispatch */}
        {activeTool === 'sms' && (
          <div className="space-y-3.5">
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Offline GSM Notification
              </h3>
              <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Feature phone SMS and audio IVR dispatch for rural farmers
              </div>
            </div>

            <div className={`p-3 rounded-xl border font-mono text-xs space-y-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'}`}>
              <div className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Recipient: {farmerC.phone}</div>
              <div className={`p-2.5 rounded-lg border text-sm leading-relaxed font-sans ${isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/40 border-white/[0.06] text-slate-200'}`}>
                एक्वापल्स वर्धा पंचायत: किसान चंद्रकांत, आपका जल आवंटन 20.0 घंटे है। 14.1 घंटे एस्क्रो में सुरक्षित हैं। ग्राम समिति की समीक्षा बैठक गुरुवार को है।
              </div>
            </div>

            <button
              onClick={handleToggleVoice}
              className={`w-full py-2.5 font-medium text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                isLightMode
                  ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                  : 'bg-white/[0.1] hover:bg-white/[0.16] border border-white/[0.1] text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingSmsVoice ? 'Stop Audio Call' : 'Simulate Audio IVR Call'}</span>
            </button>
          </div>
        )}

        {/* Tool: Telemetry Simulator */}
        {activeTool === 'sandbox' && (
          <div className="space-y-3.5">
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Telemetry Simulator
              </h3>
              <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Simulate farmer self-reports vs smart meter hours in real-time
              </div>
            </div>

            <div className="space-y-2.5">
              {farmers.map((f) => (
                <div
                  key={f.id}
                  className={`p-3 rounded-xl border space-y-2 ${
                    isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-semibold text-sm ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                      Farmer {f.id} ({f.name})
                    </span>
                    <label className={`flex items-center gap-1.5 text-xs font-mono cursor-pointer ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={f.isMeterMissing}
                        onChange={(e) => onUpdateFarmerData(f.id, f.reportedHours, e.target.checked ? null : 28)}
                        className="accent-amber-500"
                      />
                      <span>Meter Offline</span>
                    </label>
                  </div>
                  <div>
                    <div className={`flex justify-between text-xs font-mono ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>Report: {f.reportedHours}h</span>
                      <span>Meter: {f.isMeterMissing ? 'OFFLINE' : `${f.meterHours}h`}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={f.reportedHours}
                      onChange={(e) => onUpdateFarmerData(f.id, Number(e.target.value), f.meterHours)}
                      className="w-full mt-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool: Epistemic Provenance */}
        {activeTool === 'honesty' && (
          <div className="space-y-3.5">
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Data Provenance Registry
              </h3>
              <div className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Traceability and provenance classification on every number
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
                <div className={`text-base font-bold ${isLightMode ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  8 [LIVE]
                </div>
                <div className={`text-xs font-sans mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Grid Meters, Sentinel-2
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'}`}>
                <div className={`text-base font-bold ${isLightMode ? 'text-amber-800' : 'text-amber-400'}`}>
                  6 [SYNTH]
                </div>
                <div className={`text-xs font-sans mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Reports, Baselines
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/20 border-indigo-800/40'}`}>
                <div className={`text-base font-bold ${isLightMode ? 'text-indigo-800' : 'text-indigo-400'}`}>
                  4 [ASSUMPTION]
                </div>
                <div className={`text-xs font-sans mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Dignity Floor Floors
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-sky-50 border-sky-200' : 'bg-sky-950/20 border-sky-800/40'}`}>
                <div className={`text-base font-bold ${isLightMode ? 'text-sky-800' : 'text-sky-400'}`}>
                  1 [USER]
                </div>
                <div className={`text-xs font-sans mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Client-side CSV Upload
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary & Escrow Audit Trigger */}
      <div
        className={`p-3.5 border-t flex items-center justify-between gap-3 shrink-0 transition-colors ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-white/[0.08]'
        }`}
      >
        <div>
          <div className={`text-xs uppercase tracking-wider font-mono ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Zone Extraction Status
          </div>
          <div className="text-sm font-mono font-bold flex items-center gap-1.5 mt-0.5">
            <span className={isLightMode ? 'text-rose-600' : 'text-rose-400'}>
              {(summary.verifiedStressRatio * 100).toFixed(1)}%
            </span>
            <span className={isLightMode ? 'text-slate-400' : 'text-slate-500'}>·</span>
            <span className={isLightMode ? 'text-amber-800' : 'text-amber-300'}>
              {farmerC.escrowHours.toFixed(1)}h Escrow
            </span>
          </div>
        </div>

        <button
          onClick={onOpenEscrowDrawer}
          className={`px-4 py-2 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            isLightMode
              ? 'bg-sky-600 hover:bg-sky-700 text-white'
              : 'bg-sky-400 hover:bg-sky-300 text-slate-950'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Audit Escrow</span>
        </button>
      </div>
    </div>
  );
};
