/**
 * AquaPulse: Verified Groundwater Allocation Platform
 * "Verify, then allocate, and show the proof."
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FarmerRecord,
  ZoneBudgetConfig,
  ZoneSummary,
  EscrowStatus,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
  computeAquiferDrawdown,
  runAllocationPipeline,
  computeImpactMetrics,
  parseAndValidateFarmerCsv,
  STORED_STRESS_TRAJECTORIES,
} from 'packages/core';

import { PlaygroundRail, PlaygroundTool } from './components/PlaygroundRail.tsx';
import { PlaygroundWidgetPanel } from './components/PlaygroundWidgetPanel.tsx';
import { PlaygroundMap } from './components/PlaygroundMap.tsx';
import { PlaygroundInspector } from './components/PlaygroundInspector.tsx';
import { PlaygroundScrubber } from './components/PlaygroundScrubber.tsx';

import { EscrowCommitteeDrawer } from './components/EscrowCommitteeDrawer.tsx';
import { MerkleInspectorModal } from './components/MerkleInspectorModal.tsx';
import { DrawdownTheisModal } from './components/DrawdownTheisModal.tsx';
import { CapProvenanceModal } from './components/CapProvenanceModal.tsx';
import { ImpactMeterModal } from './components/ImpactMeterModal.tsx';
import { HonestyPanelModal } from './components/HonestyPanelModal.tsx';
import { CopilotDrawer } from './components/CopilotDrawer.tsx';
import { SmsIvrModal } from './components/SmsIvrModal.tsx';
import { SandboxModal } from './components/SandboxModal.tsx';
import { ObjectGraphModal } from './components/ObjectGraphModal.tsx';
import { ProveItModal } from './components/ProveItModal.tsx';
import { CommandBar } from './components/CommandBar.tsx';
import { WorkedAllocationTable } from './components/WorkedAllocationTable.tsx';
import { Lock, Terminal, ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [activeTool, setActiveTool] = useState<PlaygroundTool>('verify');
  const [verifyStep, setVerifyStep] = useState<number>(3);
  const [isPlayingVerify, setIsPlayingVerify] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('C');

  // Sync light class to document element for global theme cascade
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [isLightMode]);

  // Modals & Drawers
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isEscrowDrawerOpen, setIsEscrowDrawerOpen] = useState(false);
  const [isMerkleModalOpen, setIsMerkleModalOpen] = useState(false);
  const [isTheisModalOpen, setIsTheisModalOpen] = useState(false);
  const [isCapModalOpen, setIsCapModalOpen] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [isHonestyModalOpen, setIsHonestyModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isObjectGraphOpen, setIsObjectGraphOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [activeProveItTrace, setActiveProveItTrace] = useState<ProvenanceTrace | null>(null);

  // Core Zone-A Config State (Calibrated to Wardha Aquifer Basin §6.11)
  const [config, setConfig] = useState<ZoneBudgetConfig>({
    zoneId: 'ZONE-A',
    zoneName: 'Zone-A (Wardha, Maharashtra)',
    district: 'Wardha',
    state: 'Maharashtra',
    centroid: [20.782, 78.558],
    weeklyBudgetM3: 7020, // 130.0h @ 54 m3/h reference
    weeklyBudgetHoursEq: 130.0, // Official sustainable budget B_REF = 130.0h
    aquiferTransmissivityM2Day: 120,
    aquiferStorativity: 0.015,
    baseWaterTableDepthM: 18.5,
    currentRechargeRateMm: 12.4,
    conformalAlpha: 0.1,
    overdrawCorrectionFactor: 0.952,
  });

  // Base 4 Farmers State (Canonical Zone-A Benchmark per spec §6.11 and Appendix E)
  const [rawFarmers, setRawFarmers] = useState<FarmerRecord[]>([
    {
      id: 'A',
      name: 'Rameshwar Patel',
      phone: '+91 98221 40192',
      crop: 'Bt Cotton',
      areaHa: 2.83, // 7.0 acres
      wellId: 'W-01',
      feederId: 'F-01',
      lat: 20.7835,
      lng: 78.5562,
      wellCoord: [20.7835, 78.5562],
      polygon: [
        [20.785, 78.554],
        [20.7855, 78.5585],
        [20.782, 78.5588],
        [20.7816, 78.5542],
      ],
      reportedHours: 28.0,
      meterHours: 28.0,
      isMeterMissing: false,
      meterDiscrepancyDelta: 0.0,
      satelliteNdvi: 0.582,
      satelliteImpliedHours: 28.0,
      dischargeRateLps: 15.0,
      dischargeM3PerHour: 54.0,
      reportedVolumeM3: 1512,
      verifiedVolumeM3: 1512,
      trustScore: 1.0,
      isFlagged: false,
      flagReason: null,
      dignityFloorHours: 8.0,
      landShareRatio: 0.2414,
      preliminaryEntitlementHours: 28.0,
      allocatedHours: 28.0,
      escrowHours: 0.0,
      escrowStatus: 'NONE',
      drawdownDepthMeters: 3.82,
      interferenceOverheadKwh: 7.2,
      leafHash: 'db4021675ab8a5fdd2d0abc8b1c7af19b025ef6ab8f960c948aab842c9515be1',
    },
    {
      id: 'B',
      name: 'Suresh Deshmukh',
      phone: '+91 97633 81204',
      crop: 'Soybean (JS-335)',
      areaHa: 3.04, // 7.5 acres
      wellId: 'W-02',
      feederId: 'F-01',
      lat: 20.7802,
      lng: 78.5566,
      wellCoord: [20.7802, 78.5566],
      polygon: [
        [20.7816, 78.5542],
        [20.782, 78.5588],
        [20.7788, 78.5592],
        [20.7785, 78.5545],
      ],
      reportedHours: 30.0,
      meterHours: 30.0,
      isMeterMissing: false,
      meterDiscrepancyDelta: 0.0,
      satelliteNdvi: 0.524,
      satelliteImpliedHours: 29.5,
      dischargeRateLps: 15.0,
      dischargeM3PerHour: 54.0,
      reportedVolumeM3: 1620,
      verifiedVolumeM3: 1620,
      trustScore: 1.0,
      isFlagged: false,
      flagReason: null,
      dignityFloorHours: 8.5,
      landShareRatio: 0.2586,
      preliminaryEntitlementHours: 30.0,
      allocatedHours: 30.0,
      escrowHours: 0.0,
      escrowStatus: 'NONE',
      drawdownDepthMeters: 3.95,
      interferenceOverheadKwh: 7.6,
      leafHash: '4cf1fdf4ff8d7a6749e1e8c6dc9d6b1d9fcde254cf9239c99c113ab7e7835177',
    },
    {
      id: 'C',
      name: 'Chandrakant Gaikwad',
      phone: '+91 94228 19340',
      crop: 'Sugarcane / Cotton',
      areaHa: 2.02, // 5.0 acres
      wellId: 'W-03',
      feederId: 'F-02',
      lat: 20.784,
      lng: 78.561,
      wellCoord: [20.784, 78.561],
      polygon: [
        [20.7855, 78.5585],
        [20.786, 78.563],
        [20.7825, 78.5634],
        [20.782, 78.5588],
      ],
      reportedHours: 20.0,
      meterHours: 50.0,
      isMeterMissing: false,
      meterDiscrepancyDelta: 30.0,
      satelliteNdvi: 0.741,
      satelliteImpliedHours: 48.2,
      dischargeRateLps: 15.0,
      dischargeM3PerHour: 54.0,
      reportedVolumeM3: 1080,
      verifiedVolumeM3: 2052, // U = 38h
      trustScore: 0.40,
      isFlagged: true,
      flagReason:
        'GRID_DISCREPANCY: Meter recorded 50.0h vs 20.0h reported (+30.0h). Corroborated by Sentinel-2 NDVI (0.741). Escrow hold triggered.',
      dignityFloorHours: 6.0,
      landShareRatio: 0.1724,
      preliminaryEntitlementHours: 34.1,
      allocatedHours: 20.0,
      escrowHours: 14.1,
      escrowStatus: 'HELD',
      drawdownDepthMeters: 6.84,
      interferenceOverheadKwh: 22.8,
      leafHash: 'ab3b0f880d59079828deeec6f9da209615a0ce900e32be1e85feb3865834521e',
    },
    {
      id: 'D',
      name: 'Dinesh Wankhede',
      phone: '+91 99750 62118',
      crop: 'Gram (Chickpea)',
      areaHa: 3.84, // 9.5 acres
      wellId: 'W-04',
      feederId: 'F-02',
      lat: 20.7808,
      lng: 78.5612,
      wellCoord: [20.7808, 78.5612],
      polygon: [
        [20.782, 78.5588],
        [20.7825, 78.5634],
        [20.7792, 78.5638],
        [20.7788, 78.5592],
      ],
      reportedHours: 38.0,
      meterHours: 36.0,
      isMeterMissing: false,
      meterDiscrepancyDelta: -2.0,
      satelliteNdvi: 0.485,
      satelliteImpliedHours: 37.0,
      dischargeRateLps: 15.0,
      dischargeM3PerHour: 54.0,
      reportedVolumeM3: 2052,
      verifiedVolumeM3: 2046, // U = 37.895h per spec §6.11
      trustScore: 0.947,
      isFlagged: false,
      flagReason: null,
      dignityFloorHours: 10.5,
      landShareRatio: 0.3276,
      preliminaryEntitlementHours: 37.9,
      allocatedHours: 37.9,
      escrowHours: 0.0,
      escrowStatus: 'NONE',
      drawdownDepthMeters: 4.88,
      interferenceOverheadKwh: 9.4,
      leafHash: '83480b82bc150246967d95c37992933fecbee0e15d44bdc94e70c22a50b79ac7',
    },
  ]);

  // Committee overrides
  const [committeeVerdicts, setCommitteeVerdicts] = useState<Record<string, EscrowStatus>>({
    C: 'HELD',
  });

  // Calculate Theis Drawdown dynamically
  const drawdownResults = useMemo(() => {
    const wells = rawFarmers.map((f) => ({
      id: f.wellId,
      farmerId: f.id,
      lat: f.wellCoord[0],
      lng: f.wellCoord[1],
      depthM: 45,
      pumpingHours: f.meterHours ?? f.reportedHours,
      dischargeLps: f.dischargeRateLps,
    }));

    return computeAquiferDrawdown(
      wells,
      config.aquiferTransmissivityM2Day,
      config.aquiferStorativity,
      7,
      config.baseWaterTableDepthM
    );
  }, [rawFarmers, config]);

  // Run Allocation Pipeline
  const allocationResult = useMemo(() => {
    return runAllocationPipeline(rawFarmers, config, {
      committeeVerdicts,
    });
  }, [rawFarmers, config, committeeVerdicts]);

  const { farmers, summary } = allocationResult;

  // Impact Metrics
  const impact = useMemo(() => {
    return computeImpactMetrics(farmers, 1.8);
  }, [farmers]);

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyVerdict = (farmerId: string, status: EscrowStatus) => {
    setCommitteeVerdicts((prev) => ({
      ...prev,
      [farmerId]: status,
    }));
  };

  const handleUploadCsv = (csvText: string) => {
    const res = parseAndValidateFarmerCsv(csvText);
    if (!res.isValid) {
      alert(`CSV Error:\n${res.errors.join('\n')}`);
      return;
    }

    if (res.parsedFarmers) {
      setRawFarmers((prev) =>
        prev.map((f) => {
          const match = res.parsedFarmers?.find((p) => p.id === f.id);
          if (!match) return f;
          return {
            ...f,
            name: match.name || f.name,
            crop: match.crop || f.crop,
            areaHa: match.areaHa ?? f.areaHa,
            reportedHours: match.reportedHours ?? f.reportedHours,
            meterHours: match.meterHours ?? f.meterHours,
            isMeterMissing: match.isMeterMissing ?? false,
          };
        })
      );

      PROVENANCE_REGISTRY['user.csv'] = {
        tag: 'USER',
        sourceId: `USER_FILE_${res.fileHash.slice(0, 8)}`,
        sourceName: 'Client-Side User CSV Import',
        hash: res.fileHash,
        timestamp: new Date().toISOString(),
        description: `Imported in-browser from local file. SHA-256 fingerprint: ${res.fileHash}`,
        methodology: 'Processed purely in local memory; zero server upload.',
      };
      setActiveProveItTrace(PROVENANCE_REGISTRY['user.csv']);
    }
  };

  const handleUpdateFarmerData = (
    farmerId: string,
    reportedHours: number,
    meterHours: number | null
  ) => {
    setRawFarmers((prev) =>
      prev.map((f) =>
        f.id === farmerId
          ? {
              ...f,
              reportedHours,
              meterHours,
              isMeterMissing: meterHours === null,
            }
          : f
      )
    );
  };

  const handleResetBenchmark = () => {
    const benchmark = STORED_STRESS_TRAJECTORIES.find((t) => t.id === 'BENCHMARK');
    if (benchmark) {
      setRawFarmers((prev) =>
        prev.map((f) => ({
          ...f,
          reportedHours: (benchmark.reportedHours as any)[f.id] ?? f.reportedHours,
          meterHours: (benchmark.meterHours as any)[f.id] ?? f.meterHours,
          isMeterMissing: false,
        }))
      );
    }
    setCommitteeVerdicts({ C: 'HELD' });
    setVerifyStep(3);
  };

  const handleCommandBarAction = (actionId: string) => {
    switch (actionId) {
      case 'verify_flow':
        setActiveTool('verify');
        setVerifyStep(1);
        setIsPlayingVerify(true);
        break;
      case 'select_farmer_c':
        setSelectedObjectId('C');
        setActiveTool('verify');
        break;
      case 'open_escrow':
        setIsEscrowDrawerOpen(true);
        break;
      case 'open_merkle':
        setIsMerkleModalOpen(true);
        break;
      case 'open_theis':
        setIsTheisModalOpen(true);
        break;
      case 'open_impact':
        setIsImpactModalOpen(true);
        break;
      case 'open_copilot':
        setIsCopilotOpen(true);
        break;
      case 'open_sms':
        setIsSmsModalOpen(true);
        break;
      case 'open_table':
        setIsTableModalOpen(true);
        break;
      case 'open_honesty':
        setIsHonestyModalOpen(true);
        break;
      case 'open_cap':
        setIsCapModalOpen(true);
        break;
      case 'open_object_graph':
        setIsObjectGraphOpen(true);
        break;
      case 'open_sandbox':
        setIsSandboxOpen(true);
        break;
      default:
        break;
    }
  };

  const selectedFarmer =
    farmers.find((f) => f.id === selectedObjectId || f.wellId === selectedObjectId) || null;
  const farmerC = farmers.find((f) => f.id === 'C') || farmers[2];

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans antialiased selection:bg-sky-500/20 selection:text-sky-400 transition-colors ${
        isLightMode
          ? 'light bg-slate-100 text-slate-900'
          : 'dark bg-[#080a0f] text-slate-100'
      }`}
    >
      {/* 1. Ultra-Clean FAANG Top Header */}
      <header
        className={`h-13 px-4 border-b flex items-center justify-between z-40 select-none shrink-0 transition-colors ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-[#0b0d14] border-white/[0.08] text-slate-100'
        }`}
      >
        {/* Brand & Zone Identification */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTool('verify')}>
            {/* Precision AquaPulse Logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
              <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5">
                <path
                  d="M12 2.5 C12 2.5 5 11 5 15.5 A7 7 0 0 0 19 15.5 C19 11 12 2.5 12 2.5 Z"
                  fill="rgba(255, 255, 255, 0.25)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M8.5 15.5 C10 14 11 14 12 15.5 C13 17 14 17 15.5 15.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-current">AquaPulse</span>
              <span className={`text-[11px] font-medium leading-none mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Groundwater Accounting
              </span>
            </div>
          </div>

          <span className={`text-sm ${isLightMode ? 'text-slate-300' : 'text-slate-600'}`}>/</span>

          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            isLightMode ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.05] border-white/[0.08] text-slate-300'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Zone-A · Wardha Basin (MH)</span>
          </div>
        </div>

        {/* Center Meaningful Water Accounting Numbers */}
        <div className="hidden lg:flex items-center gap-5 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Weekly Cap:</span>
            <span className="font-bold text-sm text-current">{config.weeklyBudgetHoursEq}h</span>
            <span className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>({config.weeklyBudgetM3.toLocaleString()} m³)</span>
          </div>

          <span className={isLightMode ? 'text-slate-300' : 'text-slate-700'}>·</span>

          <div className="flex items-center gap-1.5">
            <span className={`font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Self-Reported:</span>
            <span className="font-semibold text-sm text-current">{summary.reportedTotalHours}h</span>
          </div>

          <span className={isLightMode ? 'text-slate-300' : 'text-slate-700'}>·</span>

          <div className="flex items-center gap-1.5">
            <span className={`font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Grid Measured:</span>
            <span className="font-semibold text-sm text-current">{summary.verifiedTotalHours}h</span>
          </div>

          <span className={isLightMode ? 'text-slate-300' : 'text-slate-700'}>·</span>

          <div className="flex items-center gap-1.5">
            <span className={`font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Extraction Status:</span>
            <span className={`font-bold text-sm ${isLightMode ? 'text-rose-600' : 'text-rose-400'}`}>
              {(summary.verifiedStressRatio * 100).toFixed(1)}% ({summary.verifiedTier})
            </span>
          </div>

          <span className={isLightMode ? 'text-slate-300' : 'text-slate-700'}>·</span>

          <div className="flex items-center gap-1.5">
            <span className={`font-sans ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Escrow Held:</span>
            <span className={`font-bold text-sm ${isLightMode ? 'text-amber-800' : 'text-amber-300'}`}>
              {farmerC.escrowHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          {farmerC.escrowHours > 0 && (
            <button
              onClick={() => setIsEscrowDrawerOpen(true)}
              className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isLightMode
                  ? 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900'
                  : 'bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/80 text-amber-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Review Escrow (14.1h)</span>
            </button>
          )}

          {/* Top Bar Theme Toggle */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-slate-200'
            }`}
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLightMode ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Light</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsCommandBarOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-slate-300 hover:text-white'
            }`}
            title="Command Menu (Cmd+K)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>⌘K</span>
          </button>
        </div>
      </header>

      {/* 2. Main Body: Rail + Docked Panel + Full-Screen Map */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Leftmost Iconic Tool Rail */}
        <PlaygroundRail
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onOpenCommandBar={() => setIsCommandBarOpen(true)}
          onResetBenchmark={handleResetBenchmark}
          hasEscrow={farmers.some((f) => f.escrowHours > 0)}
          isLightMode={isLightMode}
          onToggleLightMode={() => setIsLightMode(!isLightMode)}
        />

        {/* Left Floating Docked Widget Panel */}
        <PlaygroundWidgetPanel
          activeTool={activeTool}
          farmers={farmers}
          config={config}
          summary={summary}
          impact={impact}
          drawdownResults={drawdownResults}
          verifyStep={verifyStep}
          onSetVerifyStep={setVerifyStep}
          selectedObjectId={selectedObjectId}
          onSelectObject={setSelectedObjectId}
          onProveIt={setActiveProveItTrace}
          onOpenEscrowDrawer={() => setIsEscrowDrawerOpen(true)}
          onOpenMerkleModal={() => setIsMerkleModalOpen(true)}
          onOpenTheisModal={() => setIsTheisModalOpen(true)}
          onUpdateFarmerData={handleUpdateFarmerData}
          isLightMode={isLightMode}
        />

        {/* Central Full-Screen Leaflet Map */}
        <div className="flex-1 h-full relative overflow-hidden">
          <PlaygroundMap
            farmers={farmers}
            config={config}
            summary={summary}
            drawdownResults={drawdownResults}
            verifyStep={verifyStep}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onProveIt={setActiveProveItTrace}
            onUploadCsv={handleUploadCsv}
            isLightMode={isLightMode}
          />

          {/* Right Floating Context Inspector */}
          {selectedFarmer && (
            <PlaygroundInspector
              farmer={selectedFarmer}
              onClose={() => setSelectedObjectId(null)}
              drawdown={drawdownResults[selectedFarmer.wellId]}
              onProveIt={setActiveProveItTrace}
              onOpenEscrow={() => setIsEscrowDrawerOpen(true)}
              onOpenSms={() => setIsSmsModalOpen(true)}
              onSelectNeighbor={(neighborId) => setSelectedObjectId(neighborId)}
              isLightMode={isLightMode}
            />
          )}

          {/* Bottom Floating Hero Scrubber */}
          <PlaygroundScrubber
            verifyStep={verifyStep}
            onSetVerifyStep={setVerifyStep}
            isPlaying={isPlayingVerify}
            onTogglePlay={() => setIsPlayingVerify(!isPlayingVerify)}
            isLightMode={isLightMode}
          />
        </div>
      </div>

      {/* Comprehensive Modals */}
      <ProveItModal trace={activeProveItTrace} onClose={() => setActiveProveItTrace(null)} />

      <EscrowCommitteeDrawer
        isOpen={isEscrowDrawerOpen}
        onClose={() => setIsEscrowDrawerOpen(false)}
        farmer={farmerC}
        onApplyVerdict={handleApplyVerdict}
        onProveIt={setActiveProveItTrace}
      />

      <MerkleInspectorModal
        isOpen={isMerkleModalOpen}
        onClose={() => setIsMerkleModalOpen(false)}
        farmers={farmers}
        summary={summary}
      />

      <DrawdownTheisModal
        isOpen={isTheisModalOpen}
        onClose={() => setIsTheisModalOpen(false)}
        drawdownResults={drawdownResults}
      />

      <CapProvenanceModal
        isOpen={isCapModalOpen}
        onClose={() => setIsCapModalOpen(false)}
        onLoadTrajectory={(id) => {
          const traj = STORED_STRESS_TRAJECTORIES.find((t) => t.id === id);
          if (traj) {
            setRawFarmers((prev) =>
              prev.map((f) => ({
                ...f,
                reportedHours: (traj.reportedHours as any)[f.id] ?? f.reportedHours,
                meterHours: (traj.meterHours as any)[f.id] ?? f.meterHours,
                isMeterMissing: (traj.missingMeters as any)[f.id] ?? false,
              }))
            );
          }
        }}
        onProveIt={setActiveProveItTrace}
      />

      <ImpactMeterModal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        impact={impact}
        onProveIt={setActiveProveItTrace}
      />

      <HonestyPanelModal
        isOpen={isHonestyModalOpen}
        onClose={() => setIsHonestyModalOpen(false)}
        config={config}
        onUpdateAssumptions={(newParams) => setConfig((prev) => ({ ...prev, ...newParams }))}
        onProveIt={setActiveProveItTrace}
      />

      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        farmers={farmers}
        summary={summary}
      />

      <SmsIvrModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        farmer={farmerC}
      />

      <SandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        farmers={farmers}
        onUpdateFarmerData={handleUpdateFarmerData}
        onResetBenchmark={handleResetBenchmark}
      />

      <ObjectGraphModal
        isOpen={isObjectGraphOpen}
        onClose={() => setIsObjectGraphOpen(false)}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
        farmers={farmers}
        drawdownResults={drawdownResults}
      />

      {/* Full Worked Allocation Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Worked Allocation Table & Invariant Verifier (§6.11)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-mono">Zero-Diff Parity</span>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <WorkedAllocationTable
                farmers={farmers}
                config={config}
                summary={summary}
                selectedObjectId={selectedObjectId}
                onSelectObject={setSelectedObjectId}
                onProveIt={setActiveProveItTrace}
              />
            </div>
          </div>
        </div>
      )}

      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onSelectAction={handleCommandBarAction}
      />
    </div>
  );
}
