/**
 * AquaPulse Unified Groundwater Accounting Store (Zustand)
 * Single source of truth wiring all components to packages/core math.
 * Conforms to spec §6.1, §6.2, §6.4, §6.5, §6.8, §6.11 and the WIRING RULES.
 */

import { create } from 'zustand';
import {
  trustBlend,
  waterFill,
  escrowSplit,
  applyCommitteeDecision,
  getWaterTier,
  computeAquiferDrawdown,
  buildMerkleTree,
  computeCanonicalLeafHex,
  computeCanonicalRootHex,
  haversineDistanceMeters,
  EscrowStatus,
  ProvenanceTrace,
  WaterTier,
  WellDrawdownResult,
  FarmerRecord,
  ZoneBudgetConfig,
  ZoneSummary,
  MerkleNode,
} from 'packages/core';

export interface FarmerState {
  id: 'A' | 'B' | 'C' | 'D';
  name: string;
  phone: string;
  crop: string;
  land: number; // in acres: 7.0, 7.5, 5.0, 9.5 (= 29.0 ac = 11.7 ha)
  areaHa: number;
  R: number; // self-reported hours
  E: number | null; // smart-meter hours (or null if offline)
  metersOffline: boolean;
  wellId: string;
  feederId: string;
  lat: number;
  lng: number;
  wellCoord: [number, number];
  polygon: [number, number][];
  satelliteNdvi: number;
}

export interface MerkleReceipt {
  timestamp: string;
  action: string;
  leafHash: string;
  rootHash: string;
  farmerId: string;
  allocatedHours: number;
  escrowHours: number;
}

export interface SceneProvenance {
  zoneId: string;
  acquisitionDate: string;
  sceneId: string;
  cloudCoveragePercent: number;
  stacItemUrl: string;
  sensor: string;
  ndviFormula: string;
  codePath: string;
  artifactSha256: string;
  description: string;
}

// Canonical Zone-A plot polygons scaled proportionally to land (7.0, 7.5, 5.0, 9.5 acres)
// Centered around 20.7820, 78.5580 in Wardha, MH
export const CANONICAL_FARMERS_BASE: FarmerState[] = [
  {
    id: 'A',
    name: 'Rameshwar Patel',
    phone: '+91 98221 40192',
    crop: 'Bt Cotton',
    land: 7.0,
    areaHa: 2.83,
    R: 28.0,
    E: 28.0,
    metersOffline: false,
    wellId: 'W-01',
    feederId: 'F-01',
    lat: 20.7835,
    lng: 78.5562,
    wellCoord: [20.7835, 78.5562],
    polygon: [
      [20.7852, 78.5539],
      [20.7856, 78.5583],
      [20.7821, 78.5586],
      [20.7818, 78.5541],
    ],
    satelliteNdvi: 0.582,
  },
  {
    id: 'B',
    name: 'Suresh Deshmukh',
    phone: '+91 97633 81204',
    crop: 'Soybean (JS-335)',
    land: 7.5,
    areaHa: 3.04,
    R: 30.0,
    E: 30.0,
    metersOffline: false,
    wellId: 'W-02',
    feederId: 'F-01',
    lat: 20.7802,
    lng: 78.5566,
    wellCoord: [20.7802, 78.5566],
    polygon: [
      [20.7818, 78.5541],
      [20.7821, 78.5586],
      [20.7786, 78.5590],
      [20.7783, 78.5544],
    ],
    satelliteNdvi: 0.524,
  },
  {
    id: 'C',
    name: 'Chandrakant Gaikwad',
    phone: '+91 94228 19340',
    crop: 'Sugarcane / Cotton',
    land: 5.0, // smaller 5.0 acres plot
    areaHa: 2.02,
    R: 20.0,
    E: 50.0,
    metersOffline: false,
    wellId: 'W-03',
    feederId: 'F-02',
    lat: 20.7840,
    lng: 78.5610,
    wellCoord: [20.7840, 78.5610],
    // Visibly smaller polygon matching 5.0 ac
    polygon: [
      [20.7854, 78.5587],
      [20.7858, 78.5624],
      [20.7828, 78.5627],
      [20.7824, 78.5590],
    ],
    satelliteNdvi: 0.741,
  },
  {
    id: 'D',
    name: 'Dinesh Wankhede',
    phone: '+91 99750 62118',
    crop: 'Gram (Chickpea)',
    land: 9.5, // larger 9.5 acres plot
    areaHa: 3.84,
    R: 38.0,
    E: 36.0,
    metersOffline: false,
    wellId: 'W-04',
    feederId: 'F-02',
    lat: 20.7808,
    lng: 78.5612,
    wellCoord: [20.7808, 78.5612],
    // Visibly larger polygon matching 9.5 ac
    polygon: [
      [20.7824, 78.5590],
      [20.7828, 78.5641],
      [20.7787, 78.5645],
      [20.7783, 78.5594],
    ],
    satelliteNdvi: 0.485,
  },
];

export interface DerivedFarmer extends FarmerRecord {
  landAcres: number;
  R: number;
  E: number | null;
  metersOffline: boolean;
  T: number;
  lambda: number;
  U: number;
  mismatch: number;
}

export interface GroundwaterStore {
  // 1. Raw State per Wiring Rules
  farmers: FarmerState[];
  pool: number; // Weekly pool (78-130 h, default 130.0)
  step: number; // Playback step (1..4, default 3)
  mode: 'STEP' | 'LIVE'; // Touching any slider flips to 'LIVE'
  committeeDecisions: Record<string, EscrowStatus>;
  receipts: MerkleReceipt[];
  dignityFloor: number; // Customary floor (default 0.0, 5.0 for preset)
  Qi: number; // Visible assumption: 54.0 m3/h

  // UI Navigation & View State
  activeTab: 'all' | 'meter' | 'ndvi' | 'drawdown';
  selectedFarmerId: string | null;
  isLightMode: boolean;
  isLiteMode: boolean;
  isPlaying: boolean;
  activeProveItTrace: ProvenanceTrace | null;
  sceneProvenance: SceneProvenance | null;
  sceneProvenanceLoaded: boolean;
  snapshotLoaded: boolean;

  // Actions
  setStep: (step: number) => void;
  setPool: (pool: number) => void;
  setFarmerR: (id: string, R: number) => void;
  setFarmerE: (id: string, E: number | null) => void;
  setMeterOffline: (id: string, offline: boolean) => void;
  setDignityFloor: (floor: number) => void;
  setSelectedFarmerId: (id: string | null) => void;
  setActiveTab: (tab: 'all' | 'meter' | 'ndvi' | 'drawdown') => void;
  setIsLightMode: (isLight: boolean) => void;
  setIsLiteMode: (isLite: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveProveItTrace: (trace: ProvenanceTrace | null) => void;

  // Committee Actions
  applyConfirm: (farmerId: string) => void;
  applyDismiss: (farmerId: string) => void;
  applyTimeout: (farmerId: string) => void;

  // Presets & Reset
  resetBaseline: () => void;
  loadPreset: (presetId: string) => void;
  importCsv: (csvContent: string) => { success: boolean; error?: string };

  // Runtime fetches
  initRuntimeData: () => Promise<void>;

  // Computed Selectors
  getDerivedState: () => {
    derivedFarmers: DerivedFarmer[];
    totalLandAcres: number;
    totalLandHa: number;
    reportedTotalHours: number;
    reportedTotalM3: number;
    reportedStressRatio: number;
    reportedTier: WaterTier;
    meterTotalHours: number;
    meterTotalM3: number;
    meterStressRatio: number;
    meterTier: WaterTier;
    verifiedTotalHours: number;
    verifiedTotalM3: number;
    verifiedStressRatio: number;
    verifiedTier: WaterTier;
    totalAllocatedHours: number;
    totalAllocatedM3: number;
    totalEscrowHours: number;
    totalEscrowM3: number;
    totalUnusedHours: number;
    isFlipped: boolean;
    merkleRoot: string;
    merkleTree: MerkleNode;
    drawdownResults: Record<string, WellDrawdownResult>;
    step1Sentence: string;
    step2Sentence: string;
    step3Sentence: string;
    step4Sentence: string;
    summary: ZoneSummary;
    config: ZoneBudgetConfig;
  };
}

export const useGroundwaterStore = create<GroundwaterStore>((set, get) => ({
  farmers: CANONICAL_FARMERS_BASE,
  pool: 130.0,
  step: 3,
  mode: 'STEP',
  committeeDecisions: { C: 'HELD' },
  receipts: [
    {
      timestamp: '2026-10-05T06:00:00Z',
      action: 'INITIAL_ZONE_ALLOCATION',
      leafHash: 'db4021675ab8a5fdd2d0abc8b1c7af19b025ef6ab8f960c948aab842c9515be1',
      rootHash: 'b0fb427d7e2a42bc6f6583fbbb54bed252c0e6d582ac95882f5a3bcd007bba38',
      farmerId: 'C',
      allocatedHours: 20.0,
      escrowHours: 14.1,
    },
  ],
  dignityFloor: 0.0,
  Qi: 54.0,

  activeTab: 'all',
  selectedFarmerId: 'C',
  isLightMode: false,
  isLiteMode: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lite') === '1' : false,
  isPlaying: false,
  activeProveItTrace: null,
  sceneProvenance: null,
  sceneProvenanceLoaded: false,
  snapshotLoaded: false,

  setStep: (step) => set({ step }),

  setPool: (pool) =>
    set({
      pool,
      mode: 'LIVE', // User touched slider: live mode
    }),

  setFarmerR: (id, R) =>
    set((state) => ({
      mode: 'LIVE',
      farmers: state.farmers.map((f) => (f.id === id ? { ...f, R: Math.max(0, Math.min(60, R)) } : f)),
    })),

  setFarmerE: (id, E) =>
    set((state) => ({
      mode: 'LIVE',
      farmers: state.farmers.map((f) =>
        f.id === id ? { ...f, E: E === null ? null : Math.max(0, Math.min(60, E)), metersOffline: E === null } : f
      ),
    })),

  setMeterOffline: (id, offline) =>
    set((state) => ({
      mode: 'LIVE',
      farmers: state.farmers.map((f) =>
        f.id === id
          ? {
              ...f,
              metersOffline: offline,
              E: offline ? null : f.E ?? f.R,
            }
          : f
      ),
    })),

  setDignityFloor: (floor) => set({ dignityFloor: floor, mode: 'LIVE' }),
  setSelectedFarmerId: (id) => set({ selectedFarmerId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLightMode: (isLightMode) => set({ isLightMode }),
  setIsLiteMode: (isLiteMode) => set({ isLiteMode }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setActiveProveItTrace: (trace) => set({ activeProveItTrace: trace }),

  applyConfirm: (farmerId) => {
    const { committeeDecisions, getDerivedState } = get();
    const updatedDecisions = applyCommitteeDecision(farmerId, 'CONFIRMED', committeeDecisions);
    const derived = getDerivedState();
    const newReceipt: MerkleReceipt = {
      timestamp: new Date().toISOString(),
      action: 'COMMITTEE_CONFIRMED',
      farmerId,
      leafHash: computeCanonicalLeafHex([farmerId, 'ZONE-A', 'WEEK10', '20.000000', '0.000000']),
      rootHash: derived.merkleRoot,
      allocatedHours: 20.0,
      escrowHours: 0.0,
    };

    set((state) => ({
      committeeDecisions: updatedDecisions,
      receipts: [newReceipt, ...state.receipts],
    }));
  },

  applyDismiss: (farmerId) => {
    const { committeeDecisions, getDerivedState } = get();
    const updatedDecisions = applyCommitteeDecision(farmerId, 'DISMISSED', committeeDecisions);
    const derived = getDerivedState();
    const newReceipt: MerkleReceipt = {
      timestamp: new Date().toISOString(),
      action: 'COMMITTEE_DISMISSED',
      farmerId,
      leafHash: computeCanonicalLeafHex([farmerId, 'ZONE-A', 'WEEK10', '34.105263', '0.000000']),
      rootHash: derived.merkleRoot,
      allocatedHours: 34.11,
      escrowHours: 0.0,
    };

    set((state) => ({
      committeeDecisions: updatedDecisions,
      receipts: [newReceipt, ...state.receipts],
    }));
  },

  applyTimeout: (farmerId) => {
    const { committeeDecisions, getDerivedState } = get();
    const updatedDecisions = applyCommitteeDecision(farmerId, 'TIMEOUT_RELEASED', committeeDecisions);
    const derived = getDerivedState();
    const newReceipt: MerkleReceipt = {
      timestamp: new Date().toISOString(),
      action: 'TIMEOUT_RELEASED',
      farmerId,
      leafHash: computeCanonicalLeafHex([farmerId, 'ZONE-A', 'WEEK10', '34.105263', '0.000000']),
      rootHash: derived.merkleRoot,
      allocatedHours: 34.11,
      escrowHours: 0.0,
    };

    set((state) => ({
      committeeDecisions: updatedDecisions,
      receipts: [newReceipt, ...state.receipts],
    }));
  },

  resetBaseline: () =>
    set({
      farmers: CANONICAL_FARMERS_BASE,
      pool: 130.0,
      step: 3,
      mode: 'STEP',
      dignityFloor: 0.0,
      committeeDecisions: { C: 'HELD' },
      selectedFarmerId: 'C',
    }),

  loadPreset: (presetId) => {
    if (presetId === 'BENCHMARK') {
      get().resetBaseline();
      return;
    }

    if (presetId === 'DEAD_METER') {
      set((state) => ({
        mode: 'LIVE',
        committeeDecisions: { C: 'NONE' },
        farmers: state.farmers.map((f) =>
          f.id === 'C' ? { ...f, E: null, metersOffline: true } : f
        ),
      }));
      return;
    }

    if (presetId === 'INCORRECT_DATA') {
      set((state) => ({
        mode: 'LIVE',
        farmers: state.farmers.map((f) => {
          if (f.id === 'A') return { ...f, R: 16.0, E: 32.0, metersOffline: false };
          if (f.id === 'C') return { ...f, R: 16.0, E: 52.0, metersOffline: false };
          return f;
        }),
      }));
      return;
    }

    if (presetId === 'SEVERE_STRESS') {
      set((state) => ({
        mode: 'LIVE',
        pool: 78.0,
        farmers: state.farmers.map((f) => {
          if (f.id === 'A') return { ...f, R: 35.0, E: 36.0, metersOffline: false };
          if (f.id === 'B') return { ...f, R: 35.0, E: 36.0, metersOffline: false };
          if (f.id === 'C') return { ...f, R: 45.0, E: 54.0, metersOffline: false };
          if (f.id === 'D') return { ...f, R: 40.0, E: 40.0, metersOffline: false };
          return f;
        }),
      }));
      return;
    }

    if (presetId === 'FLOOR_5') {
      set({
        mode: 'LIVE',
        pool: 104.0,
        dignityFloor: 5.0,
      });
      return;
    }

    if (presetId === 'DIFFERENT_CROPS') {
      set((state) => ({
        mode: 'LIVE',
        farmers: state.farmers.map((f) => {
          if (f.id === 'A') return { ...f, crop: 'Organic Soybean (JS-9560)' };
          if (f.id === 'B') return { ...f, crop: 'Drip Groundnut (TAG-24)' };
          if (f.id === 'C') return { ...f, crop: 'Perennial Orange Orchard' };
          if (f.id === 'D') return { ...f, crop: 'Desi Chickpea (Vijay)' };
          return f;
        }),
      }));
      return;
    }
  },

  importCsv: (csvContent) => {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) return { success: false, error: 'Empty or invalid CSV file' };
      const header = lines[0].toLowerCase();
      if (!header.includes('id') || !header.includes('reported')) {
        return { success: false, error: 'CSV must contain id and reported_hours columns' };
      }

      const updated = [...get().farmers];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((s) => s.trim());
        if (row.length < 2) continue;
        const id = row[0].toUpperCase();
        const farmerIdx = updated.findIndex((f) => f.id === id);
        if (farmerIdx !== -1) {
          const r = parseFloat(row[1]);
          const e = row[2] ? parseFloat(row[2]) : null;
          if (!isNaN(r)) updated[farmerIdx].R = r;
          if (e !== null && !isNaN(e)) {
            updated[farmerIdx].E = e;
            updated[farmerIdx].metersOffline = false;
          } else if (row[2] === '' || row[2]?.toLowerCase() === 'null') {
            updated[farmerIdx].E = null;
            updated[farmerIdx].metersOffline = true;
          }
        }
      }

      set({ farmers: updated, mode: 'LIVE' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to parse CSV' };
    }
  },

  initRuntimeData: async () => {
    // 1. Fetch public/data/zone-a/2026-10-02/provenance.json
    try {
      const provRes = await fetch('/data/zone-a/2026-10-02/provenance.json');
      if (provRes.ok) {
        const data = await provRes.json();
        set({ sceneProvenance: data, sceneProvenanceLoaded: true });
      } else {
        set({ sceneProvenance: null, sceneProvenanceLoaded: false });
      }
    } catch {
      set({ sceneProvenance: null, sceneProvenanceLoaded: false });
    }

    // 2. Fetch public/snapshot.json
    try {
      const snapRes = await fetch('/snapshot.json');
      if (snapRes.ok) {
        const snap = await snapRes.json();
        set({ snapshotLoaded: true });
      }
    } catch {
      set({ snapshotLoaded: false });
    }
  },

  getDerivedState: () => {
    const { farmers, pool, dignityFloor, committeeDecisions, Qi } = get();

    // 1. Canonical Land Totals
    const totalLandAcres = farmers.reduce((acc, f) => acc + f.land, 0); // 29.0
    const totalLandHa = Number((totalLandAcres * 0.404686).toFixed(1)); // 11.7 ha

    // 2. Trust Blend & Signals
    let reportedTotalHours = 0;
    let meterTotalHours = 0;
    let verifiedTotalHours = 0;

    const demands: number[] = [];
    const weights: number[] = [];
    const isReviewList: boolean[] = [];

    const preFarmers = farmers.map((f) => {
      const R = f.R;
      const E = f.metersOffline ? null : f.E;
      const blend = trustBlend(R, E);

      reportedTotalHours += R;
      meterTotalHours += E ?? R;
      verifiedTotalHours += blend.U;

      const isReview = blend.flags.includes('REVIEW') && f.id === 'C';
      isReviewList.push(isReview);

      const decision = committeeDecisions[f.id] || 'NONE';
      // If Committee already confirmed violation on C, demand is capped at undisputed base min(R, E) = 20.0h
      let demand = blend.U;
      if (f.id === 'C' && decision === 'CONFIRMED') {
        demand = Math.min(R, E ?? R);
      }
      demands.push(demand);
      weights.push(f.land / totalLandAcres);

      return {
        ...f,
        T: blend.T !== null ? blend.T : 0.5,
        lambda: blend.lambda !== null ? blend.lambda : 0.0,
        U: blend.U,
        mismatch: blend.mismatch !== null ? blend.mismatch : 0.0,
        flags: blend.flags,
      };
    });

    // 3. Water-Filling with Floor
    const wf = waterFill(demands, weights, pool, dignityFloor);
    const rawAllocations = wf.allocations;

    // 4. Escrow Split
    const reportsList = farmers.map((f) => f.R);
    const metersList = farmers.map((f) => (f.metersOffline ? null : f.E));
    const escrowRes = escrowSplit(rawAllocations, reportsList, metersList, isReviewList);

    let totalAllocatedHours = 0;
    let totalEscrowHours = 0;

    const leafItems: { id: string; label: string; payload: string; fields?: string[] }[] = [];

    const derivedFarmers: DerivedFarmer[] = preFarmers.map((f, idx) => {
      const rawAlloc = rawAllocations[idx];
      const rel = escrowRes.released[idx];
      const esc = escrowRes.escrow[idx];
      const decision = committeeDecisions[f.id] || 'NONE';

      let allocatedHours = rawAlloc;
      let escrowHours = 0;
      let escrowStatus: EscrowStatus = decision;

      if (f.id === 'C' && isReviewList[idx]) {
        if (decision === 'CONFIRMED') {
          allocatedHours = Math.min(f.R, f.E ?? f.R); // 20.0
          escrowHours = 0;
          escrowStatus = 'CONFIRMED';
        } else if (decision === 'DISMISSED' || decision === 'TIMEOUT_RELEASED') {
          allocatedHours = rawAlloc; // 34.11
          escrowHours = 0;
          escrowStatus = decision;
        } else {
          // HELD
          allocatedHours = rel; // 20.0
          escrowHours = esc; // 14.1
          escrowStatus = 'HELD';
        }
      }

      totalAllocatedHours += allocatedHours;
      totalEscrowHours += escrowHours;

      const leafFields = [
        f.id,
        'ZONE-A',
        'WEEK10',
        allocatedHours.toFixed(6),
        escrowHours.toFixed(6),
      ];

      const leafHash = computeCanonicalLeafHex(leafFields);

      leafItems.push({
        id: f.id,
        label: `${f.name} (Plot ${f.id})`,
        payload: `farmer:${f.id};alloc:${allocatedHours.toFixed(2)};escrow:${escrowHours.toFixed(2)}`,
        fields: leafFields,
      });

      let flagReason: string | null = null;
      let isFlagged = false;

      if (f.flags.includes('REVIEW')) {
        isFlagged = true;
        flagReason = `GRID_DISCREPANCY: Meter recorded ${f.E} h vs ${f.R} h reported (+${((f.E ?? 0) - f.R).toFixed(1)} h). Corroborated by Sentinel-2 NDVI (${f.satelliteNdvi.toFixed(3)}).`;
      } else if (f.flags.includes('NO_METER')) {
        isFlagged = true;
        flagReason = 'TELEMETRY_OFFLINE: Smart meter offline. Kept at reported claim pending manual read.';
      }

      return {
        id: f.id,
        name: f.name,
        phone: f.phone,
        crop: f.crop,
        areaHa: f.areaHa,
        landAcres: f.land,
        wellId: f.wellId,
        feederId: f.feederId,
        lat: f.lat,
        lng: f.lng,
        wellCoord: f.wellCoord,
        polygon: f.polygon,
        reportedHours: f.R,
        meterHours: f.E,
        isMeterMissing: f.metersOffline,
        meterDiscrepancyDelta: f.E !== null ? f.E - f.R : 0,
        satelliteNdvi: f.satelliteNdvi,
        satelliteImpliedHours: f.E !== null ? Number((f.E * 0.96).toFixed(1)) : f.R,
        dischargeRateLps: 15.0,
        dischargeM3PerHour: Qi,
        reportedVolumeM3: Math.round(f.R * Qi),
        verifiedVolumeM3: Math.round(f.U * Qi),
        trustScore: f.T,
        isFlagged,
        flagReason,
        dignityFloorHours: dignityFloor > 0 ? dignityFloor : (f.land / totalLandAcres) * 25.0,
        landShareRatio: f.land / totalLandAcres,
        preliminaryEntitlementHours: Number(rawAlloc.toFixed(2)),
        allocatedHours: Number(allocatedHours.toFixed(2)),
        escrowHours: Number(escrowHours.toFixed(2)),
        escrowStatus,
        committeeVerdict: decision !== 'NONE' ? decision as any : undefined,
        drawdownDepthMeters: Number((3.5 + (allocatedHours / 30) * 2.5).toFixed(2)),
        interferenceOverheadKwh: Number((6.0 + (allocatedHours / 30) * 10.0).toFixed(1)),
        leafHash,
        R: f.R,
        E: f.E,
        metersOffline: f.metersOffline,
        T: f.T,
        lambda: f.lambda,
        U: f.U,
        mismatch: f.mismatch,
      };
    });

    // 5. State of Extraction (SOE) relative to B_REF = 130.0 hours
    const B_REF = 130.0;
    const reportedStressRatio = reportedTotalHours / B_REF; // 116 / 130 = 0.8923
    const reportedTier = getWaterTier(reportedStressRatio); // Semi-critical

    const meterStressRatio = meterTotalHours / B_REF; // 144 / 130 = 1.1077
    const meterTier = getWaterTier(meterStressRatio); // Over-exploited

    const verifiedStressRatio = verifiedTotalHours / B_REF; // 133.895 / 130 = 1.02996
    const verifiedTier = getWaterTier(verifiedStressRatio); // Over-exploited

    const isFlipped = verifiedTier !== reportedTier;

    // 6. Drawdown & Well Interference
    const wellNodes = derivedFarmers.map((f) => ({
      id: f.wellId,
      farmerId: f.id,
      lat: f.wellCoord[0],
      lng: f.wellCoord[1],
      depthM: 45,
      pumpingHours: f.allocatedHours,
      dischargeLps: 15.0,
    }));
    const drawdownResults = computeAquiferDrawdown(wellNodes, 120, 0.015, 7, 18.5);

    // 7. Merkle Tree & Root
    const merkleTreeResult = buildMerkleTree(leafItems);
    const merkleRoot = merkleTreeResult.root.hash;

    // 8. Dynamic Step Sentences per Contradictions 6, 7, 8
    const farmerC = derivedFarmers.find((f) => f.id === 'C') || derivedFarmers[2];
    const farmerCMismatch = farmerC.mismatch > 0.5;

    const step1Sentence = `Self-reported pumping totals ${reportedTotalHours.toFixed(1)} h. Extraction at ${(reportedStressRatio * 100).toFixed(1)}% is below the cap, already ${reportedTier}.`;
    const step2Sentence = `Simulated smart-meter telemetry records ${meterTotalHours.toFixed(1)} h total. Sentinel-2 NDVI shown as corroboration only.`;
    const step3Sentence = farmerCMismatch
      ? `Meter recorded ${farmerC.meterHours?.toFixed(1) ?? 'offline'} h vs ${farmerC.reportedHours.toFixed(1)} h reported (+${((farmerC.meterHours ?? 0) - farmerC.reportedHours).toFixed(1)} h). Zone moves to ${verifiedTier}.`
      : 'Verification agrees with reports.';
    const step4Sentence = `Max-min water filling allocates pool (${pool.toFixed(1)} h). Farmer C receives ${farmerC.allocatedHours.toFixed(1)} h guaranteed base; ${farmerC.escrowHours.toFixed(1)} h held in escrow pending Gram Panchayat review.`;

    const totalUnusedHours = Math.max(0, pool - totalAllocatedHours);

    const summary: ZoneSummary = {
      reportedTotalHours: Number(reportedTotalHours.toFixed(1)),
      reportedTotalM3: Math.round(reportedTotalHours * Qi),
      reportedStressRatio: Number(reportedStressRatio.toFixed(3)),
      reportedTier,
      verifiedTotalHours: Number(verifiedTotalHours.toFixed(1)),
      verifiedTotalM3: Math.round(verifiedTotalHours * Qi),
      verifiedStressRatio: Number(verifiedStressRatio.toFixed(3)),
      verifiedTier,
      totalAllocatedHours: Number(totalAllocatedHours.toFixed(1)),
      totalEscrowHours: Number(totalEscrowHours.toFixed(1)),
      totalAllocatedM3: Math.round(totalAllocatedHours * Qi),
      totalEscrowM3: Math.round(totalEscrowHours * Qi),
      isFlipped,
      flipDeltaHours: Number((verifiedTotalHours - reportedTotalHours).toFixed(1)),
      flipDeltaM3: Math.round((verifiedTotalHours - reportedTotalHours) * Qi),
      merkleRoot,
      timestamp: new Date().toISOString(),
    };

    const config: ZoneBudgetConfig = {
      zoneId: 'ZONE-A',
      zoneName: 'Zone-A (Wardha, Maharashtra)',
      district: 'Wardha',
      state: 'Maharashtra',
      centroid: [20.782, 78.558],
      weeklyBudgetM3: Math.round(pool * Qi),
      weeklyBudgetHoursEq: pool,
      aquiferTransmissivityM2Day: 120,
      aquiferStorativity: 0.015,
      baseWaterTableDepthM: 18.5,
      currentRechargeRateMm: 12.4,
      conformalAlpha: 0.1,
      overdrawCorrectionFactor: 0.952,
    };

    return {
      derivedFarmers,
      totalLandAcres,
      totalLandHa,
      reportedTotalHours,
      reportedTotalM3: Math.round(reportedTotalHours * Qi),
      reportedStressRatio,
      reportedTier,
      meterTotalHours,
      meterTotalM3: Math.round(meterTotalHours * Qi),
      meterStressRatio,
      meterTier,
      verifiedTotalHours,
      verifiedTotalM3: Math.round(verifiedTotalHours * Qi),
      verifiedStressRatio,
      verifiedTier,
      totalAllocatedHours,
      totalAllocatedM3: Math.round(totalAllocatedHours * Qi),
      totalEscrowHours,
      totalEscrowM3: Math.round(totalEscrowHours * Qi),
      totalUnusedHours,
      isFlipped,
      merkleRoot,
      merkleTree: merkleTreeResult.root,
      drawdownResults,
      step1Sentence,
      step2Sentence,
      step3Sentence,
      step4Sentence,
      summary,
      config,
    };
  },
}));
